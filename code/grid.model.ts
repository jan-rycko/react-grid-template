
export enum TemplateDirection {
    Row = 'row',
    Column = 'column',
}

export enum TemplateGutter {
    Margin = 'margin',
    Padding = 'padding',
}

export enum GridUnit {
    Fr = 'fr',
    Px = 'px',
    Rem = 'rem',
    Vh = 'vh',
    Vw = 'vw',
    Em = 'em',
    Percent = '%',
}

export type GritConstantUnit = Exclude<GridUnit, GridUnit.Fr>;

export const gridUnits = Object.values(GridUnit);
export const gridUnitRegExpPart = `(${gridUnits.join('|')})`;

export interface IGridTemplateDescriptor {
    direction?: TemplateDirection
    gridTemplate?: IGridTemplate,
    spanTemplate?: number[],
    gutter?: string | string[],
    gutterAs?: TemplateGutter
}

export interface IGutterStyle {
    top?: IGridSize
    bottom?: IGridSize
    left?: IGridSize
    right?: IGridSize
}

export interface IGridStyle {
    width?: IGridSize
    height?: IGridSize
    depth?: IGridSize
    margin?: IGutterStyle
    padding?: IGutterStyle
    isEmptySpace?: boolean
}

export interface IGridSize {
    [GridUnit.Fr]?: number
    [GridUnit.Px]?: number
    [GridUnit.Rem]?: number
    [GridUnit.Vh]?: number
    [GridUnit.Vw]?: number
    [GridUnit.Em]?: number
    [GridUnit.Percent]?: number
}

export type IGridTemplate = (string | IGridStyle)[]
// tslint:disable-next-line:interface-over-type-literal
export interface IGridMargin {
    before?: IGridSize
    after?: IGridSize
}

export type IGridSizeWithMargin = IGridSize & IGridMargin;

export interface IGridElementsRange {
    start: number
    startFraction: number | null
    end: number
    endFraction: number | null
}

export interface IGridSizeFraction {
    fraction: number
    isPartStart?: boolean
    isPartEnd?: boolean
}