import {
    IGridElementsRange,
    IGridSize,
    IGridSizeFraction,
    IGridStyle,
    TemplateDirection,
    TemplateGutter,
} from './grid.model';
import reduce from 'lodash-es/reduce';
import {addGridSizes, subtractGridSizes} from './grid.math';
import {
    getGutterGridStyle,
    getGutterProperties,
    getSizeProperties,
    gutterProperties,
} from './grid.mappers';
import isEmpty from 'lodash-es/isEmpty';

class GridSpan {
    gridStyles: IGridStyle[];
    spanTemplate: number[];
    direction: TemplateDirection;

    constructor(spanTemplate: number[], gridStyles: IGridStyle[], direction: TemplateDirection) {
        this.spanTemplate = spanTemplate;
        this.gridStyles = gridStyles;
        this.direction = direction;
    }

    getStyles() {
        let spanSoFar = 0;

        return this.spanTemplate.reduce((acc, span) => {
            acc.push(this.calculateSizeWithSpan({ span, spanSoFar }));

            spanSoFar += span;

            return acc;
        }, []);
    }

    calculateSizeWithSpan = ({spanSoFar, span}: {
        span: number,
        spanSoFar: number,
    }): IGridStyle => {
        const { start, end, startFraction, endFraction } = this.getListPart(span, spanSoFar);

        const spannedSizesWithOverlap = this.gridStyles.slice(start, end);
        const length = spannedSizesWithOverlap.length;

        const spannedSizes = spannedSizesWithOverlap.map((size, i) => {

            if (startFraction && endFraction && length === 1) {
                return this.getSizePart(size, { fraction: endFraction - startFraction });
            }

            if (startFraction && i === 0) {
                return this.getSizePart(size, { fraction: startFraction, isPartStart: true });
            }

            if (endFraction && i === length - 1) {
                return this.getSizePart(size, { fraction: endFraction, isPartEnd: true });
            }

            return size;
        });

        return this.mergeToSingleSize(spannedSizes);
    };

    getListPart = (span: number, spanSoFar: number): IGridElementsRange => {
        const start = Math.floor(spanSoFar);
        const end = Math.min(Math.ceil(spanSoFar + span), this.gridStyles.length);
        const startFraction = spanSoFar % 1;
        const endFraction = (spanSoFar + span) % 1;

        return {
            start,
            startFraction: startFraction !== 1 ? startFraction : null,
            end,
            endFraction: endFraction !== 0 ? endFraction : null,
        }
    };

    getSizePart = (
        size: IGridStyle,
        {fraction, isPartEnd, isPartStart}: IGridSizeFraction,
    ): IGridStyle => {
        let gutterToSubtract: IGridSize = {};
        const { sizeAlong, sizeAcross } = getSizeProperties(this.direction);
        const { marginBefore, paddingBefore, marginAfter, paddingAfter } = getGutterProperties(size, this.direction);
        const acrossDirectionSize = size[sizeAcross];

        if (isPartEnd) {
            gutterToSubtract = subtractGridSizes({}, marginBefore);
        }

        if (isPartStart) {
            gutterToSubtract = subtractGridSizes({}, marginBefore);
        }

        const directionSize = reduce(size[sizeAlong], (acc, value, unit) => {
            if (typeof value !== 'number') return acc;

            let prevValue = 0;

            if (acc[unit]) {
                prevValue = acc[unit];
            }

            return {
                ...acc,
                [unit]: prevValue + value * fraction,
            };
        }, gutterToSubtract);

        return {
            [sizeAlong]: directionSize,
            [sizeAcross]: acrossDirectionSize,
            ...getGutterGridStyle(this.direction, TemplateGutter.Padding, paddingBefore, paddingAfter),
            ...getGutterGridStyle(this.direction, TemplateGutter.Margin, marginBefore, marginAfter),
        }
    };

    mergeToSingleSize = (styles: IGridStyle[]): IGridStyle => {
        const lastIndex = styles.length - 1;
        const { sizeAlong } = getSizeProperties(this.direction);
        const [ gutterBefore, gutterAfter ] = gutterProperties[this.direction];

        return styles.reduce((finalSize, style, index) => {
            const { marginBefore, marginAfter, paddingBefore, paddingAfter } = getGutterProperties(style, this.direction);
            const directionSize = style[sizeAlong];

            let sizeToAdd: IGridSize = { ...directionSize };

            if (!isEmpty(paddingBefore) || !isEmpty(marginBefore)) {
                if (index === 0) {
                    finalSize = {
                        ...finalSize,
                        margin: {
                            ...finalSize.margin,
                            [gutterBefore]: marginBefore,
                        },
                        padding: {
                            ...finalSize.padding,
                            [gutterBefore]: paddingBefore,
                        },
                    };
                } else {
                    sizeToAdd = addGridSizes(sizeToAdd, marginBefore);
                }
            }

            if (!isEmpty(paddingAfter) || !isEmpty(marginAfter)) {
                if (index === lastIndex) {
                    finalSize = {
                        ...finalSize,
                        margin: {
                            ...finalSize.margin,
                            [gutterAfter]: marginAfter,
                        },
                        padding: {
                            ...finalSize.padding,
                            [gutterAfter]: paddingAfter,
                        },
                    };
                } else {
                    sizeToAdd = addGridSizes(sizeToAdd, marginAfter);
                }
            }

            return {
                ...finalSize,
                [sizeAlong]: addGridSizes(finalSize[sizeAlong], sizeToAdd),
            };
        }, { margin: {}, padding: {} });
    };
}

export default GridSpan;