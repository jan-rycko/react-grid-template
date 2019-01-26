import {Children, CSSProperties, Fragment, FunctionComponent} from 'react';
import * as React from 'react';
import {Grid, IGridProps} from '../grid/Grid';
import {getListLength} from '../../code/grid.react-utils';
import {isEmptySpaceExpression} from '../../code/grid.template';

const GridRepeat: FunctionComponent<IGridProps & { styles?: CSSProperties[] }> = ({ children, gridTemplate, styles = [], style = {}, ...gridProps }) => {
    const lineLength = gridTemplate.filter(value => !isEmptySpaceExpression(value)).length;
    const listLength = getListLength(children, gridTemplate);
    const childrenArray = Children.toArray(children);

    let gridPropsList: IGridProps[] = new Array(listLength).fill(null).map((_, index) => {
        const startIndex = index * lineLength;
        const endIndex = startIndex + lineLength;

        return {
            key: index,
            children: childrenArray.slice(startIndex, endIndex),
            gridTemplate,
            style: { ...(styles[index] || {}), ...style },
            ...gridProps,
        }
    });

    return (
        <Fragment>
            {gridPropsList.map(gridProps => <Grid {...gridProps} />)}
        </Fragment>
    )
};

export { GridRepeat };