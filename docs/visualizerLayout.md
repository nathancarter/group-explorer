
# Visualizer layout

Visualizers include
- CayleyDiagram.html
- CycleGraph.html
- Multtable.html
- SymmetryObject.html

There is also a sample [visualizerExemplar](./visualizerExemplar.md) that requires a group argument to run, thus:
<br>&nbsp;&nbsp;&nbsp;&nbsp;
    [visualizerExemplar.html?groupURL=../groups/D_4.group](./visualizerExemplar.html?groupURL=../groups/D_4.group).

## Top-level elements

The top-level visual components of the visualizers are
- **header**: a title showing the visualizer type and the group, such as "Cayley Diagram for <i>D</i><sub>4</sub>"
- **horiz-container**: a flex container to arrange the components of the visualizer other than the header
- **graphic**: the major component of the visualizer, a large graphic depicting the group according to the type of visualization
- **splitter**: a thin bar to the right of the graphic; grab the splitter with the mouse to resize the graphic
- **vert-container**: a flex container to arrange the controls and the help/reset buttons into a vertical stack
- **controls**: visualizer-specific panels that control the visualization, perhaps modifying their arrangement or highlighting a subset
- **help-reset**: buttons with the obvious functions

These layout components are defined in the visualizer's HTML and styled by the CSS in [visualizerFramework/visualizer.css](./visualizerFramework/visualizer_css.md).

## Graphical layout
     
Visualizers all have the same basic graphical layout:

  ![layout](./visualizerLayout.png "Visualizer layout")

The elements may be identified in this diagram from their borders according to the following key:

  ![layout_key](./visualizerLayoutKey.png "Visualizer color key")

