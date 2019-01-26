import {GridUnit, IGridSize, IGridStyle, IGridTemplate, TemplateDirection, TemplateGutter} from './grid.model';
import {
    getGutterGridStyle,
    getGutterProperties,
    getSizeProperties,
    gutterProperties,
    IGutterProperties,
} from './grid.mappers';
import reduce from 'lodash-es/reduce';
import {addGridSizes} from './grid.math';
import {expressionWordRegExp, getExpressionAsStyle, getSizeFromExpression} from './grid.expression';
import {isConstantUnit} from './grid.typescript-helpers';
import words from 'lodash-es/words';
import isEmpty from 'lodash-es/isEmpty';

export const getGridTemplateSizes = (
    gridTemplate: IGridTemplate,
    marginGutter?: string | string[],
    paddingGutter?: string | string[],
    direction: TemplateDirection = TemplateDirection.Row,
): IGridStyle[] => {
    const {
        directionStats,
        styleMap,
    } = getGridStyleMapWithStats(gridTemplate, marginGutter, paddingGutter, direction);

    return styleMap.map(style => getFullGridStyleFromStats(style, directionStats, direction));
};

interface IStatsAndSizes {
    directionStats: IGridSize
    styleMap: IGridStyle[]
}

const getGutterExpressionByIndex = (gutter: string[] | string, index: number) => {
    return Array.isArray(gutter) ? gutter[index] || gutter[gutter.length - 1] : gutter;
};

const addGutterSizes = (
    gutterProperties: IGutterProperties,
    gutter: string,
    gutterType: TemplateGutter,
): IGutterProperties => {
    const gutterSize = getSizeFromExpression(gutter, .5);

    return {
        ...gutterProperties,
        [`${gutterType}Before`]: { ...gutterSize},
        [`${gutterType}After`]: { ...gutterSize},
    }
};

const getMarginFromEmptySpace = (emptySpace: IGutterProperties, marginGutter: string | string[]): IGridSize => {
    return emptySpace.position.reduce((acc, pos) => addGridSizes(acc,
        getSizeFromExpression(
            getGutterExpressionByIndex(marginGutter, pos)
        )
    ), {});
};

const getGutterSizes = ({ marginGutter, paddingGutter, length, emptySpaces, gridPositions }: {
    marginGutter: string | string[],
    paddingGutter: string | string[],
    length: number,
    emptySpaces: IGutterProperties[],
    gridPositions: Record<number, number>,
}): IGutterProperties[] => {
    let gutterProperties: IGutterProperties = {};

    if (typeof marginGutter === 'string') {
        gutterProperties = addGutterSizes(gutterProperties, marginGutter, TemplateGutter.Margin);
    }

    if (typeof paddingGutter === 'string') {
        gutterProperties = addGutterSizes(gutterProperties, paddingGutter, TemplateGutter.Padding);
    }

    return new Array(length).fill(null).map((_, index) => {
        let gutterFromProp = {...gutterProperties};
        let gutterFromEmptySpaces: IGutterProperties = {};

        if (Array.isArray(marginGutter)) {
            gutterFromProp = addGutterSizes(
                gutterFromProp,
                getGutterExpressionByIndex(marginGutter, gridPositions[index]),
                TemplateGutter.Margin,
            )
        }

        if (Array.isArray(paddingGutter)) {
            gutterFromProp = addGutterSizes(
                gutterFromProp,
                getGutterExpressionByIndex(paddingGutter, gridPositions[index]),
                TemplateGutter.Padding,
            )
        }

        if (emptySpaces[index]) {
            const { marginBefore, marginAfter } = emptySpaces[index];
            const marginToAdd = getMarginFromEmptySpace(emptySpaces[index], marginGutter);

            gutterFromEmptySpaces = {
                marginBefore: isEmpty(marginBefore) ? {} : addGridSizes(marginBefore, marginToAdd),
                marginAfter: isEmpty(marginAfter) ? {} : addGridSizes(marginAfter, marginToAdd),
            }
        }

        const { marginAfter, marginBefore, paddingAfter, paddingBefore } = gutterFromProp;
        const { marginBefore: emptyBefore = {}, marginAfter: emptyAfter = {} } = gutterFromEmptySpaces;

        if (index === 0) {
            return {
                marginBefore: emptyBefore,
                marginAfter: addGridSizes(marginAfter, emptyAfter),
                paddingBefore: {},
                paddingAfter,
            }
        }

        if (index === length - 1) {
            let emptyAfter: IGridSize = {};
            const lastEmptySpace = emptySpaces[emptySpaces.length - 1] || {};
            const lastEmptySpacePosition = lastEmptySpace.position || [];
            const lastEmptySpaceIndex = lastEmptySpacePosition[lastEmptySpacePosition.length - 1];
            const nextEmptySpaceIndex = emptySpaces.findIndex((space) => !!((space || {}).position || []).find(p => p > index));

            if (lastEmptySpaceIndex > length - 1) {
                emptyAfter = emptySpaces.slice(nextEmptySpaceIndex + 1).reduce((acc, space) => {
                    return addGridSizes(acc, getMarginFromEmptySpace(space, marginGutter))
                }, {} as IGridSize)
            }

            return {
                marginBefore: addGridSizes(marginBefore, emptyBefore),
                marginAfter: addGridSizes(marginAfter, emptyAfter),
                paddingBefore,
                paddingAfter: {},
            }
        }

        return {
            ...gutterFromProp,
            marginBefore: addGridSizes(marginBefore, emptyBefore),
            marginAfter: addGridSizes(marginAfter, emptyAfter),
        };
    });
};

