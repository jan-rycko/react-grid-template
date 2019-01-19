import { Component, ComponentClass, ComponentElement, ReactElement, ReactNode, ReactNodeArray, SFC } from 'react';
export declare const isChildrenList: (element: ReactNode) => element is ReactNodeArray;
export declare const isReactElement: <T extends any>(element: ReactNode) => element is ReactElement<T>;
export declare const isReactComponent: <T extends any>(element: ReactNode) => element is ComponentElement<T, Component<T, {}, any>> | import("react").FunctionComponentElement<T>;
export declare function isChildOfType<T>(element: ReactNode, type: ComponentClass<T> | SFC<T>): element is ReactElement<T>;
