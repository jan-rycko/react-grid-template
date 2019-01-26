import {IGridSize} from './grid.model';
import forEach from 'lodash-es/forEach';
import {reduce} from 'lodash-es';

const addSingleGridSize = (baseSize: IGridSize, sizeToAdd: IGridSize): IGridSize => {
    const size = { ...baseSize };

    forEach(sizeToAdd, (value, unit) => {
        if (typeof value === 'boolean') return;
        if (!size[unit]) size[unit] = 0;

        size[unit] += value;
    });

    return size;
};

export const addGridSizes = (baseSize: IGridSize = {}, ...sizesToAdd: IGridSize[]): IGridSize => {
    let size = { ...baseSize };

    sizesToAdd.forEach(sizeToAdd => {
        if (!sizeToAdd) return;

        size = addSingleGridSize(size, sizeToAdd);
    });

    return size;
};

export const subtractGridSizes = (baseSize: IGridSize, ...sizesToSubtract: IGridSize[]): IGridSize => {
    let size = { ...baseSize };

    const sizesToAdd = sizesToSubtract.map(size => {
        return reduce(size, (acc, value, unit) => ({
            ...acc,
            [unit]: typeof value === 'boolean' ? value : -value,
        }), {});
    });
    return addGridSizes(size, ...sizesToAdd)
};