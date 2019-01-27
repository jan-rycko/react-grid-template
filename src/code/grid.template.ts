import {GridUnit, IGridSize, IGridStyle, IGridTemplate, TemplateDirection, TemplateGutter, IGutterProperties} from './grid.model';
import {
    getGutterGridStyle,
    getGutterProperties,
    getSizeProperties,
    gutterProperties,
} from './grid.mappers';
import reduce from 'lodash-es/reduce';
import {addGridSizes} from './grid.math';
import {expressionWordRegExp, getExpressionAsStyle, getSizeFromExpression} from './grid.expression';
import {isConstantUnit, isEmptySpaceExpression} from '../utils/typescript-utils';
import words from 'lodash-es/words';
import isEmpty from 'lodash-es/isEmpty';

interface IStatsAndSizes {
    directionStats: IGridSize
    styleMap: IGridStyle[]
}

class GridTemplate {
    gridTemplate: IGridTemplate;
    marginGutter: string | string[];
    paddingGutter: string | string[];
    direction: TemplateDirection = TemplateDirection.Row;

    constructor(
        gridTemplate: IGridTemplate,
        marginGutter: string | string[],
        paddingGutter: string | string[],
        direction: TemplateDirection = TemplateDirection.Row,
    ) {
        this.gridTemplate = gridTemplate;
        this.marginGutter = marginGutter;
        this.paddingGutter = paddingGutter;
        this.direction = direction;
    }

    getStyles = (): IGridStyle[] => {
        const {
            directionStats,
            styleMap,
        } = this.getGridStyleMapWithStats();

        return styleMap.map(style => this.getFullGridStyleFromStats(style, directionStats));
    };

    getGridStyleMapWithStats = (): IStatsAndSizes => {
        const styleMap: IGridStyle[] = [];
        let directionStats: IGridSize = {};

        const { emptySpaces, newGridTemplate, gridPositions } = this.getEmptySpacesAndRawGridTemplate();
        const gutterTemplate = this.getGutterTemplate({ length: newGridTemplate.length, emptySpaces, gridPositions });
        const { sizeAlong } = getSizeProperties(this.direction);

        newGridTemplate.forEach((sizeDescriptor, index) => {
            let cellStyle: IGridStyle;

            if (typeof sizeDescriptor === 'string') {
                cellStyle = getExpressionAsStyle(sizeDescriptor, this.direction);
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
                ...getGutterGridStyle(this.direction, TemplateGutter.Padding, paddingBefore, paddingAfter),
                ...getGutterGridStyle(this.direction, TemplateGutter.Margin, marginBefore, marginAfter),
            };
        });

        return { directionStats, styleMap }
    };

    getEmptySpacesAndRawGridTemplate = (): {
        emptySpaces: IGutterProperties[],
        newGridTemplate: IGridTemplate,
        gridPositions: Record<number, number>,
    } => {
        let elemIndex = -1;
        let gridPositions: Record<number, number> = {};
        const newGridTemplate = this.gridTemplate.filter(value => !isEmptySpaceExpression(value));
        const templateLength = newGridTemplate.length;

        const emptySpaces = this.gridTemplate.reduce<IGutterProperties[]>((acc, value, index) => {
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

    getGutterExpressionByIndex = (gutter: string[] | string, index: number) => {
        return Array.isArray(gutter) ? gutter[index] || gutter[gutter.length - 1] : gutter;
    };

    addGutterProperties = (
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

    getMarginFromEmptySpace = (emptySpace: IGutterProperties, marginGutter: string | string[]): IGridSize => {
        return emptySpace.position.reduce((acc, pos) => addGridSizes(acc,
            getSizeFromExpression(
                this.getGutterExpressionByIndex(marginGutter, pos),
            ),
        ), {});
    };

    getGutterTemplate = ({ length, emptySpaces, gridPositions }: {
        length: number,
        emptySpaces: IGutterProperties[],
        gridPositions: Record<number, number>,
    }): IGutterProperties[] => {
        let gutterProperties: IGutterProperties = {};

        if (typeof this.marginGutter === 'string') {
            gutterProperties = this.addGutterProperties(gutterProperties, this.marginGutter, TemplateGutter.Margin);
        }

        if (typeof this.paddingGutter === 'string') {
            gutterProperties = this.addGutterProperties(gutterProperties, this.paddingGutter, TemplateGutter.Padding);
        }

        return new Array(length).fill(null).map((_, index) => {
            let gutterFromProp = {...gutterProperties};
            let gutterFromEmptySpaces: IGutterProperties = {};

            if (Array.isArray(this.marginGutter)) {
                gutterFromProp = this.addGutterProperties(
                    gutterFromProp,
                    this.getGutterExpressionByIndex(this.marginGutter, gridPositions[index]),
                    TemplateGutter.Margin,
                )
            }

            if (Array.isArray(this.paddingGutter)) {
                gutterFromProp = this.addGutterProperties(
                    gutterFromProp,
                    this.getGutterExpressionByIndex(this.paddingGutter, gridPositions[index]),
                    TemplateGutter.Padding,
                )
            }

            if (emptySpaces[index]) {
                const { marginBefore, marginAfter } = emptySpaces[index];
                const marginToAdd = this.getMarginFromEmptySpace(emptySpaces[index], this.marginGutter);

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
                        return addGridSizes(acc, this.getMarginFromEmptySpace(space, this.marginGutter))
                    }, {} as IGridSize)
                }

                return {
                    marginBefore: addGridSizes(marginBefore, emptyBefore),
                    marginAfter: emptyAfter,
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

    getFullGridStyleFromStats = (baseStyle: IGridStyle, directionStats: IGridSize): IGridStyle => {
        const { paddingBefore, paddingAfter, marginBefore, marginAfter } = getGutterProperties(baseStyle, this.direction);
        const [ gutterBefore, gutterAfter ] = gutterProperties[this.direction];
        const { sizeAlong, sizeAcross } = getSizeProperties(this.direction);

        return {
            [sizeAlong]: this.getConstantUnitSizeFromStats(baseStyle[sizeAlong], directionStats),
            [sizeAcross]: baseStyle[sizeAcross],
            padding: {
                [gutterBefore]: paddingBefore,
                [gutterAfter]: paddingAfter,
            },
            margin: {
                [gutterBefore]: this.getConstantUnitSizeFromStats(marginBefore, directionStats),
                [gutterAfter]: this.getConstantUnitSizeFromStats(marginAfter, directionStats),
            },
        };
    };

    getConstantUnitSizeFromStats = ({ fr = 0, ...constantUnits }: IGridSize, flexGridStats: IGridSize): IGridSize => {
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
}

export default GridTemplate;