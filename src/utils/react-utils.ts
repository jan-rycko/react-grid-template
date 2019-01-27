import {
    Children,
    Component,
    ComponentClass,
    ComponentElement,
    FunctionComponent,
    FunctionComponentElement, ReactChild,
    ReactElement,
    ReactNode,
    ReactNodeArray,
} from 'react';
import {IGridChildProps} from '../components/grid/Grid';
import {Overwrite} from './typescript-utils';

export type ComponentOfPropsType<T = {}> = ComponentElement<T & { children?: ReactNode }, Component<T>> | FunctionComponentElement<T & { children?: ReactNode }>

export const isChildrenList = (element: ReactNode): element is ReactNodeArray => {
    return !!element && Array.isArray(element) && element.length > 0;
};

export const isReactElement = <T extends {} = {}>(element: ReactNode): element is ReactElement<T> => {
    return !!element && 'type' in (element as any);
};

export const isReactComponent = <T extends {} = {}>(element: ReactNode): element is ComponentOfPropsType<T> => {
    return isReactElement(element) && typeof element.type !== 'string';
};

export function isChildOfType<T>(element: ReactNode, type: ComponentClass<T> | FunctionComponent<T>): element is ComponentOfPropsType<T> {
    return isReactElement(element) && element.type === type;
}

export const repeatSize = (size: string, length: number): string[] => {
    return new Array(length).fill(size);
};

export const getByIndexOrLast = (array: any[], index: number, fallback: any = null) => {
    return array[index] ? array[index] : array[array.length - 1] || fallback;
};

export const countComponents = (children: ReactNode): number => {
    let length = 0;

    Children.forEach(children, child => {
        if (isReactComponent<IGridChildProps>(child)) length += 1;
    });

    return length;
};

export const mapComponents = <O = {}, T = ReactElement<Overwrite<IGridChildProps, O>>>(
    children: ReactNode,
    callback: (child: ComponentOfPropsType<Overwrite<IGridChildProps, O>>, componentIndex: number, childIndex: number) => T,
): T[] => {
    let diff = 0;

    return Children.toArray(children).reduce((acc, child, i) => {
        if (isReactComponent<Overwrite<IGridChildProps, O>>(child)) {
            const componentIndex = i - diff;

            return [
                ...acc,
                callback(child, componentIndex, i)
            ]
        }

        diff += 1;
        return acc;

    }, []);
};

export const mapComponentsWithElements = <O = {}>(
    children: ReactNode,
    callback: (child: ComponentOfPropsType<Overwrite<IGridChildProps, O>>, componentIndex: number, childIndex: number) => ReactChild,
): ReactNode => {
    let diff = 0;

    return Children.toArray(children).map((child, i) => {
        if (isReactComponent<Overwrite<IGridChildProps, O>>(child)) {
            const componentIndex = i - diff;

            return callback ? callback(child, componentIndex, i) : null;
        }

        diff += 1;
        return child;
    })
};

export const forEachComponent = <O = {}>(
    children: ReactNode,
    callback: (child: ComponentOfPropsType<Overwrite<IGridChildProps, O>>, componentIndex: number, childIndex: number) => void,
) => {
    let diff = 0;

    return Children.forEach(children, (child, i) => {
        if (isReactComponent<Overwrite<IGridChildProps, O>>(child)) {
            const componentIndex = i - diff;

            callback(child, componentIndex, i);
        }

        diff += 1;
    })
};