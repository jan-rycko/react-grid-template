import {IGridSize, IGutterStyle} from './grid.model';
import forEach from 'lodash-es/forEach';
import reduce from 'lodash-es/reduce';

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

export const mergeGutterStyle = ({ left = {}, right = {}, top = {}, bottom = {} }: IGutterStyle, secondGutter: IGutterStyle): IGutterStyle => ({
    left: addGridSizes(left, secondGutter.left),
    right: addGridSizes(right, secondGutter.right),
    top: addGridSizes(top, secondGutter.top),
    bottom: addGridSizes(bottom, secondGutter.bottom),
});