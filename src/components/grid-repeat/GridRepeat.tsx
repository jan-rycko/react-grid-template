import {Children, CSSProperties, Fragment, PureComponent, ReactChild} from 'react';
import * as React from 'react';
import {Grid, IGridProps} from '../grid/Grid';
import {IGridTemplate} from '../../code/grid.model';
import {isGridTemplateFunction, isSpanTemplateFunction, Overwrite} from '../../code/grid.typescript-helpers';
import {getByIndexOrLast} from '../../code/grid.react-utils';
import {isEmptySpaceExpression} from '../../code/grid.template';

interface IGridOverwriteProps {
    styles?: CSSProperties[]
    gridTemplate?: IGridTemplate | ((childrenToSet: Readonly<ReactChild[]>, listIndex: number) => IGridTemplate)
    spanTemplate?: number[] | ((childrenToSet: Readonly<ReactChild[]>, listIndex: number) => number[])
}

type IGridRepeatProps = Overwrite<IGridProps, IGridOverwriteProps>

class GridRepeat extends PureComponent<IGridRepeatProps> {
    get gridProps() {
        const { children, gridTemplate, spanTemplate, styles = [], style = {}, ...gridProps } = this.props;
        const childrenArray = Children.toArray(children);

        let lineLength = 0;
        let indexOfLine = 0;
        let indexInLine = 0;
        let template: IGridTemplate;
        let span: number[];

        return childrenArray.reduce((acc, child, index) => {
            if (indexInLine === 0) {
                template = undefined;
                span = undefined;

                if (isGridTemplateFunction(gridTemplate)) {
                    template = gridTemplate(childrenArray.slice(index), indexOfLine)
                } else {
                    template = gridTemplate;
                }

                if (isSpanTemplateFunction(spanTemplate)) {
                    span = spanTemplate(childrenArray.slice(index), indexOfLine);
                } else {
                    span = spanTemplate;
                }

                lineLength = (span || template.filter(value => !isEmptySpaceExpression(value))).length;
            }

            if (!acc[indexOfLine]) acc[indexOfLine] = {};

            acc[indexOfLine] = {
                ...acc[indexOfLine],
                children: [
                    ...(acc[indexOfLine].children || []),
                    child
                ]
            };

            if (indexInLine === lineLength - 1) {
                acc[indexOfLine] = {
                    ...acc[indexOfLine],
                    key: indexOfLine,
                    gridTemplate: template,
                    spanTemplate: span,
                    style: { ...getByIndexOrLast(styles, indexOfLine, {}), ...style },
                    ...gridProps,
                };

                indexInLine = 0;
                indexOfLine += 1;
            } else {
                indexInLine += 1;
            }

            return acc;
        }, []);
    }

    render() {
        console.log(this.gridProps, this.props.children);

        return (
            <Fragment>
                {this.gridProps.map(gridProps => <Grid {...gridProps} />)}
            </Fragment>
        )
    }
}

export { GridRepeat };
