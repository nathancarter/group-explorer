
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## CayleyDiagram diagram panel

 * Hover help in big Cayley diagram (including chunking)
 * Keep labels from disappearing behind nodes with changing node/label sizes
 * Change label representations in visualizers?
 * Display raw element numbers for debugging?
 * Follow up approach in https://stackoverflow.com/questions/15558418/how-do-you-save-an-image-from-a-three-js-canvas for saving buffer
 * Add indication to Subgroups panel that subgroup is normal?

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
    * Refactoring to fix bugs with synchronizing sheets and visualizer editors
       * Move the toJSON/fromJSON functions from Multtable.js to DisplayMulttable.js,
         from CycleGraph.js to DisplayCycleGraph.js, and from CayleyDiagram.js to DisplayDiagram.js.
       * In SheetModel.js, replace each call to this.vizobj.to/fromJSON() with a call to
         this.vizdisplay.to/fromJSON() instead.
       * Ensure these changes work.
       * Move the addEventListener() and postMessage() calls from Multtable.js to Multtable.html,
         now using the toJSON() and fromJSON() implemented in the graphicContext instead of the
         multtable.
       * Expand the fromJSON() handler so that it also updates the UI controls in the Subset/Table
         sidebars.
       * Ensure these changes work.
       * Move emitStateChange() from Multtable.js to Multtable.html, and call it whenever that page
         makes an alteration in the multtable object.
       * Create analogous addEventListener() and postMessage() calls in CycleDiagram.html, modeled
         after the ones in Multtable.html.
       * Also move emitStateChange from CycleGraph.js to CycleGraph.html the same way.
       * Create analogous addEventListener() and postMessage() calls in CayleyDiagram.html, modeled
         after the ones in Multtable.html.
       * Also move emitStateChange from CayleyDiagram.js to CayleyDiagram.html the same way.  This
         should make it so that you can remove all such calls from cayleyViewController/view.js.
       * Extend the toJSON() and fromJSON() in CayleyDiagram.html to also respect the camera position.
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
 * Change &lt;select&gt; elements that use formatted math strings to use hand-rolled menus
   with mathml instead of text (similar to menus in Subgroups view)

## Bug fixes
 * Render multiple-character element names in same font as single-character names. (By default, MathJax renders
   single-character elements in italic, multiple-character in normal font, so you get odd-looking element
   names like &#x27E8;<i>e</i>,fr&#x27E9; in D<sub>4</sub> x &Zopf;<sub>2</sub>.)
 * Eliminate juxtapositions of dissimilar fonts in, e.g., visualizer titles (perhaps make entire title mathml?)
 * Adjust radial scaling in, e.g., A_5 generated by `[(0 1 2 3 4),0,0,0][(0 1)(2 3),2,0,1]`
 * Fix test for circular/rotary layout in `CayleyDiagram.setStrategies`
