import {GridUnit, gridUnits, GritConstantUnit} from './grid.model';

export const isConstantUnit = (unit: GridUnit): unit is GritConstantUnit => {
    return gridUnits.includes(unit) && !isFractionUnit(unit);
};

export const isFractionUnit = (unit: GridUnit): unit is GridUnit.Fr => {
    return unit === GridUnit.Fr;
};