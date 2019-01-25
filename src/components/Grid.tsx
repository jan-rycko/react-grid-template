import * as React from 'react';
import {Children, cloneElement, CSSProperties, Fragment, FunctionComponent, PureComponent, ReactNode} from 'react';
import isEqual from 'lodash-es/isEqual';
import {IGridStyle, IGridTemplate, IGridTemplateDescriptor, TemplateDirection} from '../code/grid.model';
import {getGridStyle, getListLength, repeatSize} from '../code/grid.functions';
import {countComponents, isChildOfType, isChildrenList, isReactComponent} from '../code/grid.react-utils';
import union from 'lodash-es/union';

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

    componentDidUpdate({ children: prevChildren, tag: t, inline: i, style: s, size: si, span: sp, ...prevTemplateDescriptor }: PureComponent<IGridProps>['props']) {
        const { children, tag, inline, style, size, span, ...templateDescriptor } = this.props;

        const gridFromChildren = this.getGridFromChildren(children);
        const prevGridFromChildren = this.getGridFromChildren(prevChildren);

        if (
            !isEqual(prevTemplateDescriptor, templateDescriptor)
            || !isEqual(gridFromChildren, prevGridFromChildren)
            || children !== prevChildren
        ) {
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

        let gridLength = countComponents(children);

        if (isChildOfType<IGridProps>(children, GridRepeat)) {
            gridLength = getListLength(children.props.children, children.props.gridTemplate);
        }

        let gridToSet: IGridTemplate = gridTemplate;
        let spanToSet: number[] = spanTemplate;

        if (gridTemplateToSet.length) {
            gridToSet = gridTemplateToSet;
        }

        if (spanTemplateToSet.length) {
            spanToSet = spanTemplateToSet;
        }

        if (gutter && (!gridToSet || gridToSet.length === 0)) {
            gridToSet = repeatSize('1fr', gridLength);
        }

        this.setState({
            styles: getGridStyle(gridLength, { direction, gridTemplate: gridToSet, spanTemplate: spanToSet, gutter, gutterAs }),
        })
    };

    addStyleToProps = (children: ReactNode, styles: CSSProperties[]): ReactNode => {
        let diff = 0;

        return Children.map(children, (child, i) => {
            if (!isReactComponent<{ style?: CSSProperties | CSSProperties[] }>(child)) {
                diff += 1;
                return child;
            }

            const props: { style?: CSSProperties | CSSProperties[] } = {};

            if (styles) {
                const elementIndex = i - diff;

                if (isChildOfType(child, GridRepeat)) {
                    const childStyle = Array.isArray(child.props.style) ? child.props.style : [ child.props.style ];
                    props.style = union(styles, childStyle)
                } else if (styles[elementIndex]) {
                    props.style = {
                        ...styles[elementIndex],
                        ...(child.props.style || {}),
                    };
                }
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
            tag: Element = 'div',
            children,
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

const GridRepeat: FunctionComponent<Exclude<IGridProps, 'style'> & { style?: CSSProperties | CSSProperties[] }> = ({ children, gridTemplate, style, ...gridProps }) => {
    const lineLength = gridTemplate.length;
    const listLength = getListLength(children, gridTemplate);
    const childrenArray = Children.toArray(children);
    const isStyleArray = Array.isArray(style);

    let gridPropsList: IGridProps[] = new Array(listLength).fill(null).map((_, index) => {
        const startIndex = index * lineLength;
        const endIndex = startIndex + lineLength;

        return {
            key: index,
            children: childrenArray.slice(startIndex, endIndex),
            gridTemplate,
            style: isStyleArray ? style[index] : style,
            ...gridProps,
        }
    });

    return (
        <Fragment>
            {gridPropsList.map(gridProps => <Grid {...gridProps} />)}
        </Fragment>
    )
};

const GridColumn: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Column} {...gridProps} />;
const GridRow: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Row} {...gridProps} />;

export { Grid, GridColumn, GridRow, GridRepeat };