"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var react_1 = require("react");
var classnames_1 = require("classnames");
var shallowequal_1 = require("shallowequal");
var isEqual_1 = require("lodash-es/isEqual");
var grid_model_1 = require("code/grid.model");
var grid_react_utils_1 = require("code/grid.react-utils");
var grid_functions_1 = require("code/grid.functions");
var GRID_CLASS_NAMESPACE = 'grid';
var gridStyle = { display: 'flex' };
var columnStyle = { flexDirection: 'column' };
var Grid = /** @class */ (function (_super) {
    __extends(Grid, _super);
    function Grid() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            styles: [],
        };
        _this.getChildSizeAndSpan = function (children) {
            if (grid_react_utils_1.isReactComponent(children)) {
                var _a = children.props, _b = _a.size, size = _b === void 0 ? null : _b, _c = _a.span, span = _c === void 0 ? null : _c;
                if (size || span) {
                    return { size: size, span: span };
                }
            }
            return {};
        };
        _this.computeGrid = function (_a) {
            var sizeTemplate = _a.sizeTemplate, spanTemplateFromChildren = _a.spanTemplate;
            var _b = _this.props, direction = _b.direction, gridTemplate = _b.gridTemplate, spanTemplate = _b.spanTemplate, gutter = _b.gutter, gutterAs = _b.gutterAs;
            var gridToSet = gridTemplate;
            var spanToSet = spanTemplate;
            if (sizeTemplate.length) {
                gridToSet = sizeTemplate;
            }
            if (spanTemplateFromChildren.length) {
                spanToSet = spanTemplateFromChildren;
            }
            _this.setState({
                styles: grid_functions_1.getGridStyle({ direction: direction, gridTemplate: gridToSet, spanTemplate: spanToSet, gutter: gutter, gutterAs: gutterAs }),
            });
        };
        _this.addStyleToProps = function (children, styles) {
            var diff = 0;
            return react_1.Children.map(children, function (child, i) {
                if (!grid_react_utils_1.isReactComponent(child)) {
                    diff += 1;
                    return child;
                }
                var elementIndex = i - diff;
                var props = {};
                if (styles) {
                    if (styles[elementIndex]) {
                        props.style = styles[elementIndex];
                    }
                }
                return react_1.cloneElement(child, props);
            });
        };
        _this.getGridElementClass = function (direction) {
            var classNames = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                classNames[_i - 1] = arguments[_i];
            }
            return classnames_1.default.apply(void 0, [_this.gridClass + "__" + direction].concat(classNames));
        };
        return _this;
    }
    Grid.prototype.componentDidMount = function () {
        this.computeGrid(this.getGridFromChildren());
    };
    Grid.prototype.componentDidUpdate = function (_a) {
        var prevChildren = _a.children, gridPrevProps = __rest(_a, ["children"]);
        var _b = this.props, children = _b.children, gridProps = __rest(_b, ["children"]);
        var gridFromChildren = this.getGridFromChildren(children);
        var prevGridFromChildren = this.getGridFromChildren(prevChildren);
        if (!shallowequal_1.default(gridPrevProps, gridProps) || !isEqual_1.default(gridFromChildren, prevGridFromChildren)) {
            this.computeGrid(gridFromChildren);
        }
    };
    Grid.prototype.getGridFromChildren = function (children) {
        if (children === void 0) { children = this.props.children; }
        var grid = [];
        if (grid_react_utils_1.isReactComponent(children)) {
            grid = [this.getChildSizeAndSpan(children)];
        }
        if (grid_react_utils_1.isChildrenList(children)) {
            grid = children.map(this.getChildSizeAndSpan);
        }
        return grid.reduce(function (acc, _a) {
            var size = _a.size, span = _a.span;
            if (size) {
                acc.sizeTemplate.push(size);
            }
            if (span) {
                acc.spanTemplate.push(span);
            }
            return acc;
        }, { sizeTemplate: [], spanTemplate: [] });
    };
    Object.defineProperty(Grid.prototype, "gridClass", {
        get: function () { return GRID_CLASS_NAMESPACE; },
        enumerable: true,
        configurable: true
    });
    Grid.prototype.render = function () {
        var styles = this.state.styles;
        var _a = this.props, children = _a.children, _b = _a.style, style = _b === void 0 ? {} : _b, className = _a.className, _c = _a.tag, Component = _c === void 0 ? 'div' : _c, _d = _a.direction, direction = _d === void 0 ? grid_model_1.TemplateDirection.Row : _d, _e = _a.gutterAs, gutterAs = _e === void 0 ? grid_model_1.TemplateGutter.Padding : _e;
        var tagProps = {};
        if (Component !== react_1.Fragment) {
            tagProps = {
                style: __assign({}, style, gridStyle, (direction === grid_model_1.TemplateDirection.Column ? columnStyle : {})),
                className: this.getGridElementClass(direction, this.gridClass, className, gutterAs + "-gutter"),
            };
        }
        return (react_1.default.createElement(Component, __assign({}, tagProps), this.addStyleToProps(children, styles)));
    };
    return Grid;
}(react_1.PureComponent));
exports.default = Grid;
