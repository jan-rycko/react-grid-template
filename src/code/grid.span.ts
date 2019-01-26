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

export const calculateSizesWithSpanTemplate = (
    styles: IGridStyle[],
    spanTemplate: number[],
    direction = TemplateDirection.Row,
): IGridStyle[] => {
    let spanSoFar = 0;

    return spanTemplate.reduce((acc, span) => {
        acc.push(calculateSizeWithSpan(styles, span, spanSoFar, direction));

        spanSoFar += span;

        return acc;
    }, []);
};

const getListPart = (span: number, spanSoFar: number): IGridElementsRange => {
    const start = Math.floor(spanSoFar);
    const end = Math.ceil(spanSoFar + span);
    const startFraction = 1 - (spanSoFar % 1);
    const endFraction = (spanSoFar + span) % 1;

    return {
        start,
        startFraction: startFraction !== 1 ? startFraction : null,
        end,
        endFraction: endFraction !== 0 ? endFraction : null,
    }
};

const calculateSizeWithSpan = (
    sizes: IGridStyle[],
    span: number,
    spanSoFar: number,
    direction = TemplateDirection.Row,
): IGridStyle => {
    const { start, end, startFraction, endFraction } = getListPart(span, spanSoFar);

    const spannedSizesWithOverlap = sizes.slice(start, end);
    const length = spannedSizesWithOverlap.length;

    const spannedSizes = spannedSizesWithOverlap.map((size, i) => {

        if (startFraction && endFraction && length === 1) {
            return getSizePart(size, { fraction: endFraction - startFraction }, direction);
        }

        if (startFraction && i === 0) {
            return getSizePart(size, { fraction: startFraction, isPartStart: true }, direction);
        }

        if (endFraction && i === length - 1) {
            return getSizePart(size, { fraction: endFraction, isPartEnd: true }, direction);
        }

        return size;
    });

    return mergeToSingleSize(spannedSizes, direction);
};

const getSizePart = (
    size: IGridStyle,
    {fraction, isPartEnd, isPartStart}: IGridSizeFraction,
    direction = TemplateDirection.Row,
): IGridStyle => {
    let gutterToSubtract: IGridSize = {};
    const { sizeAlong, sizeAcross } = getSizeProperties(direction);
    const { marginBefore, paddingBefore, marginAfter, paddingAfter } = getGutterProperties(size, direction);
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
        ...getGutterGridStyle(direction, TemplateGutter.Padding, paddingBefore, paddingAfter),
        ...getGutterGridStyle(direction, TemplateGutter.Margin, marginBefore, marginAfter),
    }
};

const mergeToSingleSize = (styles: IGridStyle[], direction: TemplateDirection): IGridStyle => {
    const lastIndex = styles.length - 1;
    const { sizeAlong } = getSizeProperties(direction);
    const [ gutterBefore, gutterAfter ] = gutterProperties[direction];

    return styles.reduce((finalSize, style, index) => {
        const { marginBefore, marginAfter, paddingBefore, paddingAfter } = getGutterProperties(style, direction);
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