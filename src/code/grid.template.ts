import {GridUnit, IGridSize, IGridStyle, IGridTemplate, TemplateDirection, TemplateGutter} from './grid.model';
import {
    getGutterGridStyle,
    getGutterProperties,
    getSizeProperties,
    gutterProperties,
    IGutterProperties,
    sizeProperty,
} from './grid.mappers';
import reduce from 'lodash-es/reduce';
import {addGridSizes} from './grid.math';
import {expressionWordRegExp, getExpressionAsStyle, getSizeFromExpression} from './grid.expression';
import {isConstantUnit} from './grid.type-guards';
import words from 'lodash-es/words';

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

const getGutterExpressionByIndex = (gutter: string[], index: number) => {
    return gutter[index] || gutter[gutter.length - 1];
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

const getGutterSizes = (
    marginGutter: string | string[],
    paddingGutter: string | string[],
    length: number,
    emptySpaces: IGutterProperties[]
): IGutterProperties[] => {
    let gutterProperties: IGutterProperties = {};

    if (typeof marginGutter === 'string') {
        gutterProperties = addGutterSizes(gutterProperties, marginGutter, TemplateGutter.Margin);
    }

    if (typeof paddingGutter === 'string') {
        gutterProperties = addGutterSizes(gutterProperties, paddingGutter, TemplateGutter.Padding);
    }

    return new Array(length).fill(null).map((_, index) => {
        let gutterToSet = {...gutterProperties};

        if (Array.isArray(marginGutter)) {
            gutterToSet = addGutterSizes(
                gutterToSet,
                getGutterExpressionByIndex(marginGutter, index),
                TemplateGutter.Margin
            )
        }

        if (Array.isArray(paddingGutter)) {
            gutterToSet = addGutterSizes(
                gutterToSet,
                getGutterExpressionByIndex(paddingGutter, index),
                TemplateGutter.Padding
            )
        }

        if (emptySpaces[index]) {
            const { marginBefore, marginAfter } = emptySpaces[index];

            gutterToSet = {
                ...gutterToSet,
                marginBefore: addGridSizes(gutterToSet.marginBefore, marginBefore),
                marginAfter: addGridSizes(gutterToSet.marginAfter, marginAfter),
            }
        }

        if (index === 0) {
            const { marginAfter, paddingAfter } = gutterToSet;
            return { marginAfter, paddingAfter, marginBefore: {}, paddingBefore: {} }
        }

        if (index === length - 1) {
            const { marginBefore, paddingBefore} = gutterToSet;
            return { marginAfter: {}, paddingAfter: {}, marginBefore, paddingBefore }
        }


        return gutterToSet;
    });
};

export const isEmptySpaceExpression = (value: any): value is string => {
    return typeof value === 'string' && value.substr(0, 2) === '. ';
};

const getEmptySpacesAndRawGridTemplate = (gridTemplate: IGridTemplate): { emptySpaces: IGutterProperties[], newGridTemplate: IGridTemplate } => {
    let elemIndex = 0;
    const newGridTemplate = [];
    const templateLength = gridTemplate.filter(value => !isEmptySpaceExpression(value)).length;
    const emptySpaces =  gridTemplate.reduce<IGutterProperties[]>((acc, value, index) => {
        if (!isEmptySpaceExpression(value)) {
            elemIndex++;
            newGridTemplate.push(value);
            return acc;
        }

        const expression = value.replace('. ', '');

        const [ firstExpr ] = words(expression, expressionWordRegExp);
        const margin = firstExpr ? getSizeFromExpression(firstExpr) : {};

        if (elemIndex === templateLength - 1) {
            acc[elemIndex - 1] = {...acc[elemIndex - 1], marginAfter: margin};

            return acc;
        }

        acc[elemIndex + 1] = {...acc[elemIndex - 1], marginBefore: margin};

        return acc;
    }, new Array(templateLength).fill(null));

    return { emptySpaces, newGridTemplate }
};

const getGridStyleMapWithStats = (
    gridTemplate: IGridTemplate,
    marginGutter?: string | string[],
    paddingGutter?: string | string[],
    direction: TemplateDirection = TemplateDirection.Row,
): IStatsAndSizes => {
    const styleMap: IGridStyle[] = [];
    let directionStats: IGridSize = {};

    const { emptySpaces, newGridTemplate } = getEmptySpacesAndRawGridTemplate(gridTemplate);
    const gutterTemplate = getGutterSizes(marginGutter, paddingGutter, newGridTemplate.length, emptySpaces);
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