import {CSSProperties} from 'react';
import reduce from 'lodash-es/reduce';
import forEach from 'lodash-es/forEach';
import {
    GridUnit,
    gridUnitRegExpPart,
    gridUnits,
    GritConstantUnit,
    IGridElementsRange,
    IGridSize,
    IGridSizeFraction,
    IGridSizeWithMargin,
    IGridStyle,
    IGridTemplate,
    IGridTemplateDescriptor,
    IGutterStyle,
    TemplateDirection,
    TemplateGutter,
} from './grid.model';
import cloneDeep from 'lodash-es/cloneDeep';
import isPlainObject from 'lodash-es/isPlainObject';
import upperFirst from 'lodash-es/upperFirst';
import {BoxSizingProperty} from 'csstype';
import words from 'lodash-es/words';

const isConstantUnit = (unit: GridUnit): unit is GritConstantUnit => {
    return gridUnits.includes(unit) && !isFractionUnit(unit);
};

const isFractionUnit = (unit: GridUnit): unit is GridUnit.Fr => {
    return unit === GridUnit.Fr;
};

const isGridSize = (value: any): value is IGridSizeWithMargin => {
    return isPlainObject(value);
};

export const getGridStyle = (
    {
        gridTemplate,
        spanTemplate,
        gutter,
        gutterAs = TemplateGutter.Padding,
        direction = TemplateDirection.Row,
    }: IGridTemplateDescriptor,
): CSSProperties[] => {
    if (!gridTemplate) {
        return [];
    }

    let sizes: IGridStyle[] = getGridTemplateSizes(gridTemplate, gutter, gutterAs, direction);

    if (spanTemplate) {
        sizes = calculateSizesWithSpanTemplate(sizes, spanTemplate, direction);
    }

    return getSizesAsCSSProperties(direction, sizes);
};

const getExpressionValueRegex = (value: string): RegExp => {
    const operationsCount = (value.match(/ [-+] /g) || []).length;

    return new RegExp(`^(\\d+)${gridUnitRegExpPart}${` ([-+]) (\\d+)${gridUnitRegExpPart}`.repeat(operationsCount)}$`);
};

const getValueFromExpressionPart = (expression: string, fraction: number = 1) => {
    const [
        eq = '',
        value1 = '',
        unit1 = '',
        // tslint:disable-next-line:trailing-comma
        ...parts
    ] = expression.match(getExpressionValueRegex(expression)) || [];

    if (!eq) {
        return {};
    }

    const unitsAndValues: IGridSize = { [unit1]: Number(value1) * fraction };

    let sign: number;
    let numberValue: number;
    let unit: string;

    parts.forEach((elem, index) => {
        const elemIndex = index % 3;

        switch (elemIndex) {
            case 0:
                sign = elem === '-' ? -1 : 1;
                break;
            case 1:
                numberValue = Number(elem) * fraction;
                break;
            case 2:
                unit = elem;

                const currentValue = unitsAndValues[unit] || 0;

                unitsAndValues[unit] = currentValue + sign * numberValue;
                break;
        }
    });

    return unitsAndValues;
};

const expressionWordRegExp = /\.?\d+\w*( [-+] \.?\d+\w*)*/g;

const getExpressionAsStyle = (value: string | number, direction: TemplateDirection): IGridStyle => {
    if (!value) return {};
    if (typeof value === 'number') {
        return { [sizeProperty[direction]]: { [GridUnit.Px]: value } };
    }

    const isEmptySpace = value.substr(0, 2) === '. ';
    const expression = isEmptySpace ? value.replace('. ', '') : value;
    const [ width, height, depth ] = words(expression, expressionWordRegExp);

    return {
        width: width ? getValueFromExpressionPart(width) : {},
        height: height ? getValueFromExpressionPart(height) : {},
        depth: depth ? getValueFromExpressionPart(depth) : {},
        isEmptySpace,
    };
};

interface IStatsAndSizes {
    directionStats: IGridSize
    styleMapWithEmptySpaces: IGridStyle[]
}

