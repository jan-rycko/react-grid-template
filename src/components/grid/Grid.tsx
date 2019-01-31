import * as React from 'react';
import {Children, cloneElement, CSSProperties, Fragment, FunctionComponent, PureComponent, ReactNode} from 'react';
import isEqual from 'lodash-es/isEqual';
import {IGridStyle, IGridTemplate, IGridTemplateDescriptor, TemplateDirection} from '../../code/grid.model';
import {getGridStyle} from '../../code/grid.functions';
import {
    isChildOfType,
    isChildrenList,
    isReactComponent,
    getByIndexOrLast,
    mapComponentsWithElements,
    mapComponents,
    repeatSize,
} from '../../utils/react-utils';
import union from 'lodash-es/union';
import {GridRepeat, IGridRepeatProps} from '../grid-repeat/GridRepeat';
import {isGridTemplateArray} from '../../utils/typescript-utils';

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
    repeater: Record<number, number>
    styles: CSSProperties[]
}

const GRID_CLASS_NAMESPACE = 'grid';
const gridBaseStyle: CSSProperties = { display: 'flex' };
const inlineGridBaseStyle: CSSProperties = { display: 'inline-flex' };
const columnStyle: CSSProperties = { flexDirection: 'column' };

interface IGridToSet {
    gridTemplateToSet: IGridTemplate
    spanTemplateToSet: number[]
}

class Grid extends PureComponent<IGridProps, IGridState> {
    state = {
        repeater: {},
        styles: [],
    };

    componentDidMount() {
        if (Children.count(this.props.children)) {
            this.computeGrid(this.getGridFromChildren());
        }
    }

    componentDidUpdate({
       children: prevChildren, tag: t, inline: i, style: s, size: si, span: sp, ...prevTemplateDescriptor
    }: PureComponent<IGridProps, IGridState>['props'],
    {
        repeater: prevRepeater, styles: prevStyles
    }: PureComponent<IGridProps, IGridState>['state']) {
        const { repeater } = this.state;
        const { children, tag, inline, style, size, span, ...templateDescriptor } = this.props;

        const gridFromChildren = this.getGridFromChildren(children);
        const prevGridFromChildren = this.getGridFromChildren(prevChildren);

        if (
            !isEqual(prevTemplateDescriptor, templateDescriptor)
            || !isEqual(gridFromChildren, prevGridFromChildren)
            || children !== prevChildren
            || !isEqual(repeater, prevRepeater)
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

    getGridFromChildren(children = this.props.children): IGridToSet {
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

    getGridToSet({ gridTemplateToSet, spanTemplateToSet }: IGridToSet): IGridToSet {
        const { gridTemplate, spanTemplate } = this.props;

        return {
            gridTemplateToSet: (gridTemplateToSet && gridTemplateToSet.length) ? gridTemplateToSet : gridTemplate,
            spanTemplateToSet: (spanTemplateToSet && spanTemplateToSet.length) ? spanTemplateToSet : spanTemplate,
        }
    }

    computeGrid = (gridToSet: IGridToSet) => {
        const {direction, marginGutter, paddingGutter, children } = this.props;
        const { repeater } = this.state;
        const componentsLength = mapComponents<IGridRepeatProps, number>(children, (child, componentIndex) => {
            if (isChildOfType(child, GridRepeat) && repeater.hasOwnProperty(componentIndex)) {
                return repeater[componentIndex];
            }

            return 1;
        }).reduce((acc, length) => acc + length, 0);

        let { gridTemplateToSet, spanTemplateToSet } = this.getGridToSet(gridToSet);

        if (
            (paddingGutter || marginGutter)
            && (!gridTemplateToSet
                || (isGridTemplateArray(gridTemplateToSet) && gridTemplateToSet.length === 0)
            )
        ) {
            gridTemplateToSet = repeatSize('auto', componentsLength);
        }

        const styles = getGridStyle({ direction, gridTemplate: gridTemplateToSet, spanTemplate: spanTemplateToSet, marginGutter, paddingGutter });

        this.setState({ styles });
    };

    onRepeatGridSet = (componentIndex: number, listLength: number) => {
        const {repeater} = this.state;

        if (repeater.hasOwnProperty(componentIndex) && repeater[componentIndex] === listLength) {
            return;
        }

        this.setState({
            repeater: {
                ...repeater,
                [componentIndex]: listLength
            },
        });
    };

    addStyleToProps = (children: ReactNode, styles: CSSProperties[]): ReactNode => {
        let styleIndex = 0;

        return mapComponentsWithElements(children, (child, componentIndex, childIndex) => {
            const props: IGridRepeatProps & IGridChildProps & { key: number } = { key: childIndex };

            if (!styles) {
                return cloneElement(child, props);
            }

            if (isChildOfType(child, GridRepeat)) {
                const repeaterLength = this.state.repeater[componentIndex] || 0;

                props.styles = union(styles.slice(styleIndex, styleIndex + repeaterLength), child.props.styles || []);
                props.onGridSet = this.onRepeatGridSet.bind(this, componentIndex);

                styleIndex += repeaterLength;

            } else if (styles[componentIndex]) {
                props.style = { ...getByIndexOrLast(styles, styleIndex, {}), ...(child.props.style || {}) };

                styleIndex += 1;
            }

            return cloneElement(child, props);
        });
    };

    get gridClass() {
        const { direction, className } = this.props;

        return [`${GRID_CLASS_NAMESPACE}__${direction} ${GRID_CLASS_NAMESPACE}${className ? ` ${className}` : ''}`].join(' ');
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

const GridColumn: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Column} {...gridProps} />;
const GridRow: FunctionComponent<Exclude<IGridProps, 'direction'>> = (gridProps) => <Grid direction={TemplateDirection.Row} {...gridProps} />;

export { Grid, GridColumn, GridRow, IGridProps };