import * as React from 'react';
import {Children, cloneElement, CSSProperties, Fragment, PureComponent, ReactNode} from 'react';
import * as shallowEqual from 'shallowequal';
import isEqual from 'lodash-es/isEqual';
import {IGridStyle, IGridTemplate, IGridTemplateDescriptor, TemplateDirection} from '../code/grid.model';
import {getGridStyle} from '../code/grid.functions';
import {isChildrenList, isReactComponent} from '../code/grid.react-utils';
import {FunctionComponent} from 'react';

interface IGridProps extends IGridTemplateDescriptor, IGridChildProps {
    tag?: string | typeof Fragment
    inline?: boolean
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
const gridBaseStyle: CSSProperties = { display: 'flex' };
const inlineGridBaseStyle: CSSProperties = { display: 'inline-flex' };
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

    getGridFromChildren(children = this.props.children): { gridTemplateToSet: IGridTemplate, spanTemplateToSet: number[] } {
        let grid: { size?: string | IGridStyle, span?: number }[] = [];

        if (isReactComponent<IGridChildProps>(children)) {
            grid = [this.getChildSizeAndSpan(children)];
        }

        if (isChildrenList(children)) {
            grid = children.map(this.getChildSizeAndSpan);
        }

        return grid.reduce((acc, { size, span }) => {
            if (size) {
                acc.gridTemplateToSet.push(size);
            }

            if (span) {
                acc.spanTemplateToSet.push(span);
            }

            return acc;
        }, { gridTemplateToSet: [], spanTemplateToSet: [] });
    }

    computeGrid = ({ gridTemplateToSet, spanTemplateToSet }: { gridTemplateToSet: IGridTemplate, spanTemplateToSet: number[] }) => {
        const {direction, gridTemplate, spanTemplate, gutter, gutterAs, children } = this.props;

        let gridLength = 0;

        // Children.forEach(children, child => {
        //     if (isReactComponent<IGridChildProps>(child)) gridLength += 1;
        // });

        let gridToSet: IGridTemplate = gridTemplate;
        let spanToSet: number[] = spanTemplate;

        if (gridTemplateToSet.length) {
            gridToSet = gridTemplateToSet;
        }

        if (spanTemplateToSet.length) {
            spanToSet = spanTemplateToSet;
        }

        this.setState({
            styles: getGridStyle(gridLength, { direction, gridTemplate: gridToSet, spanTemplate: spanToSet, gutter, gutterAs }),
        })
    };

    addStyleToProps = (children: ReactNode, styles: CSSProperties[]): ReactNode => {
        let diff = 0;

        return Children.map(children, (child, i) => {
            if (!isReactComponent<IGridChildProps>(child)) {
                diff += 1;
                return child;
            }
            const elementIndex = i - diff;

            const props: IGridChildProps = {};

            if (styles && styles[elementIndex]) {
                props.style = {
                    ...styles[elementIndex],
                    ...(child.props.style || {})
                };
            }

            return cloneElement(child, props);
        });
    };

    get gridClass() {
        const { direction, className, gutterAs } = this.props;

        return [`${GRID_CLASS_NAMESPACE}__${direction} ${GRID_CLASS_NAMESPACE} ${gutterAs}-gutter${className ? ` ${className}` : ''}`].join(' ');
    };

    get gridStyle() {
        const { direction, style, inline } = this.props;

        return {
            ...(inline ? inlineGridBaseStyle : gridBaseStyle),
            ...(direction === TemplateDirection.Column ? columnStyle : {}),
            ...style,
        };
    };

    render() {
        const {styles} = this.state;
        const {
            children,
            tag: Element = 'div',
        } = this.props;

        let tagProps = {};

        if (Element !== Fragment) {
            tagProps = {
                style: this.gridStyle,
                className: this.gridClass,
            };
        }

        return (
            <Element {...tagProps}>
                {this.addStyleToProps(children, styles)}
            </Element>
        );
    }
}

const GridColumn: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Column} {...gridProps} />;
const GridRow: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Row} {...gridProps} />;

export { Grid, GridColumn, GridRow };