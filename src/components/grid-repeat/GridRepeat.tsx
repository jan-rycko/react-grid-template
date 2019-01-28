import {Children, CSSProperties, Fragment, PureComponent, ReactChild} from 'react';
import * as React from 'react';
import {Grid, IGridProps} from '../grid/Grid';
import {IGridTemplate} from '../../code/grid.model';
import {
    isEmptySpaceExpression,
    isGridTemplateFunction,
    isSpanTemplateFunction,
    Overwrite,
} from '../../utils/typescript-utils';
import {getByIndexOrLast} from '../../utils/react-utils';

export type DynamicGridCallback<T> = (listIndex: number, childrenToSet: Readonly<ReactChild[]>) => T

export interface IGridRepeatOverwriteProps {
    styles?: CSSProperties[]
    onGridSet?(listLength: number): void
    gridTemplate?: IGridTemplate | DynamicGridCallback<IGridTemplate>
    spanTemplate?: number[] | DynamicGridCallback<number[]>
}

export type IGridRepeatProps = Overwrite<IGridProps, IGridRepeatOverwriteProps>

class GridRepeat extends PureComponent<IGridRepeatProps> {
    // componentDidMount() {
    //     console.log('componentDidMount', this.props.styles);
    // }
    //
    // componentDidUpdate() {
    //     console.log('componentDidUpdate',this.props.styles);
    // }

    get gridProps() {
        const { children, gridTemplate, spanTemplate, styles, onGridSet, ...gridProps } = this.props;
        const childrenArray = Children.toArray(children);

        let lineLength = 0;
        let indexOfLine = 0;
        let indexInLine = 0;
        let template: IGridTemplate;
        let span: number[];
        const props: (IGridProps & { key: number })[] = childrenArray.reduce((acc, child, index) => {
            if (indexInLine === 0) {
                template = undefined;
                span = undefined;

                if (isGridTemplateFunction(gridTemplate)) {
                    template = gridTemplate(indexOfLine, childrenArray.slice(index))
                } else {
                    template = gridTemplate;
                }

                if (isSpanTemplateFunction(spanTemplate)) {
                    span = spanTemplate(indexOfLine, childrenArray.slice(index));
                } else {
                    span = spanTemplate;
                }

                lineLength = (span || template.filter(value => !isEmptySpaceExpression(value))).length;
            }

            if (!acc[indexOfLine]) acc[indexOfLine] = {
                key: indexOfLine,
                gridTemplate: template,
                spanTemplate: span,
                ...gridProps,
            };

            acc[indexOfLine] = {
                ...acc[indexOfLine],
                children: [
                    ...(acc[indexOfLine].children || []),
                    child
                ]
            };

            if (indexInLine === lineLength - 1) {
                indexInLine = 0;
                indexOfLine += 1;
            } else {
                indexInLine += 1;
            }

            return acc;
        }, []);

        if (onGridSet) onGridSet(props.length);

        return props;
    }

    get gridPropsWithStyles() {
        const {styles, style} = this.props;

        return this.gridProps.map((props, indexOfLine) => ({
            ...props,
            style: { ...getByIndexOrLast(styles, indexOfLine, {}), ...style },
        }))
    }

    render() {
        return (
            <Fragment>
                {this.gridPropsWithStyles.map(gridProps => <Grid {...gridProps} />)}
            </Fragment>
        )
    }
}

export { GridRepeat };
