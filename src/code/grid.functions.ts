import {CSSProperties} from 'react';
import {
    IGridStyle,
    IGridTemplateDescriptor,
    TemplateDirection,
} from './grid.model';
import GridTemplate from './grid.template';
import GridSpan from './grid.span';
import {getSizesAsCSSProperties} from './grid.styling';

export const getGridStyle = (
    {
        gridTemplate,
        spanTemplate,
        marginGutter,
        paddingGutter,
        direction = TemplateDirection.Row,
    }: IGridTemplateDescriptor,
): CSSProperties[] => {
    if (!gridTemplate) {
        return [];
    }

    const template = new GridTemplate(gridTemplate, marginGutter, paddingGutter, direction);
    let gridStyles: IGridStyle[] = template.getStyles();

    if (spanTemplate) {
        const span = new GridSpan(gridStyles, direction);
        gridStyles = span.calculateStyle(spanTemplate)
    }

    const styles: CSSProperties[] = getSizesAsCSSProperties(direction, gridStyles);

    return styles;
};