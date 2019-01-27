import {GridUnit, gridUnits, GritConstantUnit, IGridTemplate} from '../code/grid.model';
import isFunction from 'lodash-es/isFunction';
import {DynamicGridCallback} from '../components/grid-repeat/GridRepeat';

export const isConstantUnit = (unit: GridUnit): unit is GritConstantUnit => {
    return gridUnits.includes(unit) && !isFractionUnit(unit) && !isAutoUnit(unit);
};

export const isFractionUnit = (unit: GridUnit): unit is GridUnit.Fr => {
    return unit === GridUnit.Fr;
};

export const isAutoUnit = (unit: GridUnit): unit is GridUnit.Auto => {
    return unit === GridUnit.Auto;
};

export const isGridTemplateFunction = (
    gridTemplate: IGridTemplate | DynamicGridCallback<IGridTemplate>,
): gridTemplate is DynamicGridCallback<IGridTemplate> => {
    return isFunction(gridTemplate);
};

export const isSpanTemplateFunction = (
    spanTemplate: number[] | DynamicGridCallback<number[]>
): spanTemplate is DynamicGridCallback<number[]> => {
    return isFunction(spanTemplate);
};

export const isGridTemplateArray = (
    gridTemplate: IGridTemplate | DynamicGridCallback<IGridTemplate>,
): gridTemplate is IGridTemplate => {
    return Array.isArray(gridTemplate);
};

export const isEmptySpaceExpression = (value: any): value is string => {
    return typeof value === 'string' && value.substr(0, 2) === '. ';
};

type Diff<T extends keyof any, U extends keyof any> =
    ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

export type Overwrite<T, U> = Pick<T, Diff<keyof T, keyof U>> & U;