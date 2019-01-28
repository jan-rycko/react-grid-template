import {IGutterProperties, TemplateDirection, TemplateGutter} from './grid.model';
import {addGridSizes} from './grid.math';
import {getSizeFromExpression} from './grid.expression';
import GridTemplate from './grid.template';
import {getGutterProperties, getSizeProperties} from './grid.mappers';

class GridGutter {
    gridTemplate: GridTemplate;
    marginGutter: string | string[];
    paddingGutter: string | string[];
    direction: TemplateDirection = TemplateDirection.Row;
    gutterTemplateWithEmptySpaces: IGutterProperties[];
    gutterTemplate: IGutterProperties[];

    constructor(
        gridTemplate: GridTemplate,
        marginGutter: string | string[],
        paddingGutter: string | string[],
        direction: TemplateDirection = TemplateDirection.Row,
    ) {
        this.gridTemplate = gridTemplate;
        this.marginGutter = marginGutter;
        this.paddingGutter = paddingGutter;
        this.direction = direction;

        this.setGutterWithEmptySpaces();
        this.setGutterTemplate();
    }

    private getGutterProperties = (
        gutterType: TemplateGutter,
        gutterExpression: string = null
    ): IGutterProperties => {
        const gutter = gutterExpression ? gutterExpression : this[`${gutterType}Gutter`];
        const gutterSize = getSizeFromExpression(gutter, .5);
        const beforeProperty = `${gutterType}Before`;
        const afterProperty = `${gutterType}After`;

        return {
            [beforeProperty]: gutterSize,
            [afterProperty]: gutterSize,
        };
    };

    private getGutterExpressionByIndex = (gutter: string[] | string, index: number) => {
        return Array.isArray(gutter) ? gutter[index] || gutter[gutter.length - 1] : gutter;
    };

    private getGutterPropertiesByIndex = (
        gutterType: TemplateGutter,
        index: number,
    ): IGutterProperties => {
        const gutterProperties = this[`${gutterType}Gutter`];
        const gutter = this.getGutterExpressionByIndex(gutterProperties, index);

        return this.getGutterProperties(gutterType, gutter);
    };

    setGutterWithEmptySpaces = () => {
        let gutterProperties: IGutterProperties = {};
        const { length } = this.gridTemplate;

        if (typeof this.marginGutter === 'string') {
            gutterProperties = this.getGutterProperties(TemplateGutter.Margin);
        }

        if (typeof this.paddingGutter === 'string') {
            gutterProperties = { ...gutterProperties, ...this.getGutterProperties(TemplateGutter.Padding) };
        }

        this.gutterTemplateWithEmptySpaces = new Array(length).fill(null).map((_, index) => {
            let gutterFromProp = {...gutterProperties};

            if (Array.isArray(this.marginGutter)) {
                gutterFromProp = {
                    ...gutterFromProp,
                    ...this.getGutterPropertiesByIndex(TemplateGutter.Margin, index),
                }
            }

            if (Array.isArray(this.paddingGutter)) {
                gutterFromProp = {
                    ...gutterFromProp,
                    ...this.getGutterPropertiesByIndex(TemplateGutter.Padding, index),
                }
            }

            const {marginAfter = {}, marginBefore = {}, paddingAfter = {}, paddingBefore = {}} = gutterFromProp;

            return {
                paddingBefore,
                paddingAfter,
                marginBefore: index === 0 ? {} : marginBefore,
                marginAfter: index === length - 1 ? {} : marginAfter,
            };
        });
    };

    setGutterTemplate = () => {
        const { emptySpaces, emptySpacesPositions, components, componentsPositions } = this.gridTemplate;
        const { sizeAlong } = getSizeProperties(this.direction);

        this.gutterTemplate = components.map((component, index) => {
            if (component === null) {
                return null;
            }

            const componentPosition = componentsPositions[index];
            const marginToAdd: IGutterProperties = emptySpaces.reduce<IGutterProperties>((acc, emptySpace, i) => {
                if (emptySpacesPositions[i] === undefined || emptySpacesPositions[i] !== componentPosition) {
                    return acc
                }

                const size = emptySpace[sizeAlong] || {};
                const { marginBefore, marginAfter } = getGutterProperties(emptySpace, this.direction);
                const gutter = this.gutterTemplateWithEmptySpaces[i];

                const marginFromEmptySpace = addGridSizes(size, marginBefore, marginAfter, gutter.marginBefore, gutter.marginAfter);

                return {
                    marginBefore: i < index ? addGridSizes(acc.marginBefore, marginFromEmptySpace) : acc.marginBefore,
                    marginAfter: i > index ? addGridSizes(acc.marginAfter, marginFromEmptySpace) : acc.marginAfter,
                };
            }, { marginBefore: {}, marginAfter: {} });


            const { marginBefore: emptyBefore, marginAfter: emptyAfter } = marginToAdd;
            const { marginBefore, marginAfter } = this.gutterTemplateWithEmptySpaces[index];

            return {
                marginBefore: addGridSizes(emptyBefore, marginBefore),
                marginAfter: addGridSizes(emptyAfter, marginAfter),
            }
        })
    };
}

export { GridGutter };