import {
    Component,
    ComponentClass,
    ComponentElement,
    ReactElement,
    ReactNode,
    ReactNodeArray,
    SFC,
    SFCElement,
} from 'react';

export const isChildrenList = (element: ReactNode): element is ReactNodeArray => {
    return !!element && Array.isArray(element) && element.length > 0;
};

export const isReactElement = <T extends any>(element: ReactNode): element is ReactElement<T> => {
    return !!element && 'type' in (element as any);
};

export const isReactComponent = <T extends any>(element: ReactNode): element is ComponentElement<T, Component<T>> | SFCElement<T> => {
    return isReactElement(element) && typeof element.type !== 'string';
};

export function isChildOfType<T>(element: ReactNode, type: ComponentClass<T> | SFC<T>): element is ReactElement<T> {
    return isReactElement(element) && element.type === type;
}