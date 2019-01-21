import * as React from 'react';
import {CSSProperties, ReactNode, Children, cloneElement, Fragment, PureComponent} from 'react';
import classnames from 'classnames';
import * as shallowEqual from 'shallowequal';
import isEqual from 'lodash-es/isEqual';
import {
    IGridStyle,
    IGridTemplate,
    IGridTemplateDescriptor,
    TemplateDirection,
    TemplateGutter,
} from '../code/grid.model';
import {
    getGridStyle,
} from '../code/grid.functions';
import {
    isChildrenList,
    isReactComponent,
} from '../code/grid.react-utils';

interface IGridProps extends IGridTemplateDescriptor {
    tag?: string | typeof Fragment
    style?: CSSProperties
    className?: string
}

export interface IGridChildProps {
    style?: CSSProperties
    size?: string | Exclude<IGridStyle, 'isEmptySpace'>
    span?: number
}

interface IGridState {
    styles: CSSProperties[]
}

const GRID_CLASS_NAMESPACE = 'grid';
const gridStyle: CSSProperties = { display: 'flex' };
const columnStyle: CSSProperties = { flexDirection: 'column' };

class Grid extends PureComponent<IGridProps, IGridState> {
    state = {
        styles: [],
    };

    componentDidMount() {
        this.computeGrid(this.getGridFromChildren());
    }

    componentDidUpdate({ children: prevChildren, ...gridPrevProps }: PureComponent<IGridProps>['props']) {
        const { children, ...gridProps } = this.props;

        const gridFromChildren = this.getGridFromChildren(children);
        const prevGridFromChildren = this.getGridFromChildren(prevChildren);

        if (!shallowEqual(gridPrevProps, gridProps) || !isEqual(gridFromChildren, prevGridFromChildren)) {
            this.computeGrid(gridFromChildren);
        }
    }

    getChildSizeAndSpan = (children: ReactNode): { size?: string | IGridStyle, span?: number } => {
        if (isReactComponent<IGridChildProps>(children)) {
            const {size = null, span = null } = children.props;

            if (size || span) {
                return { size, span };
            }
        }

        return {};
    };

    getGridFromChildren(children = this.props.children): { sizeTemplate: IGridTemplate, spanTemplate: number[] } {
        let grid: { size?: string | IGridStyle, span?: number }[] = [];

        if (isReactComponent<IGridChildProps>(children)) {
            grid = [this.getChildSizeAndSpan(children)];
        }

        if (isChildrenList(children)) {
            grid = children.map(this.getChildSizeAndSpan);
        }

        return grid.reduce((acc, { size, span }) => {
            if (size) {
                acc.sizeTemplate.push(size);
            }

            if (span) {
                acc.spanTemplate.push(span);
            }

            return acc;
        }, { sizeTemplate: [], spanTemplate: [] });
    }

    computeGrid = ({ sizeTemplate, spanTemplate: spanTemplateFromChildren }: { sizeTemplate: IGridTemplate, spanTemplate: number[] }) => {
        const {direction, gridTemplate, spanTemplate, gutter, gutterAs } = this.props;

        let gridToSet: IGridTemplate = gridTemplate;
        let spanToSet: number[] = spanTemplate;

        if (sizeTemplate.length) {
            gridToSet = sizeTemplate;
        }

        if (spanTemplateFromChildren.length) {
            spanToSet = spanTemplateFromChildren;
        }

        this.setState({
            styles: getGridStyle({ direction, gridTemplate: gridToSet, spanTemplate: spanToSet, gutter, gutterAs }),
        })
    };

    addStyleToProps = (children: ReactNode, styles: CSSProperties[]): ReactNode => {
        let diff = 0;

        return Children.map(children, (child, i) => {
            if (!isReactComponent(child)) {
                diff += 1;
                return child;
            }
            const elementIndex = i - diff;

            const props: IGridChildProps = {};

            if (styles) {
                if (styles[elementIndex]) {
                    props.style = styles[elementIndex];
                }
            }

            return cloneElement(child, props);
        });
    };

    get gridClass() { return GRID_CLASS_NAMESPACE }

    getGridElementClass = (direction: TemplateDirection, ...classNames: string[]) => {
        return classnames(`${this.gridClass}__${direction}`, ...classNames);
    };

    render() {
        const {styles} = this.state;
        const {
            children,
            style = {},
            className,
            tag: Component = 'div',
            direction = TemplateDirection.Row,
            gutterAs = TemplateGutter.Padding,
        } = this.props;

        let tagProps = {};

        if (Component !== Fragment) {
            tagProps = {
                style: { ...gridStyle, ...(direction === TemplateDirection.Column ? columnStyle : {}), ...style },
                className: this.getGridElementClass(direction, this.gridClass, className, `${gutterAs}-gutter`),
            };
        }

        return (
            <Component {...tagProps}>
                {this.addStyleToProps(children, styles)}
            </Component>
        );
    }
}

export { Grid };