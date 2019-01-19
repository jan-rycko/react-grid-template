"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TemplateDirection;
(function (TemplateDirection) {
    TemplateDirection["Row"] = "row";
    TemplateDirection["Column"] = "column";
})(TemplateDirection = exports.TemplateDirection || (exports.TemplateDirection = {}));
var TemplateGutter;
(function (TemplateGutter) {
    TemplateGutter["Margin"] = "margin";
    TemplateGutter["Padding"] = "padding";
})(TemplateGutter = exports.TemplateGutter || (exports.TemplateGutter = {}));
var GridUnit;
(function (GridUnit) {
    GridUnit["Fr"] = "fr";
    GridUnit["Px"] = "px";
    GridUnit["Rem"] = "rem";
    GridUnit["Vh"] = "vh";
    GridUnit["Vw"] = "vw";
    GridUnit["Em"] = "em";
    GridUnit["Percent"] = "%";
})(GridUnit = exports.GridUnit || (exports.GridUnit = {}));
exports.gridUnits = Object.values(GridUnit);
exports.gridUnitRegExpPart = "(" + exports.gridUnits.join('|') + ")";
