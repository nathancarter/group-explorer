
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## CayleyDiagram diagram panel

 * Chunking
 * Hover help in big Cayley diagram
 * Drag-and-drop to re-shape curves in big Cayley diagram
 * Use dummy 'center' node to orient curved arrows (see Q_4, strategy [[1,2,2,0],[4,0,2,1]]; or A_4, [[1,1,2,0],[3,0,0,1]])
 * Keep labels from disappearing behind nodes with changing node/label sizes
 * Drag-and-drop to move nodes in big Cayley diagram (?)
 * Label representations (?)
 * Display raw element numbers (?)

## Local files

 * Group Explorer
    * add groups
 * Group Info page
    * user-defined naming scheme
    * notes
 * Preferences
 * Saved sheets

## Sheets

 * SubgroupInfo
 * SolvableInfo
 * Z_nm group
 * Ad hoc

# Nathan's List

 * Sheets
    * Copy and paste
       * Add a Copy button to the right sidebar.  It just places into a global clipboard variable the
         `toJSON()` of the selected `SheetElement`.
       * Add a Paste button to the right sidebar.  It just constructs a new `SheetElement` from the JSON
         data in the global clipboard variable, then moves it a little bit down and to the right
         (if possible).
       * Disable the paste button when the page loads.  Enable it when the copy button is clicked.
       * Give the CSS class "for-selected-element" to all buttons that can be used only when a
         `SheetElement` is selected.
       * When the selection changes, enable/disable all buttons with that class.
    * Z ordering
       * Add a `adjustZ(from,to)` method to `SheetModel` that adjusts the z values of sheet elements so
         that `from` takes on the value of `to` and everything in between (including `to`) gets bumped
         in the direction that `from` was formerly.
       * Add a `intersect(elt1,elt2)` method to `SheetModel` that says whether the two elements'
         rectangles intersect.
       * Add a `adjustZDown(elt)` method to `SheetModel` that finds the element with highest z index
         below that of `elt` and that intersects rectangles with `elt`, then calls `adjustZ(elt,that)`.
       * Add a `adjustZUp(elt)` method to `SheetModel` that finds the element with lowest z index
         above that of `elt` and that intersects rectangles with `elt`, then calls `adjustZ(elt,that)`.
       * Add a row of two buttons to the sidebar: Move forward/backward.  These just call `adjustZDown()`
         or `adjustZUp()`.
       * Add a row of two buttons to the sidebar: Move to front/back.  These just find the element with
         the max or min z index, then call `adjustZ(selected,maxOrMinElt)`.
    * Undo and redo
       * Add a field to `SheetModel` called `history`.  When the model is created, set `history` to be
         an array of one item, the initial value of `JSON.stringify(model.toJSON())`.
       * Extend `fromJSON()` to update `history` to contain just that one state and `historyIndex` to 0.
       * Add a method called `storeChange()` that computes `JSON.stringify(model.toJSON())` and pushes it
         to the history array if and only if it's different from the most recent item there.
       * Add a method called `historyIndex` that starts at 0 and is incremented by each `storeChange()`.
       * Ensure that `storeChange()` is called after every `saveEdits()` and after every move/resize of
         a `SheetElement`.
       * Extend `storeChange()` to begin by deleting all elements of `history` after `historyIndex`.
       * Add a method `undo()` to the model that calls `model.fromJSON(history[--historyIndex])` if and
         only if `historyIndex > 0`.
       * Add a method `redo()` to the model that calls `model.fromJSON(history[++historyIndex])` if and
         only if `historyIndex < history.length - 1`.
       * Add a row of two buttons to the sidebar: Undo/redo.  These just call their respective functions
         in the model, but both start out disabled.  Set them to be enabled/disabled, as appropriate,
         after any call to `undo()`, `redo()`, `storeChange()`, or `fromJSON()`.
       * Add a field to `SheetModel` called `maxHistorySize`, and pick some number, like 50.
       * Edit `storeChange()` so that if it created an array of more than `maxHistorySize`, it shifts
         the first element off of it.
    * Multiplication tables
       * Create a `MTElement` subclass of `SheetElement`.
       * Give it a field for which group it should display, and require this in the constructor.
       * Create a row of controls in the sidebar beneath "Add Rectangle": And "Add visualizer:" button
         followed by a pick-list of 3 visualizers (MT, CD, CG) followed by a pick-list of all groups.
         For now, the control does nothing if you pick CD/CG.  Just implement the MT action.
       * Extend `DisplayMulttable` with a `setSize()` method that sets the canvas size.  Call this
         internally in that class whenever you want to set the canvas size.
       * The `MTElement` class should create, at construction time, a `DisplayMulttable` instance
         and call its `setSize()`, then also create a `Multtable` instance for the given group.
       * Extend `DisplayMulttable`'s `getImage()` function with a parameter saying whether you want
         it small or large (default to small if argument not given).  If large, use `showLargeGraphic()`
         instead of `showSmallGraphic()`.
       * Fill the `viewDiv()` with a multiplication table IMG using code like this:
         `myImgElement = myDisplayMultTable.getImage( myMulttable, true );` and then put that IMG
         element in the `viewDiv()`.
       * Override the `SheetElement`'s `edit()` method to pop up an alert saying that the feature is
         not yet implemented.
       * Respond to `MTElement` resize events by calling that new `setSize()` method and then
         re-rendering to get the updated size.
     * Editing Multiplication tables
       * Extend `Multtable` with a function `toJSON()` that reports all of its editable features in a
         JSON object.  Create a corresponding `fromJSON()` that restores all those values, the reverse.
       * Extend `Multtable` with a function that calls `window.postMessage()` whenever any of its
         attributes changes, sending the most recent `toJSON()`.
       * Replace the `edit()` method in `MTElement` with one that opens the MT visualizer in a new tab.
       * Listen for messages posted by that tab and get their JSON content, using it to update your own
         `Multtable` instance by calling its `fromJSON()` on the data, and then re-rendering the element.
       * Update the `toJSON()` method of `MTElement` to use the `toJSON()` method of the internal
         `Multtable` as well.  Similarly, `MTElement`'s `fromJSON()` should call `Multtable`'s.
    * Cycle graphs
       * Copy the `MTElement` class to a `CGElement` class and modify it as follows.
       * Update the "Add visualizer" controls so that they will create instances of this new class.
       * Extend `DisplayCycleGraph` with a `setSize()` method that sets the canvas size.  Call this
         internally in that class whenever you want to set the canvas size.
       * The `CGElement` class should create, at construction time, a `DisplayCycleGraph` instance
         and call its `setSize()`, then also create a `CycleGraph` instance for the given group.
       * Extend `DisplayCycleGraph`'s `getImage()` function with a parameter saying whether you want
         it small or large (default to small if argument not given).  If large, use `showLargeGraphic()`
         instead of `showSmallGraphic()`.
       * Fill the `viewDiv()` with a cycle graph by updating the MT code to look like this:
         `myImgElement = myDisplayCycleGraph.getImage( myCycleGraph, true );`.
       * Extend `CycleGraph` with a function `toJSON()` that reports all of its editable features in a
         JSON object.  Create a corresponding `fromJSON()` that restores all those values, the reverse.
       * Extend `CycleGraph` with a function that calls `window.postMessage()` whenever any of its
         attributes changes, sending the most recent `toJSON()`.
       * Update the `edit()` method in `CGElement` to use CG visualizer.
       * Ensure the messages posted by that tab update the internal `CycleGraph`.
       * Ensure the `toJSON()` and `fromJSON()` methods of `CGElement` reference the `CycleGraph`.
    * Cayley diagrams
       * Copy the `MTElement` class to a `CDElement` class and modify it as follows.
       * Update the "Add visualizer" controls so that they will create instances of this new class.
       * Extend `DisplayDiagram` with a `setSize()` method that exposes the renderer size to clients.
         (Replace internal calls to `this.renderer.setSize()` with this new routine, for consistency.)
       * The `CDElement` class should create, at construction time, a `DisplayDiagram` instance
         and call its `setSize()`, then also create a `CayleyDiagram` instance for the given group.
         It should use `group.cayleyDiagrams[0].name` as the second parameter to the `CayleyDiagram`
         constructor, if such a name exists, or leave that parameter off if it doesn't.
       * Extend `DisplayDiagram`'s `getImage()` function with a parameter saying whether you want
         it small or large (default to small if argument not given).  If large, use the same levels of
         detail that you do in `showGraphic()`.
       * Fill the `viewDiv()` with a Cayley diagram by updating the MT code to look like this:
         `myImgElement = myDisplayDiagram.getImage( myCayleyDiagram, true );`.
       * Extend `CayleyDiagram` with a function `toJSON()` that reports all of its editable features in a
         JSON object.  Create a corresponding `fromJSON()` that restores all those values, the reverse.
         (Later we will need to see how to extend this to remember the camera position as well, but ignore
         that for now.)
       * Extend `CayleyDiagram` with a function that calls `window.postMessage()` whenever any of its
         attributes changes, sending the most recent `toJSON()`.
       * Update the `edit()` method in `CDElement` to use CD visualizer.
       * Ensure the messages posted by that tab update the internal `CayleyDiagram`.
       * Ensure the `toJSON()` and `fromJSON()` methods of `CDElement` reference the `CayleyDiagram`.
    * Connecting lines
       * Make `SheetElement` inherit from `EventEmitter`.
       * Whenever the element experiences move/resize/fromJSON, emit a `changeDimensions` event.
       * Whenever the element is deleted, emit a `delete` event.
       * Create a `ConnectingElement` subclass of `SheetElement` that takes two other elements as
         parameters to its constructor, a "from" and a "to" element.  (Factor out the process of setting
         these two key values into a `setEndpoints()` routine, which the constructor will call.)
       * Make its `toJSON()` function report the indices in the `SheetModel` of the two endpoints.  To
         ensure that this will work well with `fromJSON()`, extend the `toJSON()` of `SheetModel` to
         first sort the elements so that all `ConnectingElement`s are at the end, after their endpoints.
       * Make its `fromJSON()` function call `setEndpoints()` after looking up the appropriate objects
         by index in the `SheetModel`'s elements list.
       * Give it a `reposition()` method that sets its x,y,z,w,h to perfectly bridge the space between
         the from and to elements, having the z level of the higher of the two.  Call it at construction.
       * When either emits `changeDimensions`, call the connection's `reposition()`.
       * When either emits `delete`, call the connection's `remove()`.
       * By default, just make the connection's `viewDiv()` transparent with a diagonal line to show the
         connection.
       * Optional editable features: color, thickness, arrowhead yes/no.  Whichever you choose to
         implement, be sure to support in `toJSON()` and `fromJSON()`.
    * Morphisms
       * Make `MorphismElement` inherit from `ConnectingElement`.
       * I'll have to come back here later and finish the plan for this.
 * Rename Cycle Diagram HTML page to Cycle Graph instead
 * Add an object of symmetry for Z_1: something with no symmetry
 * Design how permalinks to GE resources should work and add a plan for
   implementation.  Goal: As many things as possible should be linkable
   directly so that students, instructors, etc. can just copy the URL as if
   it were Google maps and paste it into an email, and anyone can jump right
   to the visualization the first user was seeing.
 * Consider how to improve the default style of the three visualizations:
    * Remove colored background from all three?
    * Investigate drawing Cycle Graphs with SVGs; let the browser do the
      rendering optimizations and get free vector graphics as a result.
    * Investigate how to get Cayley Diagrams to look more like VGT and less
      like GE2.0.
    * Consider how to create an exporter for 3D Cayley Diagrams to SVGs,
      for users to download for use in contexts where they want vector graphics.
       * [Recall your 3D SVG library](https://github.com/nathancarter/svg3d)
    * Consider letting them also download PDF versions.  Note that PDFKit can
      do this if you have SVGs first; or you can skip SVGs and go stright to
      PDFs instead.  Either way, here are some useful links:
       * [Demo PDF made by PDFKit](https://github.com/foliojs/pdfkit/blob/master/demo/out.pdf)
         (See last page on which a tiger SVG is embedded.)
       * [The source code that created the tiger page](https://github.com/foliojs/pdfkit/blob/83f5f7243172a017adcf6a7faa5547c55982c57b/demo/test.js#L48)
       * [The tiger data in JSON-like format](https://raw.githubusercontent.com/foliojs/pdfkit/master/demo/tiger.js)

# Anyone's List (as yet unclaimed)

## Features

 * Get the following stuff into the heading on the main page:
    * Simple logo, w/version number
    * Contributors' names
    * Link to help files (or to help stub if they're not yet done)
    * [GitHub icon](https://github.com/logos) linking to this
      source code repository
 * Improve the Subgroups view so that instead of using HTML with MathJax
   inside, the entire "H_{index} = < element names >" portion is MathJax.

## Bug fixes

 * Table on main page does not show which column is sorted at first (until you click one).
 * Throughout the app, we use less than and greater than signs rather than the more appropriate
   LaTeX `\langle` and `\rangle`.
