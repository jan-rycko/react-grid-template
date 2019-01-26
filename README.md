# react-grid-template

Grid makes styling components more human-like, simplyfing creation of dynamic-size and position UI elements.

## Installation
```sh
npm install react-grid-template --save
```

## Usage

### Simple grid layout with dynamic width column

In your components just pass style prop to most outer container and you're good to go.

```JSX
import React from 'react';
import { Grid, IGridChildProps } from 'react-grid-template';

const ComponentInGrid = ({ style }: IGridChildProps) =>
    <div style={style}>Hallo Gorgeous!</div>

const gridTemplate = [ '50px', '10% + 10px', '1fr', '1fr' ]

const ComponentWithGrid = () => {
    return (
        <Grid marginGutter="16px" gridTemplate={gridTemplate}>
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

Notice that 1fr will be automatically calculated as 50% of the remaining space.
You can also set additional modifiers in gridTemplate:
`. 15px` will add empty space element (with gutter) translated to extra margin.

### Span of elements

For some components might want to span across multiple columns of the template:

```JSX
const OtherComponentWithGrid = () => {
    return (
        <Grid marginGutter="16px" gridTemplate={gridTemplate} spanTemplate={[ 1, 3 ]}>
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

In this case second component will span over columns of size `10%`, `1fr` and `1fr` with it's gutter.
Span can have fractional values. Span `[ 1.5, 2.5 ]` will span first column up to half of second column of gridTemplate.

### Gutter

Gutter can be provided as string value or array describing template elements gutter. It will be divided evenly to gutter before and after element (whether it's padding or margin).

```JSX
const YetAnotherComponentWithGrid = () => {
    return (
        <Grid
          marginGutter={[ '16px', '2%', '1vh', '0.2fr' ]}
          paddingGutter='10px'
          gridTemplate={gridTemplate}
        >
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

### Direction

By default Grid will layout components in a row. You can customize this behaviour by adding a prop:

```JSX
const WhyNotWriteSomeComponentsJustForTheSakeOfWritingThem = () => {
    return (
        <Grid
          direction="column"
          gridTemplate={gridTemplate}
        >
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

### Customizing container

By default component will be rendered as 'div'. You can customize it by adding your tag, style and className prop:

```JSX
const AComponent = () => {
    return (
        <Grid
          tag="section"
          style={{ minWidth: '100%' }}
          className="my-own-class-name"
          gridTemplate={gridTemplate}
        >
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

or even omit the tag by passing Fragment as a tag for super flat structures.
Just make sure that the parent has `display: flex;` (and `flex-direction: column;` for column grid) style set.

### Composition

Example below shows main reason why this module was created. We can have several components possibly in multiple other components that need to align with each other. 
Here is a way to share this sizing template with each other to align.
 
```JSX
const gridTemplate = [ '100px', '1fr', '100px' ];

const BComponent = () => {
    return (
        <GridColumn marginGutter="10px">
            <GridRow marginGutter="10px" gridTemplate={gridTemplate}>
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
            </GridRow>
            <GridRow marginGutter="10px" gridTemplate={gridTemplate}>
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
            </GridRow>
            <GridRow marginGutter="10px" gridTemplate={gridTemplate}>
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
            </GridRow>
        </Grid>
    )
}
```

### Repetition

Pattern of aligning multiple components in a list-style, table-style or a grid-style is very common. So much so, that I added GridRepeat component to wrap lists to GridRows or GridColumns automatically:
Component below will render three rows of GridRow with set gridTemplate (for every row) as wall as marginGutter. It will also pass every other prop to rendered Grid component.

```JSX
const gridTemplate = [ '100px', '1fr', '100px' ];

const CComponent = () => {
    return (
        <GridColumn marginGutter="10px">
            <GridRepeat marginGutter="10px" gridTemplate={gridTemplate}>
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
                <ComponentInGrid />
            </GridRow>
        </Grid>
    )
}
```

So you can now just:

```JSX
const DComponent = () => {
    return (
        <GridColumn marginGutter="10px">
            <GridRepeat marginGutter="10px" gridTemplate={gridTemplate}>
                {list.map(user => <ComponentInGrid key={user.id} user={user} />)}
            </GridRow>
        </Grid>
    )
}
```

## In preparation

Main goal of this module is to simplify tile grids creation in virtual space, as I use it to render genealogy tree.

I will work on what needs to and can be parametrised in Grid flow management. 
Especially what interests me is how can we add fluctuations to GridRepeat to change gridTemplate with some kind of pattern.

Second goal I have is to add Layer component which will render grid on absolutely (or fixed) positioned component and will manage z-indexes.

## Contact

If you have any issues, ideas or feature requests, email me at [here](jan.rycko@gmail.com "jan.rycko@gmail.com").