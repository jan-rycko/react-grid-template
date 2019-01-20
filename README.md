# React Grid

Grid makes styling components more human-like, simplyfing creation of dynamic-size and position UI elements.

## Installation
```sh
npm install react-grid-template --save
```

## Usage

### Simple grid layout with dynamic width column

```typescript
import React from 'react';
import { Grid, IGridChildProps } from 'react-grid-template';

const ComponentInGrid = ({ style }: IGridChildProps) =>
    <div style={style}>Hallo Gorgeous!</div>

const gridTemplate = [ '50px', '10%', '1fr', '1fr' ]

const ComponentWithGrid = () => {
    return (
        <Grid gutter="16px" gridTemplate={gridTemplate}>
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

Notice that 1fr will be automatically calculated as 50% of the remaining space including gutter.
You can also set additional modifiers in gridTemplate:
`. 15px` will add empty space element (with gutter) translated to extra margin.

### Span of elements

For some components might want to span across multiple columns of the template:


```typescript
const OtherComponentWithGrid = () => {
    return (
        <Grid gutter="16px" gridTemplate={gridTemplate} spanTemplate={[ 1, 3 ]}>
            <ComponentInGrid />
            <ComponentInGrid />
        </Grid>
    )
}
```

In this case second component will span over columns of size `10%`, `1fr` and `1fr` with it's gutter.
Span can have fractional values. Span `[ 1.5, 2.5 ]` will span first column up to half of second column of gridTemplate.

### Gutter

By default gutter will be calculated as padding. You can specify different behaviour by adding gutterAs prop:

```typescript
const YetAnotherComponentWithGrid = () => {
    return (
        <Grid
          gutter={[ '16px', '2%', '1vh', '0.2fr' ]}
          gutterAs="margin"
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

Notice this time we provided gutter as list of sizes for each gridTemplate element.
It will be divided evenly to gutter before and after element (whether it's padding or margin).

### Direction

By default Grid will layout components in a row. You can customize this behaviour by adding a prop:

```typescript
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

```typescript
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