const getGridStatsAndSizesWithEmptySpaces = (
    gridTemplate: IGridTemplate,
    gutter: string | string[] = '',
    gutterAs: TemplateGutter = TemplateGutter.Padding,
    direction: TemplateDirection = TemplateDirection.Row,
): IStatsAndSizes => {
    const styleMapWithEmptySpaces: IGridStyle[] = [];
    let directionStats: IGridSize = {};
    let after: IGridSize = {};
    let before: IGridSize = {};
    let halfGutter: IGridSize = {};
    let checkGutter = true;
    let cellStyle: IGridStyle;
    const lastElementIndex = gridTemplate.length - 1;

    if (!Array.isArray(gutter)) {
        checkGutter = false;

        if (typeof gutter === 'string') {
            halfGutter = getValueFromExpressionPart(gutter, .5);
            after = cloneDeep(halfGutter);
            before = cloneDeep(halfGutter);
        }
    }

    gridTemplate.forEach((sizeDescriptor, index) => {
        if (typeof sizeDescriptor === 'string') {
            cellStyle = getExpressionAsStyle(sizeDescriptor, direction);
        } else {
            cellStyle = sizeDescriptor;
        }

        if (checkGutter && Array.isArray(gutter) && gutter[index]) {
            halfGutter = getValueFromExpressionPart(gutter[index], .5);
            checkGutter = false;
            after = cloneDeep(halfGutter);
            before = cloneDeep(halfGutter);
        }

        if (index === 0) {
            before = {};
        } else if (index === 1) {
            before = cloneDeep(halfGutter)
        }

        if (index === lastElementIndex) {
            after = {};
        }

        directionStats = addGridSizes(
            directionStats,
            cellStyle[sizeProperty[direction]],
            before,
            after,
        );

        styleMapWithEmptySpaces[index] = {
            ...cellStyle,
            ...getGutterGridStyle(direction, gutterAs, before, after),
        };
    });

    return { directionStats, styleMapWithEmptySpaces }
};

const sizeProperty = {
    [TemplateDirection.Row]: 'width',
    [TemplateDirection.Column]: 'height',
};

const getSecondDirection = (direction: TemplateDirection): TemplateDirection => {
    return direction === TemplateDirection.Row ? TemplateDirection.Column : TemplateDirection.Row;
};

const gutterProperties = {
    [TemplateDirection.Row]: ['left', 'right'],
    [TemplateDirection.Column]: ['top', 'bottom'],
};

const getGutterGridStyle = (
    direction: TemplateDirection,
    gutterAs: TemplateGutter,
    before: IGridSize,
    after: IGridSize,
): IGridStyle => {
    const [ gutterBefore, gutterAfter ] = gutterProperties[direction];
    return {
        [gutterAs]: {
            [gutterBefore]: before,
            [gutterAfter]: after,
        },
    }
};

const getGutterProperties = ({ margin = {}, padding = {} }: IGridStyle = {}, direction: TemplateDirection) => {
    const [ before, after ] = gutterProperties[direction];

    return {
        marginBefore: margin[before] || {},
        marginAfter: margin[after] || {},
        paddingBefore: padding[before] || {},
        paddingAfter: padding[after] || {},
    }
};

const convertEmptySpacesToMargin = (gridWithEmptySpaces: IGridStyle[], direction: TemplateDirection): IGridStyle[] => {
    let sizes: IGridStyle[] = [];
    let elemIndex = 0;
    let baseSize: IGridStyle = {};

    gridWithEmptySpaces.forEach((size, index) => {
        baseSize = cloneDeep(size);

        if (!baseSize.isEmptySpace) {
            elemIndex++;
            sizes = [
                ...sizes,
                baseSize,
            ];

            return;
        }

        const { paddingBefore, paddingAfter, marginBefore, marginAfter } = getGutterProperties(baseSize, direction);
        const directionSize = baseSize[sizeProperty[direction]];
        const [ gutterBefore, gutterAfter ] = gutterProperties[direction];

        const placeholderSize = addGridSizes(directionSize, paddingBefore, paddingAfter, marginBefore, marginAfter);

        if (sizes[elemIndex - 1]) {
            if (!sizes[elemIndex - 1].margin) sizes[elemIndex - 1].margin = {};

            sizes[elemIndex - 1].margin[gutterAfter] =
                addGridSizes(placeholderSize, sizes[elemIndex - 1].margin[gutterAfter]);
        } else if (gridWithEmptySpaces[index + 1]) {
            gridWithEmptySpaces[index + 1].margin[gutterBefore] =
                addGridSizes(placeholderSize, gridWithEmptySpaces[index + 1].margin[gutterBefore]);
        }

    });

    return sizes;
};

