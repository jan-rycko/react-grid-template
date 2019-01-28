import {IGridSize, IGridStyle, IGutterProperties, SizeProperty, TemplateDirection, TemplateGutter} from './grid.model';

export const sizeProperty = {
    [TemplateDirection.Row]: SizeProperty.Width,
    [TemplateDirection.Column]: SizeProperty.Height,
};

export const getSecondDirection = (direction: TemplateDirection): TemplateDirection => {
    return direction === TemplateDirection.Row ? TemplateDirection.Column : TemplateDirection.Row;
};

export const getSizeProperties = (direction: TemplateDirection) => {
    return {
        sizeAlong: sizeProperty[direction],
        sizeAcross: sizeProperty[getSecondDirection(direction)],
    }
};

export const gutterProperties = {
    [TemplateDirection.Row]: ['left', 'right'],
    [TemplateDirection.Column]: ['top', 'bottom'],
};

export const getGutterGridStyle = (
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

export const getGutterProperties = ({ margin = {}, padding = {} }: IGridStyle = {}, direction: TemplateDirection): IGutterProperties => {
    const [ before, after ] = gutterProperties[direction];

    return {
        marginBefore: margin[before] || {},
        marginAfter: margin[after] || {},
        paddingBefore: padding[before] || {},
        paddingAfter: padding[after] || {},
    }
};