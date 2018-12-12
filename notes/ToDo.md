
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## CayleyDiagram diagram panel

 * Drag-and-drop to change generator order
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

## Group Explorer load performance thoughts (measure/compare?)
 * Establish performance target
 * Load group files
     * Concatenate group files (download entire library at once)
     * Load group files in web workers, pass XMLGroup(s) back to main thread
 * Pre-calculate thumbnail png's as files
     * Just Cayley diagrams?
     * Concatenate png files and shred them on client?
     * Download to web workers, pass back as data to main thread?
 * Initially display MathML as HTML, then replace with MathJax output as it's rendered

# Nathan's List

 * Rename Cycle Diagram to Cycle Graph
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

 * Large groups won't render multiplication tables because they
   compute that they need a canvas larger than 2^14 on a side,
   which Chrome does not allow.  Also, big canvases slow Chrome
   down.  Perhaps cap it at 5000 and to fit big groups in,
   decrease the font size instead.  If it gets too small, omit
   element labels entirely.
     * Display labels that are no longer visible with hover help?
     * Zoom to make labels readable?
