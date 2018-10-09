
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## GroupInfo

 * Z_nm groups (e.g., Z_6, Z_8)

## CayleyDiagram Display frame

 * Auto-generation
    * keep lines from passing through nodes
    * generate better diagrams
 * Arrow choice
 * Chunking
 * Label options(?)

## Highlighting

 * ~~CayleyDiagram~~
 * ~~Multtable~~
 * (CycleGraph)

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
 * Implement the Cycle Graph visualizer
 * Update main page so that it loads progressively

