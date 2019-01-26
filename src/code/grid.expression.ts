import {GridUnit, gridUnitRegExpPart, IGridSize, IGridStyle, TemplateDirection} from './grid.model';
import {getSizeProperties, sizeProperty} from './grid.mappers';
import words from 'lodash-es/words';

export const getExpressionValueRegex = (value: string): RegExp => {
    const operationsCount = (value.match(/ [-+] /g) || []).length;

    return new RegExp(`^(\\d+)${gridUnitRegExpPart}${` ([-+]) (\\d+)${gridUnitRegExpPart}`.repeat(operationsCount)}$`);
};

export const getSizeFromExpression = (expression: string, fraction: number = 1): IGridSize => {
    if (expression === 'auto') {
        return { [GridUnit.Auto]: true };
    }

    const [
        eq = '',
        value1 = '',
        unit1 = '',
        // tslint:disable-next-line:trailing-comma
        ...parts
    ] = expression.match(getExpressionValueRegex(expression)) || [];

    if (!eq) {
        return {};
    }

    const unitsAndValues: IGridSize = { [unit1]: Number(value1) * fraction };

    let sign: number;
    let numberValue: number;
    let unit: string;

    parts.forEach((elem, index) => {
        const elemIndex = index % 3;

        switch (elemIndex) {
            case 0:
                sign = elem === '-' ? -1 : 1;
                break;
            case 1:
                numberValue = Number(elem) * fraction;
                break;
            case 2:
                unit = elem;

                const currentValue = unitsAndValues[unit] || 0;

                unitsAndValues[unit] = currentValue + sign * numberValue;
                break;
        }
    });

    return unitsAndValues;
};

export const expressionWordRegExp = new RegExp(
    `(auto(?! [-+])|[0-9.]+${gridUnitRegExpPart})*( [-+] [0-9.]+${gridUnitRegExpPart}*)*`,
    'g',
);

export const getExpressionAsStyle = (value: string | number, direction: TemplateDirection): IGridStyle => {
    if (!value) return {};
    if (typeof value === 'number') {
        return { [sizeProperty[direction]]: { [GridUnit.Px]: value } };
    }

    const [ firstExpr, _, secondExpr ] = words(value, expressionWordRegExp);
    const { sizeAlong, sizeAcross } = getSizeProperties(direction);

    return {
        [sizeAlong]: firstExpr ? getSizeFromExpression(firstExpr) : {},
        [sizeAcross]: secondExpr ? getSizeFromExpression(secondExpr) : {},
    };
};