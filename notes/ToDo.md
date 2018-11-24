
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## CayleyDiagram diagram panel

 * Implement Organize by option for generator pulldowns
 * Drag-and-drop to change generator order
 * Arrow left/right multiplication choice
 * Chunking
 * Hover help in big Cayley diagram
 * Drag-and-drop to re-shape curves in big Cayley diagram
 * Use dummy 'center' node to orient curved arrows (see Q_4, strategy [[1,2,2,0],[4,0,2,1]]; or A_4, [[1,1,2,0],[3,0,0,1]])
 * Keep labels from disappearing behind nodes with changing node/label sizes
 * Drag-and-drop to move nodes in big Cayley diagram
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
 * Update main page so that it loads progressively
