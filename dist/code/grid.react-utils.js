"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildrenList = function (element) {
    return !!element && Array.isArray(element) && element.length > 0;
};
exports.isReactElement = function (element) {
    return !!element && 'type' in element;
};
exports.isReactComponent = function (element) {
    return exports.isReactElement(element) && typeof element.type !== 'string';
};
function isChildOfType(element, type) {
    return exports.isReactElement(element) && element.type === type;
}
exports.isChildOfType = isChildOfType;
