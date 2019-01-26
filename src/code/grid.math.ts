import {IGridSize, IGridSizeWithMargin} from './grid.model';
import cloneDeep from 'lodash-es/cloneDeep';
import forEach from 'lodash-es/forEach';

const addSingleGridSize = (baseSize: IGridSizeWithMargin, sizeToAdd: IGridSize): IGridSizeWithMargin => {
    const size = cloneDeep(baseSize);

    forEach(sizeToAdd, (value, unit) => {
        if (typeof value === 'boolean') return;
        if (!size[unit]) size[unit] = 0;

        size[unit] += value;
    });

    return size;
};

export const addGridSizes = (baseSize: IGridSizeWithMargin = {}, ...sizesToAdd: IGridSize[]): IGridSizeWithMargin => {
    let size = cloneDeep(baseSize);

    sizesToAdd.forEach(sizeToAdd => {
        if (!sizeToAdd) return;

        size = addSingleGridSize(size, sizeToAdd);
    });

    return size;
};