export const isEmptySpaceExpression = (value: any): value is string => {
    return typeof value === 'string' && value.substr(0, 2) === '. ';
};

const getEmptySpacesAndRawGridTemplate = (gridTemplate: IGridTemplate): {
    emptySpaces: IGutterProperties[],
    newGridTemplate: IGridTemplate,
    gridPositions: Record<number, number>,
} => {
    let elemIndex = -1;
    let gridPositions: Record<number, number> = {};
    const newGridTemplate = gridTemplate.filter(value => !isEmptySpaceExpression(value));
    const templateLength = newGridTemplate.length;
    const emptySpaces =  gridTemplate.reduce<IGutterProperties[]>((acc, value, index) => {
        if (!isEmptySpaceExpression(value)) {
            elemIndex++;
            gridPositions = { ...gridPositions, [elemIndex]: index };
            return acc;
        }

        const expression = value.replace('. ', '');

        const [ firstExpr ] = words(expression, expressionWordRegExp);
        const margin = firstExpr ? getSizeFromExpression(firstExpr) : {};

        if (elemIndex === -1) {
            if (!acc[0]) acc[0] = {};
            if (!acc[0].position) acc[0].position = [];

            acc[0] = {
                ...acc[0],
                marginBefore: addGridSizes(margin, acc[0].marginBefore),
                position: [ ...acc[0].position, index ],
            };

            return acc;
        }

        if (!acc[elemIndex]) acc[elemIndex] = {};
        if (!acc[elemIndex].position) acc[elemIndex].position = [];

        acc[elemIndex] = {
            ...acc[elemIndex],
            marginAfter: addGridSizes(margin, acc[elemIndex].marginAfter),
            position: [ ...acc[elemIndex].position, index ],
        };

        return acc;
    }, new Array(templateLength).fill(null));

    return { emptySpaces, newGridTemplate, gridPositions }
};

const getGridStyleMapWithStats = (
    gridTemplate: IGridTemplate,
    marginGutter?: string | string[],
    paddingGutter?: string | string[],
    direction: TemplateDirection = TemplateDirection.Row,
): IStatsAndSizes => {
    const styleMap: IGridStyle[] = [];
    let directionStats: IGridSize = {};

    const { emptySpaces, newGridTemplate, gridPositions } = getEmptySpacesAndRawGridTemplate(gridTemplate);
    const gutterTemplate = getGutterSizes({ marginGutter, paddingGutter, length: newGridTemplate.length, emptySpaces, gridPositions });
    const { sizeAlong } = getSizeProperties(direction);

    newGridTemplate.forEach((sizeDescriptor, index) => {
        let cellStyle: IGridStyle;

        if (typeof sizeDescriptor === 'string') {
            cellStyle = getExpressionAsStyle(sizeDescriptor, direction);
        } else {
            cellStyle = sizeDescriptor;
        }

        const { marginBefore, marginAfter, paddingBefore, paddingAfter } = gutterTemplate[index];

        directionStats = addGridSizes(
            directionStats,
            cellStyle[sizeAlong],
            marginBefore,
            marginAfter,
        );

        styleMap[index] = {
            ...cellStyle,
            ...getGutterGridStyle(direction, TemplateGutter.Padding, paddingBefore, paddingAfter),
            ...getGutterGridStyle(direction, TemplateGutter.Margin, marginBefore, marginAfter),
        };
    });

    return { directionStats, styleMap }
};

const getFullGridStyleFromStats = (baseStyle: IGridStyle, directionStats: IGridSize, direction: TemplateDirection): IGridStyle => {
    const { paddingBefore, paddingAfter, marginBefore, marginAfter } = getGutterProperties(baseStyle, direction);
    const [ gutterBefore, gutterAfter ] = gutterProperties[direction];
    const { sizeAlong, sizeAcross } = getSizeProperties(direction);

    return {
        [sizeAlong]: getConstantUnitSizeFromStats(baseStyle[sizeAlong], directionStats),
        [sizeAcross]: baseStyle[sizeAcross],
        padding: {
            [gutterBefore]: paddingBefore,
            [gutterAfter]: paddingAfter,
        },
        margin: {
            [gutterBefore]: getConstantUnitSizeFromStats(marginBefore, directionStats),
            [gutterAfter]: getConstantUnitSizeFromStats(marginAfter, directionStats),
        },
    };
};

const getConstantUnitSizeFromStats = ({ fr = 0, ...constantUnits }: IGridSize, flexGridStats: IGridSize): IGridSize => {
    if (fr === 0) {
        return {...constantUnits};
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