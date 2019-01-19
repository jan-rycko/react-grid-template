import React, { Fragment, CSSProperties, PureComponent } from 'react';
import { IGridStyle, IGridTemplate, IGridTemplateDescriptor, TemplateDirection } from 'code/grid.model';
interface IGridProps extends IGridTemplateDescriptor {
    tag?: string | typeof Fragment;
    style?: CSSProperties;
    className?: string;
}
export interface IGridChildProps {
    style?: CSSProperties;
    size?: string | Exclude<IGridStyle, 'isEmptySpace'>;
    span?: number;
}
interface IGridState {
    styles: CSSProperties[];
}
declare class Grid extends PureComponent<IGridProps, IGridState> {
    state: {
        styles: any[];
    };
    componentDidMount(): void;
    componentDidUpdate({ children: prevChildren, ...gridPrevProps }: PureComponent<IGridProps>['props']): void;
    getChildSizeAndSpan: (children: React.ReactNode) => {
        size?: string | IGridStyle;
        span?: number;
    };
    getGridFromChildren(children?: React.ReactNode): {
        sizeTemplate: IGridTemplate;
        spanTemplate: number[];
    };
    computeGrid: ({ sizeTemplate, spanTemplate: spanTemplateFromChildren }: {
        sizeTemplate: (string | IGridStyle)[];
        spanTemplate: number[];
    }) => void;
    addStyleToProps: (children: React.ReactNode, styles: React.CSSProperties[]) => React.ReactNode;
    readonly gridClass: string;
    getGridElementClass: (direction: TemplateDirection, ...classNames: string[]) => any;
    render(): JSX.Element;
}
export default Grid;
