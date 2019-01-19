"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a, _b;
var reduce_1 = require("lodash-es/reduce");
var forEach_1 = require("lodash-es/forEach");
var grid_model_1 = require("./grid.model");
var cloneDeep_1 = require("lodash-es/cloneDeep");
var isPlainObject_1 = require("lodash-es/isPlainObject");
var upperFirst_1 = require("lodash-es/upperFirst");
var words_1 = require("lodash-es/words");
var isConstantUnit = function (unit) {
    return grid_model_1.gridUnits.includes(unit) && !isFractionUnit(unit);
};
var isFractionUnit = function (unit) {
    return unit === grid_model_1.GridUnit.Fr;
};
var isGridSize = function (value) {
    return isPlainObject_1.default(value);
};
exports.getGridStyle = function (_a) {
    var gridTemplate = _a.gridTemplate, spanTemplate = _a.spanTemplate, gutter = _a.gutter, _b = _a.gutterAs, gutterAs = _b === void 0 ? grid_model_1.TemplateGutter.Padding : _b, _c = _a.direction, direction = _c === void 0 ? grid_model_1.TemplateDirection.Row : _c;
    if (!gridTemplate) {
        return [];
    }
    var sizes = getGridTemplateSizes(gridTemplate, gutter, gutterAs, direction);
    if (spanTemplate) {
        sizes = calculateSizesWithSpanTemplate(sizes, spanTemplate, direction);
    }
    return getSizesAsCSSProperties(direction, sizes);
};
var getExpressionValueRegex = function (value) {
    var operationsCount = (value.match(/ [-+] /g) || []).length;
    return new RegExp("^(\\d+)" + grid_model_1.gridUnitRegExpPart + (" ([-+]) (\\d+)" + grid_model_1.gridUnitRegExpPart).repeat(operationsCount) + "$");
};
var getValueFromExpressionPart = function (expression, fraction) {
    if (fraction === void 0) { fraction = 1; }
    var _a;
    var _b = expression.match(getExpressionValueRegex(expression)) || [], _c = _b[0], eq = _c === void 0 ? '' : _c, _d = _b[1], value1 = _d === void 0 ? '' : _d, _e = _b[2], unit1 = _e === void 0 ? '' : _e, 
    // tslint:disable-next-line:trailing-comma
    parts = _b.slice(3);
    if (!eq) {
        return {};
    }
    var unitsAndValues = (_a = {}, _a[unit1] = Number(value1) * fraction, _a);
    var sign;
    var numberValue;
    var unit;
    parts.forEach(function (elem, index) {
        var elemIndex = index % 3;
        switch (elemIndex) {
            case 0:
                sign = elem === '-' ? -1 : 1;
                break;
            case 1:
                numberValue = Number(elem) * fraction;
                break;
            case 2:
                unit = elem;
                var currentValue = unitsAndValues[unit] || 0;
                unitsAndValues[unit] = currentValue + sign * numberValue;
                break;
        }
    });
    return unitsAndValues;
};
var expressionWordRegExp = /\.?\d+\w*( [-+] \.?\d+\w*)*/g;
var getExpressionAsStyle = function (value, direction) {
    var _a, _b;
    if (!value)
        return {};
    if (typeof value === 'number') {
        return _a = {}, _a[sizeProperty[direction]] = (_b = {}, _b[grid_model_1.GridUnit.Px] = value, _b), _a;
    }
    var isEmptySpace = value.substr(0, 2) === '. ';
    var expression = isEmptySpace ? value.replace('. ', '') : value;
    var _c = words_1.default(expression, expressionWordRegExp), width = _c[0], height = _c[1], depth = _c[2];
    return {
        width: width ? getValueFromExpressionPart(width) : {},
        height: height ? getValueFromExpressionPart(height) : {},
        depth: depth ? getValueFromExpressionPart(depth) : {},
        isEmptySpace: isEmptySpace,
    };
};
var getGridStatsAndSizesWithEmptySpaces = function (gridTemplate, gutter, gutterAs, direction) {
    if (gutter === void 0) { gutter = ''; }
    if (gutterAs === void 0) { gutterAs = grid_model_1.TemplateGutter.Padding; }
    if (direction === void 0) { direction = grid_model_1.TemplateDirection.Row; }
    var styleMapWithEmptySpaces = [];
    var directionStats = {};
    var after = {};
    var before = {};
    var halfGutter = {};
    var checkGutter = true;
    var cellStyle;
    var lastElementIndex = gridTemplate.length - 1;
    if (!Array.isArray(gutter)) {
        checkGutter = false;
        if (typeof gutter === 'string') {
            halfGutter = getValueFromExpressionPart(gutter, .5);
            after = cloneDeep_1.default(halfGutter);
            before = cloneDeep_1.default(halfGutter);
        }
    }
    gridTemplate.forEach(function (sizeDescriptor, index) {
        if (typeof sizeDescriptor === 'string') {
            cellStyle = getExpressionAsStyle(sizeDescriptor, direction);
        }
        else {
            cellStyle = sizeDescriptor;
        }
        if (checkGutter && Array.isArray(gutter) && gutter[index]) {
            halfGutter = getValueFromExpressionPart(gutter[index], .5);
            checkGutter = false;
            after = cloneDeep_1.default(halfGutter);
            before = cloneDeep_1.default(halfGutter);
        }
        if (index === 0) {
            before = {};
        }
        else if (index === 1) {
            before = cloneDeep_1.default(halfGutter);
        }
        if (index === lastElementIndex) {
            after = {};
        }
        directionStats = addGridSizes(directionStats, cellStyle[sizeProperty[direction]], before, after);
        styleMapWithEmptySpaces[index] = __assign({}, cellStyle, getGutterGridStyle(direction, gutterAs, before, after));
    });
    return { directionStats: directionStats, styleMapWithEmptySpaces: styleMapWithEmptySpaces };
};
var sizeProperty = (_a = {},
    _a[grid_model_1.TemplateDirection.Row] = 'width',
    _a[grid_model_1.TemplateDirection.Column] = 'height',
    _a);
