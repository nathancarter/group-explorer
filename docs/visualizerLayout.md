
# Visualizer layout

Visualizers include
- CayleyDiagram.html
- CycleGraph.html
- Multtable.html
- SymmetryObject.html

There is also a sample [visualizerExemplar](./visualizerExemplar.md) that requires a group argument to run, thus:
<br>&nbsp;&nbsp;&nbsp;&nbsp;[visualizerExemplar.html?groupURL=/group-explorer/groups/D_4.group](./visualizerExemplar.html?groupURL=/group-explorer/groups/D_4.group).

## Top-level elements

The top-level visual components of the visualizers are
- **header**: a title showing the visualizer type and the group, such as "Cayley Diagram for <i>D</i><sub>4</sub>"
- **horiz-container**: a flex container to arrange the components of the visualizer other than the header
- **graphic**: the major component of the visualizer, a large graphic depicting the group according to the type of visualization
- **splitter**: a thin bar to the right of the graphic; grab the splitter with the mouse to resize the graphic
- **vert-container**: a flex container to arrange the controls and the help/reset buttons into a vertical stack
- **controls**: visualizer-specific panels that control the visualization, perhaps modifying their arrangement or highlighting a subset
- **help-reset**: buttons with the obvious functions

These layout components are defined in [visualizerFramework/visualizer.html](./visualizerFramework_html.md) and styled by the CSS in [visualizerFramework/visualizer.css](./visualizerFramework_css.md). They are inserted into the DOM by [VC.load()](./visualizerFramework_js.md#vc-load-) (defined in [visualizerFramework/visualizer.js](./visualizerFramework_js.md)), which is called by all of the visualizers during their initialization. For a specific example of how this is done, see the initial [load()](./visualizerExemplar.md#visualizer-framework-loading) routine from the [visualizerExemplar](./visualizerExemplar.md).

## Graphical layout
     
Visualizers all have the same basic graphical layout:

  ![layout](./visualizerLayout.png "Visualizer layout")

The elements may be identified in this diagram from their borders according to the following key:

  ![layout_key](./visualizerLayoutKey.png "Visualizer color key")