const getGridTemplateSizes = (
    gridTemplate: IGridTemplate,
    gutter?: string | string[],
    gutterAs: TemplateGutter = TemplateGutter.Padding,
    direction: TemplateDirection = TemplateDirection.Row,
): IGridStyle[] => {
    const {
        directionStats,
        styleMapWithEmptySpaces,
    } = getGridStatsAndSizesWithEmptySpaces(gridTemplate, gutter, gutterAs, direction);

    const styleMap = convertEmptySpacesToMargin(styleMapWithEmptySpaces, direction);

    return styleMap.map(style => {
        const { paddingBefore, paddingAfter, marginBefore, marginAfter } = getGutterProperties(style, direction);
        const [ gutterBefore, gutterAfter ] = gutterProperties[direction];
        const directionSizeProperty = sizeProperty[direction];
        const acrossDirectionSizeProperty = sizeProperty[getSecondDirection(direction)];

        return {
            [directionSizeProperty]: getConstantUnitSizeFromStats(style[directionSizeProperty], directionStats),
            [acrossDirectionSizeProperty]: style[acrossDirectionSizeProperty],
            padding: {
                [gutterBefore]: getConstantUnitSizeFromStats(paddingBefore, directionStats),
                [gutterAfter]: getConstantUnitSizeFromStats(paddingAfter, directionStats),
            },
            margin: {
                [gutterBefore]: getConstantUnitSizeFromStats(marginBefore, directionStats),
                [gutterAfter]: getConstantUnitSizeFromStats(marginAfter, directionStats),
            },
        };
    });
};

const getConstantUnitSizeFromStats = ({ fr = 0, ...constantUnits }: IGridSize, flexGridStats: IGridSize): IGridSize => {
    if (fr === 0) {
        return {
            ...constantUnits,
        };
    }

    const fraction = fr / flexGridStats[GridUnit.Fr];

    return reduce(flexGridStats, (acc, statValue, statUnit) => {
        if (!isConstantUnit(statUnit as GridUnit)) return acc;

        const currentUnitValue = constantUnits[statUnit] || 0;
        const diffValue = -statValue * fraction + 2 * currentUnitValue;

        if (statUnit === GridUnit.Percent) {
            return {
                ...acc,
                [GridUnit.Percent]: acc[statUnit] + diffValue,
            }
        }

        return { ...acc, [statUnit]: diffValue };
    }, { [GridUnit.Percent]: 100 * fraction });
};

const getGutterStyle = (gutterName: TemplateGutter, gutterStyle: IGutterStyle): CSSProperties => {
    return reduce(gutterStyle, (acc, size, direction) => {
        return {
            ...acc,
            [`${gutterName}${upperFirst(direction)}`]: getCSSValue(size),
        };
    }, {});
};

const getSizesAsCSSProperties = (
    direction: TemplateDirection,
    sizes: IGridStyle[],
): CSSProperties[] => sizes.map(({ margin, padding, isEmptySpace, ...size }) => ({
    ...getSizeStyle(size, direction),
    boxSizing: 'content-box' as BoxSizingProperty,
    ...getGutterStyle(TemplateGutter.Margin, margin),
    ...getGutterStyle(TemplateGutter.Padding, padding),
}));

const getSizeStyle = (size: IGridStyle, direction: TemplateDirection) => {
    const directionSizeProp = sizeProperty[direction];
    const directionSize = size[directionSizeProp];
    const directionStyle = getCSSValue(directionSize);
    const acrossDirectionSizeProp = sizeProperty[getSecondDirection(direction)];
    const acrossDirectionSize = size[acrossDirectionSizeProp];
    const acrossDirectionStyle = getCSSValue(acrossDirectionSize);

    return {
        [directionSizeProp]: directionStyle,
        ...(acrossDirectionStyle ? { [acrossDirectionSizeProp]: acrossDirectionStyle } : {}),
    }
};

const getCSSValue = (size: IGridSize) => {
    const calcPrefix = 'calc(';
    const calcSuffix = ')';
    let parts = 0;

    const expression = reduce(size, (acc, value, unit) => {
        if (typeof value === 'boolean') return acc;

        parts += 1;

        const sign = Math.sign(value) === -1 ? '-' : '+';
        const absValue = Math.abs(value);
        const formattedSign = acc === '' ? sign : ` ${sign} `;

        return `${acc}${formattedSign}${absValue}${unit}`;
    }, '');

    const isCalcValue = parts > 1;

    return `${isCalcValue ? calcPrefix : ''}${expression}${isCalcValue ? calcSuffix : ''}`;
};

const calculateSizesWithSpanTemplate = (
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

const addSingleGridSize = (baseSize: IGridSizeWithMargin, sizeToAdd: IGridSize): IGridSizeWithMargin => {
    const size = cloneDeep(baseSize);

    forEach(sizeToAdd, (value, unit) => {
        if (typeof value === 'boolean') return;
        if (!size[unit]) size[unit] = 0;

        size[unit] += value;
    });

    return size;
};

const addGridSizes = (baseSize: IGridSizeWithMargin = {}, ...sizesToAdd: IGridSize[]): IGridSizeWithMargin => {
    let size = cloneDeep(baseSize);

    sizesToAdd.forEach(sizeToAdd => {
        if (!sizeToAdd) return;

        size = addSingleGridSize(size, sizeToAdd);
    });

    return size;
};