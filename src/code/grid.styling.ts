import {GridUnit, IGridSize, IGridStyle, IGutterStyle, TemplateDirection, TemplateGutter} from './grid.model';
import {CSSProperties} from 'react';
import reduce from 'lodash-es/reduce';
import upperFirst from 'lodash-es/upperFirst';
import {BoxSizingProperty} from 'csstype';
import {getSecondDirection, sizeProperty} from './grid.mappers';

export const getSizesAsCSSProperties = (
    direction: TemplateDirection,
    sizes: IGridStyle[],
): CSSProperties[] => sizes.map(({ margin, padding, ...size }) => ({
    ...getSizeStyle(size, direction),
    flexShrink: 0,
    boxSizing: 'border-box' as BoxSizingProperty,
    ...getGutterStyle(TemplateGutter.Margin, margin),
    ...getGutterStyle(TemplateGutter.Padding, padding),
}));

const getGutterStyle = (gutterName: TemplateGutter, gutterStyle: IGutterStyle): CSSProperties => {
    return reduce(gutterStyle, (acc, size, direction) => {
        if (Object.keys(size).length === 0) return acc;

        return {
            ...acc,
            [`${gutterName}${upperFirst(direction)}`]: getCSSValue(size),
        };
    }, {});
};

const getSizeStyle = (size: IGridStyle, direction: TemplateDirection) => {
    const directionSizeProp = sizeProperty[direction];
    const directionSize = size[directionSizeProp];
    const directionStyle = getCSSValue(directionSize);
    const acrossDirectionSizeProp = sizeProperty[getSecondDirection(direction)];
    const acrossDirectionSize = size[acrossDirectionSizeProp];
    const acrossDirectionStyle = getCSSValue(acrossDirectionSize);

    return {
        [directionSizeProp]: directionStyle,
        ...(acrossDirectionStyle ? { [acrossDirectionSizeProp]: acrossDirectionStyle } : {}),
    }
};

const getCSSValue = (size: IGridSize) => {
    if (size[GridUnit.Auto]) return 'auto';

    const calcPrefix = 'calc(';
    const calcSuffix = ')';
    let parts = 0;

    const expression = reduce(size, (acc, value, unit) => {
        if (typeof value === 'boolean') return acc;

        parts += 1;

        const sign = Math.sign(value) === -1 ? '-' : '+';
        const absValue = Math.abs(value);
        const formattedSign = acc === '' ? (sign === '-' ? sign : '') : ` ${sign} `;

        return `${acc}${formattedSign}${absValue}${unit}`;
    }, '');

    const isCalcValue = parts > 1;

    return `${isCalcValue ? calcPrefix : ''}${expression}${isCalcValue ? calcSuffix : ''}`;
};