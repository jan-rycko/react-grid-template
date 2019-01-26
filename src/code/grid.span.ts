import {IGridElementsRange, IGridSize, IGridSizeFraction, IGridStyle, TemplateDirection} from './grid.model';
import reduce from 'lodash-es/reduce';
import {addGridSizes} from './grid.math';
import {getGutterProperties, getSecondDirection, gutterProperties, sizeProperty} from './grid.mappers';

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
    let gutterToAdd: IGridSize = {};
    const { marginBefore, paddingBefore, marginAfter, paddingAfter } = getGutterProperties(size, direction);
    const directionSizeProperty = sizeProperty[direction];
    const acrossDirectionSizeProperty = sizeProperty[getSecondDirection(direction)];
    const acrossDirectionSize = size[acrossDirectionSizeProperty];

    if (isPartEnd) {
        gutterToAdd = addGridSizes(marginBefore, paddingBefore);
    }

    if (isPartStart) {
        gutterToAdd = addGridSizes(marginAfter, paddingAfter);
    }

    const directionSize = reduce(size[directionSizeProperty], (acc, value, unit) => {
        if (typeof value !== 'number') return acc;

        let prevValue = 0;

        if (acc[unit]) {
            prevValue = acc[unit];
        }

        return {
            ...acc,
            [unit]: prevValue + value * fraction,
        };
    }, gutterToAdd);

    return {
        [directionSizeProperty]: directionSize,
        [acrossDirectionSizeProperty]: acrossDirectionSize,
    }
};

const mergeToSingleSize = (styles: IGridStyle[], direction: TemplateDirection): IGridStyle => {
    const lastIndex = styles.length - 1;
    const directionSizeProperty = sizeProperty[direction];
    const [ gutterBefore, gutterAfter ] = gutterProperties[direction];

    return styles.reduce((finalSize, style, index) => {
        const { marginBefore, marginAfter, paddingBefore, paddingAfter } = getGutterProperties(style, direction);
        const directionSize = style[directionSizeProperty];

        let sizeToAdd: IGridSize = { ...directionSize };

        if (paddingBefore || marginBefore) {
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
                sizeToAdd = addGridSizes(sizeToAdd, marginBefore, paddingBefore);
            }
        }

        if (paddingAfter || marginAfter) {
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
                sizeToAdd = addGridSizes(sizeToAdd, paddingAfter, marginAfter);
            }
        }

        return {
            ...finalSize,
            [directionSizeProperty]: addGridSizes(finalSize[directionSizeProperty], sizeToAdd),
        };
    }, { margin: {}, padding: {} });
};