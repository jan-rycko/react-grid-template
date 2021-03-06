export enum TemplateDirection {
    Row = 'row',
    Column = 'column',
}

export enum TemplateGutter {
    Margin = 'margin',
    Padding = 'padding',
}

export enum SizeProperty {
    Width = 'width',
    Height = 'height',
}

export enum GridUnit {
    Auto = 'auto',
    Fr = 'fr',
    Px = 'px',
    Rem = 'rem',
    Vh = 'vh',
    Vw = 'vw',
    Em = 'em',
    Percent = '%',
}

export type GritConstantUnit = Exclude<Exclude<GridUnit, GridUnit.Fr>, GridUnit.Auto>;

export const gridUnits = Object.values(GridUnit);
export const gridUnitRegExpPart = `(${gridUnits.join('|')})`;

export interface IGridTemplateDescriptor {
    direction?: TemplateDirection
    gridTemplate?: IGridTemplate,
    spanTemplate?: number[],
    paddingGutter?: string | string[]
    marginGutter?: string | string[]
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
    [SizeProperty.Width]?: IGridSize
    [SizeProperty.Height]?: IGridSize
    margin?: IGutterStyle
    padding?: IGutterStyle
    isEmptySpace?: boolean
}

export interface IGridSize {
    [GridUnit.Auto]?: boolean
    [GridUnit.Fr]?: number
    [GridUnit.Px]?: number
    [GridUnit.Rem]?: number
    [GridUnit.Vh]?: number
    [GridUnit.Vw]?: number
    [GridUnit.Em]?: number
    [GridUnit.Percent]?: number
}

export type IGridTemplate = (string | IGridStyle)[]

export interface IGridMargin {
    before?: IGridSize
    after?: IGridSize
}
export type IGridSizeWithMargin = IGridSize & IGridMargin;

export interface IGutterProperties {
    marginBefore?: IGridSize
    marginAfter?: IGridSize
    paddingBefore?: IGridSize
    paddingAfter?: IGridSize
    position?: number[]
}

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