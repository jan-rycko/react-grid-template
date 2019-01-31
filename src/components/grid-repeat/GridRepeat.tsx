import {Children, CSSProperties, Fragment, PureComponent, ReactChild} from 'react';
import * as React from 'react';
import {Grid, IGridProps} from '../grid/Grid';
import {IGridTemplate} from '../../code/grid.model';
import {
    isEmptySpaceExpression,
    isDynamicTemplateFunction,
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
    private childrenArray: ReactChild[];

    private getStaticOrDynamicTemplate<T>(template: T | DynamicGridCallback<T>, indexOfLine: number, firstChildInLineIndex: number): T {
        if (!isDynamicTemplateFunction(template)) {
            return template;
        }

        return template(indexOfLine, this.childrenArray.slice(firstChildInLineIndex));
    };

    get gridProps() {
        const { children, gridTemplate, spanTemplate, styles, onGridSet, ...gridProps } = this.props;
        this.childrenArray = Children.toArray(children);

        let lineLength = 0;
        let indexOfLine = 0;
        let indexInLine = 0;
        let template: IGridTemplate;
        let span: number[];

        const props: (IGridProps & { key: number })[] = this.childrenArray.reduce((acc, child, index) => {
            if (indexInLine === 0) {
                template = this.getStaticOrDynamicTemplate(gridTemplate, indexOfLine, index);
                span = this.getStaticOrDynamicTemplate(spanTemplate, indexOfLine, index);

                lineLength = (span || template.filter(value => !isEmptySpaceExpression(value))).length;

                acc[indexOfLine] = {
                    key: indexOfLine,
                    gridTemplate: template,
                    spanTemplate: span,
                    ...gridProps,
                };
            }

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
