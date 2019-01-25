import {
    Children,
    Component,
    ComponentClass,
    ComponentElement,
    FunctionComponent,
    FunctionComponentElement,
    ReactElement,
    ReactNode,
    ReactNodeArray,
} from 'react';
import {IGridChildProps} from '../components/Grid';

export const isChildrenList = (element: ReactNode): element is ReactNodeArray => {
    return !!element && Array.isArray(element) && element.length > 0;
};

export const isReactElement = <T extends any>(element: ReactNode): element is ReactElement<T> => {
    return !!element && 'type' in (element as any);
};

export const isReactComponent = <T extends any>(element: ReactNode): element is ComponentElement<T & { children?: ReactNode }, Component<T>> | FunctionComponentElement<T & { children?: ReactNode }> => {
    return isReactElement(element) && typeof element.type !== 'string';
};

export function isChildOfType<T>(element: ReactNode, type: ComponentClass<T> | FunctionComponent<T>): element is ComponentElement<T & { children?: ReactNode }, Component<T>> | FunctionComponentElement<T & { children?: ReactNode }> {
    return isReactElement(element) && element.type === type;
}

export const countComponents = (children: ReactNode): number => {
    let length = 0;

    Children.forEach(children, child => {
        if (isReactComponent<IGridChildProps>(child)) length += 1;
    });

    return length;
};