var getSecondDirection = function (direction) {
    return direction === grid_model_1.TemplateDirection.Row ? grid_model_1.TemplateDirection.Column : grid_model_1.TemplateDirection.Row;
};
var gutterProperties = (_b = {},
    _b[grid_model_1.TemplateDirection.Row] = ['left', 'right'],
    _b[grid_model_1.TemplateDirection.Column] = ['top', 'bottom'],
    _b);
var getGutterGridStyle = function (direction, gutterAs, before, after) {
    var _a, _b;
    var _c = gutterProperties[direction], gutterBefore = _c[0], gutterAfter = _c[1];
    return _a = {},
        _a[gutterAs] = (_b = {},
            _b[gutterBefore] = before,
            _b[gutterAfter] = after,
            _b),
        _a;
};
var getGutterProperties = function (_a, direction) {
    var _b = _a === void 0 ? {} : _a, _c = _b.margin, margin = _c === void 0 ? {} : _c, _d = _b.padding, padding = _d === void 0 ? {} : _d;
    var _e = gutterProperties[direction], before = _e[0], after = _e[1];
    return {
        marginBefore: margin[before] || {},
        marginAfter: margin[after] || {},
        paddingBefore: padding[before] || {},
        paddingAfter: padding[after] || {},
    };
};
var convertEmptySpacesToMargin = function (gridWithEmptySpaces, direction) {
    var sizes = [];
    var elemIndex = 0;
    var baseSize = {};
    gridWithEmptySpaces.forEach(function (size, index) {
        baseSize = cloneDeep_1.default(size);
        if (!baseSize.isEmptySpace) {
            elemIndex++;
            sizes = sizes.concat([
                baseSize,
            ]);
            return;
        }
        var _a = getGutterProperties(baseSize, direction), paddingBefore = _a.paddingBefore, paddingAfter = _a.paddingAfter, marginBefore = _a.marginBefore, marginAfter = _a.marginAfter;
        var directionSize = baseSize[sizeProperty[direction]];
        var _b = gutterProperties[direction], gutterBefore = _b[0], gutterAfter = _b[1];
        var placeholderSize = addGridSizes(directionSize, paddingBefore, paddingAfter, marginBefore, marginAfter);
        if (sizes[elemIndex - 1]) {
            if (!sizes[elemIndex - 1].margin)
                sizes[elemIndex - 1].margin = {};
            sizes[elemIndex - 1].margin[gutterAfter] =
                addGridSizes(placeholderSize, sizes[elemIndex - 1].margin[gutterAfter]);
        }
        else if (gridWithEmptySpaces[index + 1]) {
            gridWithEmptySpaces[index + 1].margin[gutterBefore] =
                addGridSizes(placeholderSize, gridWithEmptySpaces[index + 1].margin[gutterBefore]);
        }
    });
    return sizes;
};
var getGridTemplateSizes = function (gridTemplate, gutter, gutterAs, direction) {
    if (gutterAs === void 0) { gutterAs = grid_model_1.TemplateGutter.Padding; }
    if (direction === void 0) { direction = grid_model_1.TemplateDirection.Row; }
    var _a = getGridStatsAndSizesWithEmptySpaces(gridTemplate, gutter, gutterAs, direction), directionStats = _a.directionStats, styleMapWithEmptySpaces = _a.styleMapWithEmptySpaces;
    var styleMap = convertEmptySpacesToMargin(styleMapWithEmptySpaces, direction);
    console.log({
        directionStats: directionStats,
        styleMapWithEmptySpaces: styleMapWithEmptySpaces,
        styleMap: styleMap,
    });
    return styleMap.map(function (style) {
        var _a, _b, _c;
        var _d = getGutterProperties(style, direction), paddingBefore = _d.paddingBefore, paddingAfter = _d.paddingAfter, marginBefore = _d.marginBefore, marginAfter = _d.marginAfter;
        var _e = gutterProperties[direction], gutterBefore = _e[0], gutterAfter = _e[1];
        var directionSizeProperty = sizeProperty[direction];
        var acrossDirectionSizeProperty = sizeProperty[getSecondDirection(direction)];
        return _a = {},
            _a[directionSizeProperty] = getConstantUnitSizeFromStats(style[directionSizeProperty], directionStats),
            _a[acrossDirectionSizeProperty] = style[acrossDirectionSizeProperty],
            _a.padding = (_b = {},
                _b[gutterBefore] = getConstantUnitSizeFromStats(paddingBefore, directionStats),
                _b[gutterAfter] = getConstantUnitSizeFromStats(paddingAfter, directionStats),
                _b),
            _a.margin = (_c = {},
                _c[gutterBefore] = getConstantUnitSizeFromStats(marginBefore, directionStats),
                _c[gutterAfter] = getConstantUnitSizeFromStats(marginAfter, directionStats),
                _c),
            _a;
    });
};
var getConstantUnitSizeFromStats = function (_a, flexGridStats) {
    var _b = _a.fr, fr = _b === void 0 ? 0 : _b, constantUnits = __rest(_a, ["fr"]);
    var _c;
    if (fr === 0) {
        return __assign({}, constantUnits);
    }
    var fraction = fr / flexGridStats[grid_model_1.GridUnit.Fr];
    return reduce_1.default(flexGridStats, function (acc, statValue, statUnit) {
        var _a, _b;
        if (!isConstantUnit(statUnit))
            return acc;
        var currentUnitValue = constantUnits[statUnit] || 0;
        var diffValue = -statValue * fraction + 2 * currentUnitValue;
        if (statUnit === grid_model_1.GridUnit.Percent) {
            return __assign({}, acc, (_a = {}, _a[grid_model_1.GridUnit.Percent] = acc[statUnit] + diffValue, _a));
        }
        return __assign({}, acc, (_b = {}, _b[statUnit] = diffValue, _b));
    }, (_c = {}, _c[grid_model_1.GridUnit.Percent] = 100 * fraction, _c));
};
var getGutterStyle = function (gutterName, gutterStyle) {
    return reduce_1.default(gutterStyle, function (acc, size, direction) {
        var _a;
        return __assign({}, acc, (_a = {}, _a["" + gutterName + upperFirst_1.default(direction)] = getCSSValue(size), _a));
    }, {});
};
var getSizesAsCSSProperties = function (direction, sizes) { return sizes.map(function (_a) {
    var margin = _a.margin, padding = _a.padding, isEmptySpace = _a.isEmptySpace, size = __rest(_a, ["margin", "padding", "isEmptySpace"]);
    return (__assign({}, getSizeStyle(size, direction), { boxSizing: 'content-box' }, getGutterStyle(grid_model_1.TemplateGutter.Margin, margin), getGutterStyle(grid_model_1.TemplateGutter.Padding, padding)));
}); };
var getSizeStyle = function (size, direction) {
    var _a, _b;
    var directionSizeProp = sizeProperty[direction];
    var directionSize = size[directionSizeProp];
    var directionStyle = getCSSValue(directionSize);
    var acrossDirectionSizeProp = sizeProperty[getSecondDirection(direction)];
    var acrossDirectionSize = size[acrossDirectionSizeProp];
    var acrossDirectionStyle = getCSSValue(acrossDirectionSize);
    return __assign((_a = {}, _a[directionSizeProp] = directionStyle, _a), (acrossDirectionStyle ? (_b = {}, _b[acrossDirectionSizeProp] = acrossDirectionStyle, _b) : {}));
};
var getCSSValue = function (size) {
    var calcPrefix = 'calc(';
    var calcSuffix = ')';
    var parts = 0;
    var expression = reduce_1.default(size, function (acc, value, unit) {
        if (typeof value === 'boolean')
            return acc;
        parts += 1;
        var sign = Math.sign(value) === -1 ? '-' : '+';
        var absValue = Math.abs(value);
        var formattedSign = acc === '' ? sign : " " + sign + " ";
        return "" + acc + formattedSign + absValue + unit;
    }, '');
    var isCalcValue = parts > 1;
    return "" + (isCalcValue ? calcPrefix : '') + expression + (isCalcValue ? calcSuffix : '');
};
var calculateSizesWithSpanTemplate = function (styles, spanTemplate, direction) {
    if (direction === void 0) { direction = grid_model_1.TemplateDirection.Row; }
    var spanSoFar = 0;
    return spanTemplate.reduce(function (acc, span) {
        acc.push(calculateSizeWithSpan(styles, span, spanSoFar, direction));
        spanSoFar += span;
        return acc;
    }, []);
};
var getListPart = function (span, spanSoFar) {
    var start = Math.floor(spanSoFar);
    var end = Math.ceil(spanSoFar + span);
    var startFraction = 1 - (spanSoFar % 1);
    var endFraction = (spanSoFar + span) % 1;
    return {
        start: start,
        startFraction: startFraction !== 1 ? startFraction : null,
        end: end,
        endFraction: endFraction !== 0 ? endFraction : null,
    };
};
var calculateSizeWithSpan = function (sizes, span, spanSoFar, direction) {
    if (direction === void 0) { direction = grid_model_1.TemplateDirection.Row; }
    var _a = getListPart(span, spanSoFar), start = _a.start, end = _a.end, startFraction = _a.startFraction, endFraction = _a.endFraction;
    var spannedSizesWithOverlap = sizes.slice(start, end);
    var length = spannedSizesWithOverlap.length;
    var spannedSizes = spannedSizesWithOverlap.map(function (size, i) {
        if (startFraction && endFraction && length === 1) {
            return getSizePart(size, { fraction: endFraction - startFraction }, direction);
        }
        if (startFraction && i === 0) {
            return getSizePart(size, { fraction: startFraction, isPartStart: true }, direction);
        }
        if (endFraction && i === length - 1) {
            return getSizePart(size, { fraction: endFraction, isPartEnd: true }, direction);
        }
        return size;
    });
    return mergeToSingleSize(spannedSizes, direction);
};
var getSizePart = function (size, _a, direction) {
    var fraction = _a.fraction, isPartEnd = _a.isPartEnd, isPartStart = _a.isPartStart;
    if (direction === void 0) { direction = grid_model_1.TemplateDirection.Row; }
    var _b;
    var gutterToAdd = {};
    var _c = getGutterProperties(size, direction), marginBefore = _c.marginBefore, paddingBefore = _c.paddingBefore, marginAfter = _c.marginAfter, paddingAfter = _c.paddingAfter;
    var directionSizeProperty = sizeProperty[direction];
    var acrossDirectionSizeProperty = sizeProperty[getSecondDirection(direction)];
    var acrossDirectionSize = size[acrossDirectionSizeProperty];
    if (isPartEnd) {
        gutterToAdd = addGridSizes(marginBefore, paddingBefore);
    }
    if (isPartStart) {
        gutterToAdd = addGridSizes(marginAfter, paddingAfter);
    }
    var directionSize = reduce_1.default(size[directionSizeProperty], function (acc, value, unit) {
        var _a;
        if (typeof value !== 'number')
            return acc;
        var prevValue = 0;
        if (acc[unit]) {
            prevValue = acc[unit];
        }
        return __assign({}, acc, (_a = {}, _a[unit] = prevValue + value * fraction, _a));
    }, gutterToAdd);
    return _b = {},
        _b[directionSizeProperty] = directionSize,
        _b[acrossDirectionSizeProperty] = acrossDirectionSize,
        _b;
};
var mergeToSingleSize = function (styles, direction) {
    var lastIndex = styles.length - 1;
    var directionSizeProperty = sizeProperty[direction];
    var _a = gutterProperties[direction], gutterBefore = _a[0], gutterAfter = _a[1];
    return styles.reduce(function (finalSize, style, index) {
        var _a, _b, _c, _d, _e;
        var _f = getGutterProperties(style, direction), marginBefore = _f.marginBefore, marginAfter = _f.marginAfter, paddingBefore = _f.paddingBefore, paddingAfter = _f.paddingAfter;
        var directionSize = style[directionSizeProperty];
        var sizeToAdd = __assign({}, directionSize);
        if (paddingBefore || marginBefore) {
            if (index === 0) {
                finalSize = __assign({}, finalSize, { margin: __assign({}, finalSize.margin, (_a = {}, _a[gutterBefore] = marginBefore, _a)), padding: __assign({}, finalSize.padding, (_b = {}, _b[gutterBefore] = paddingBefore, _b)) });
            }
            else {
                sizeToAdd = addGridSizes(sizeToAdd, marginBefore, paddingBefore);
            }
        }
        if (paddingAfter || marginAfter) {
            if (index === lastIndex) {
                finalSize = __assign({}, finalSize, { margin: __assign({}, finalSize.margin, (_c = {}, _c[gutterAfter] = marginAfter, _c)), padding: __assign({}, finalSize.padding, (_d = {}, _d[gutterAfter] = paddingAfter, _d)) });
            }
            else {
                sizeToAdd = addGridSizes(sizeToAdd, paddingAfter, marginAfter);
            }
        }
        return __assign({}, finalSize, (_e = {}, _e[directionSizeProperty] = addGridSizes(finalSize[directionSizeProperty], sizeToAdd), _e));
    }, { margin: {}, padding: {} });
};
var addSingleGridSize = function (baseSize, sizeToAdd) {
    var size = cloneDeep_1.default(baseSize);
    forEach_1.default(sizeToAdd, function (value, unit) {
        if (typeof value === 'boolean')
            return;
        if (!size[unit])
            size[unit] = 0;
        size[unit] += value;
    });
    return size;
};
var addGridSizes = function (baseSize) {
    if (baseSize === void 0) { baseSize = {}; }
    var sizesToAdd = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sizesToAdd[_i - 1] = arguments[_i];
    }
    var size = cloneDeep_1.default(baseSize);
    sizesToAdd.forEach(function (sizeToAdd) {
        if (!sizeToAdd)
            return;
        size = addSingleGridSize(size, sizeToAdd);
    });
    return size;
};
