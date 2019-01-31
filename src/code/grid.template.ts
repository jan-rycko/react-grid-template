import {GridUnit, IGridSize, IGridStyle, IGridTemplate, IGutterProperties, TemplateDirection} from './grid.model';
import {
    getGutterProperties,
    getSizeProperties,
    gutterProperties,
} from './grid.mappers';
import reduce from 'lodash-es/reduce';
import {addGridSizes, mergeGutterStyle} from './grid.math';
import {expressionWordRegExp, getExpressionAsStyle} from './grid.expression';
import {isConstantUnit, isEmptySpaceExpression} from '../utils/typescript-utils';
import words from 'lodash-es/words';
import {GridGutter} from './grid.gutter';

class GridTemplate {
    template: IGridTemplate;
    length: number;
    gridStyles: IGridStyle[] = [];
    marginGutter: string | string[];
    paddingGutter: string | string[];
    direction: TemplateDirection = TemplateDirection.Row;
    directionStats: IGridSize = {};
    components: IGridStyle[] = [];
    componentsTemplate: IGridTemplate = [];
    componentsPositions: Record<number, number> = {};
    emptySpaces: IGridStyle[] = [];
    emptySpacesPositions: Record<number, number> = {};
    gutterTemplate: IGutterProperties[];
    gutterTemplateWithEmptySpaces: IGutterProperties[];

    constructor(
        template: IGridTemplate,
        marginGutter: string | string[],
        paddingGutter: string | string[],
        direction: TemplateDirection = TemplateDirection.Row,
    ) {
        this.template = template;
        this.length = this.template.length;
        this.marginGutter = marginGutter;
        this.paddingGutter = paddingGutter;
        this.direction = direction;

        this.setComponents();
        this.setEmptySpaces();
        this.setGutterTemplate();
    }

    getStyles = (): IGridStyle[] => {
        this.addGridStyles();
        this.getDirectionStats();

        return this.gridStyles.map(this.getFullGridStyleFromStats);
    };

    private setComponents() {
        let elemIndex = -1;
        this.componentsTemplate = [];

        this.components = this.template.map((value, index) => {
            const isComponentExpression = !isEmptySpaceExpression(value);

            if (!isComponentExpression) {
                return null;
            }

            elemIndex++;

            this.componentsTemplate.push(value);
            this.componentsPositions = { ...this.componentsPositions, [index]: elemIndex };

            if (typeof value === 'string') {
                return getExpressionAsStyle(value, this.direction);
            } else {
                return value;
            }
        });
    }

    private setEmptySpaces() {
        this.emptySpacesPositions = {};
        let elemIndex = -1;

        this.emptySpaces = this.template.map((value, index) => {
            if (!isEmptySpaceExpression(value)) {

                if (typeof value === 'object' && value.isEmptySpace) {
                    this.addEmptySpacePosition(index, elemIndex);
                    return value;
                }

                elemIndex++;
                return null;
            }

            const expression = value.replace('. ', '');
            const [ firstExpr ] = words(expression, expressionWordRegExp);

            const boxStyle = firstExpr ? getExpressionAsStyle(firstExpr, this.direction) : {};

            this.addEmptySpacePosition(index, elemIndex);
            return {
                ...boxStyle,
                isEmptySpace: true,
            };
        });
    }

    private addEmptySpacePosition = (index: number, elemIndex: number) => {
        this.emptySpacesPositions = {
            ...this.emptySpacesPositions,
            [index]: this.getComponentIndex(elemIndex),
        };
    };

    private getComponentIndex = (elemIndex: number): number => {
        return elemIndex === -1 ? Object.values(this.componentsPositions)[0] : elemIndex;
    };

    private setGutterTemplate = () => {
        const { gutterTemplate, gutterTemplateWithEmptySpaces } = new GridGutter(this);

        this.gutterTemplate = gutterTemplate;
        this.gutterTemplateWithEmptySpaces = gutterTemplateWithEmptySpaces;
    };

    private addGridStyles = () => {
        this.gridStyles = this.components.map((component, index) => {
            if (component === null) {
                return null;
            }

            if (!this.gutterTemplate[index]) {
                return component;
            }

            const { marginBefore, marginAfter, paddingBefore, paddingAfter } = this.gutterTemplate[index];
            const [ gutterBefore, gutterAfter ] = gutterProperties[this.direction];

            return {
                ...component,
                margin: mergeGutterStyle(component.margin || {}, {
                    [gutterBefore]: marginBefore,
                    [gutterAfter]: marginAfter,
                }),
                padding: mergeGutterStyle(component.padding || {}, {
                    [gutterBefore]: paddingBefore,
                    [gutterAfter]: paddingAfter,
                })
            }
        }).filter(style => style !== null);
    };

    getDirectionStats = () => {
        const { sizeAlong } = getSizeProperties(this.direction);

        this.directionStats = this.gridStyles.reduce<IGridSize>((acc, style) => {
            if (style === null) {
                return acc;
            }

            const size = style[sizeAlong] || {};
            const { marginBefore, marginAfter } = getGutterProperties(style, this.direction);

            return addGridSizes(
                acc,
                size,
                marginBefore,
                marginAfter
            );
        }, {});
    };

    getFullGridStyleFromStats = (baseStyle: IGridStyle): IGridStyle => {
        const { paddingBefore, paddingAfter, marginBefore, marginAfter } = getGutterProperties(baseStyle, this.direction);
        const [ gutterBefore, gutterAfter ] = gutterProperties[this.direction];
        const { sizeAlong, sizeAcross } = getSizeProperties(this.direction);

        return {
            [sizeAlong]: this.getConstantUnitSizeFromStats(baseStyle[sizeAlong], this.directionStats),
            [sizeAcross]: baseStyle[sizeAcross],
            padding: {
                [gutterBefore]: paddingBefore,
                [gutterAfter]: paddingAfter,
            },
            margin: {
                [gutterBefore]: this.getConstantUnitSizeFromStats(marginBefore, this.directionStats),
                [gutterAfter]: this.getConstantUnitSizeFromStats(marginAfter, this.directionStats),
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