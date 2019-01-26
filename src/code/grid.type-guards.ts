import {GridUnit, gridUnits, GritConstantUnit} from './grid.model';

export const isConstantUnit = (unit: GridUnit): unit is GritConstantUnit => {
    return gridUnits.includes(unit) && !isFractionUnit(unit) && !isAutoUnit(unit);
};

export const isFractionUnit = (unit: GridUnit): unit is GridUnit.Fr => {
    return unit === GridUnit.Fr;
};

export const isAutoUnit = (unit: GridUnit): unit is GridUnit.Auto => {
    return unit === GridUnit.Auto;
};