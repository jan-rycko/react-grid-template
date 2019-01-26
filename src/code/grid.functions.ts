import {CSSProperties} from 'react';
import {
    IGridStyle,
    IGridTemplateDescriptor,
    TemplateDirection,
    TemplateGutter,
} from './grid.model';
import {getGridTemplateSizes} from './grid.template';
import {calculateSizesWithSpanTemplate} from './grid.span';
import {getSizesAsCSSProperties} from './grid.styling';

export const getGridStyle = (
    gridLength: number,
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

    let sizes: IGridStyle[] = getGridTemplateSizes(gridTemplate, marginGutter, paddingGutter, direction);

    if (spanTemplate) {
        sizes = calculateSizesWithSpanTemplate(sizes, spanTemplate, direction);
    }

    const styles: CSSProperties[] = getSizesAsCSSProperties(direction, sizes);

    return styles;
};