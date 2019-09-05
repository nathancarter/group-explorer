
# To-dos for first release, Group Explorer v3.0

## Assigned to Ray

### To-dos related to tablet support

Complete: Tablet support is comparable to desktop with no known feature gaps. Interface
documentation is complete.

Graphics performance on my iPad Pro is generally comparable to my desktop (6-core i5 cpu,
entry level gaming accelerator). After the library is stored locally visualizer loads take
1-2 sec; menu response (subgroup option menu) takes 20-50 ms, 100 ms worst case;
and drag-and-drop (node placement in Cayley diagram) maintains 20-30 fps, 10-15 worst case.

### Bugs

 * On iPad, in Cayley diagram visualizer -> Diagram panel -> Generator menus, if a scrolling
   submenu tries to open a scrolling submenu, the second submenu doesn't appear at all.
   (no known workaround simpler than manual re-coding of menu behavior).

 * When you add a new subset in subset control, Group Explorer does not check whether it
   exists under another name or give you the option to cancel your addition, as GE2 does.

 * Dropdown lists in Sheets are not formatted with MathJax

### Miscellany

 * Make test to simulate loading GE from GAP using 'waitForMessage'

### 3D diagrams and viewing angles

 * Eventually, we want to have a camera position be specifiable in the OS/CD diagram
   itself, so the diagram author can choose it.

## Assigned to Nathan

## GAP's Group Explorer package

 * If a name is not provided, use `IsomorphicGroups.find()` to try to find one
 * If you found one, make it a link to the group info page for that group

---

Items below here are roughly prioritized in the order we will consider doing them,
but that order is not set in stone.

---

# To-dos related to library implementation

 * Write a CLI script that extracts metadata for all groups and puts it into a single big
   JSON object, and make a `LibraryMetadata.js` file in which we assign that JSON object
   to `Library.metadata`.  As long as you're doing that, it might be time to convert all
   those files into JSON anyway; don't even bother making a script for that.  Just do it
   in the browser using `XMLGroup.fromJSON()` and write yourself a `XMLGroup.toJSON()`
   function, then use the console to do that across the whole library, show the results,
   and paste them into a big file.  Read it with `node.js` and spit out one `.json` file
   for each group.
 * Add to each group file a "GAPKey" datum, saying what the group's name is in the GAP
   small groups library, and use that as our database key.
 * In the build process, import `LibraryMetadata.js` after `Library.js` in every situation
   where you import `Library.js`.
 * Clients can query the library (synchronously) for metadata just with `Library.metadata`.
 * Replace `Library.loadAllGroups()` with `Library.load()`, and the default is to use
   `Library.metadata`, but you can filter it if you like and pass a subset.
 * Consider then expanding each group file to include pre-computed things like sets of
   subgroups.

# To-dos related to the Group Info page

[The section after this one](#to-dos-related-to-the-subgroup-info-page) is very related,
and may benefit from being done in concert.

 * Basic facts table should be headings and text under them, rather than a table
 * Computed Properties table:
    * The third column isn't always necessary; for Abelian and Cyclic it should just put
      the evidence right in the table, with no "Tell me more" link.
    * Many that use a "tell me more" page now could have their info precomputed but hidden,
      because it's not very much info, actually.  Just expand/collapse with "more" and
      "less" links.
    * For the ones that need a tell me more page, just use the blog-like UI paradigm
      "more..." as a link at the end of the second column's content.
 * Remove "Related Sheets" and "File Data"
    * File Data's URL will go away when the library becomes one big JSON structure.
    * Author could be moved to the page subtitle or to the Basic Facts section.
 * Views section: Rather than have headings with "Help on this" links below them, just
   make the titles the help link in the first place.
 * Later, once all GE2 functionality is working well, consider this next:
    * Two-column layout
    * Left column is vertical list of all visualizers (1/3 or 1/4 width of screen)
    * Right column is all rest of page, each section as a header with a brief summary
      sentence and a disclosure triangle showing the rest, so that the page content and
      its ToC merge into one, and you can delete the ToC from the top.  At the same time,
      flatten the Computed Properties section out into main headings.
    * If you do that, sort them so that column 2 has mathy stuff on top and data-related
      stuff further down

# To-dos related to the subgroup info page

 * Consider eventually making the SubgroupInfo.html page not its own page, but just one
   of the sections on the main GroupInfo.html page.  Some of them are big, but you choose
   whether to expand it or not anyway.  This may impact the following changes, so decide
   whether you want to do it first or not.
 * Add column for elements, remove that data from the text rows.  (For really
   large subgroups, use "more..." and "less..." links.)
 * Add column for whether it's a Sylow p-subgroup, remove that data from the text
   rows.
 * Extend name column to say `H_i \cong [shortname of group it's isomorphic to]`, remove
   that data from the interstitial rows.  In that same cell, include the links to
   embedding sheets as tersely as possible.
 * Rename "Normal" column to "Quotient" and have it be one of two things, then remove that
   data from the interstitial rows:
    * No quotient, subgroup not normal
    * `G / H_i \cong Q`, then links to see it shown as an SES via CD, CG, MT.
 * For big groups like the Tesseract, the SubgroupInfo.html page says it can't show the
   embedding of `H_{1522}`, because it's a group of order 32 not in the library.  But it
   should be able to just visualize it because it has the multiplication table, period.

# To-dos related to the main page

Note that these ideas are contingent upon what feedback we receive from first users.

 * Remove the definition column?
    * Makes room for other things like number of subgroups, etc.
      (which could be direct links to subgroup info.,html, etc.)
    * Lets us move visualizations to the left, giving them central visual prominence
 * Consider striping the table rows by group order.
 * Add a settings menu to the main page (top right, a gear icon) with these settings:
    * size of visualizers, as a range slider
    * filter for group families (Add "family" column to group page, plus "description",
      and anything from group info window that has a one-word answer (solvable, etc.))
    * which columns to show
 * Load all FGB groups also?
    * If not showing group definitions, the latexing of that will not need to be done,
      and you could reasonably get more groups loaded in a reasonable time
    * Right now, the generation of visualizations is not asynchronous, but should be,
      with a "loading..." for each while they're loading
    * Consider loading just the first 20 rows of the table, and you have to click "More"
      at the bottom to load the next 20?  (In fact, showing the 168 and 384 groups is a
      bit ugly and resource-intensive, and should probably be disabled by default.)

# To-dos related to sheets

 * Title DIV of the Sheet page should update itself with the name of the sheet when you
   save/load.
 * Eventually add export tools to sheets: to PNG, to PDF.
 * Make morphism arrows use filled arrowheads, not carets.
 * Color the arrows in morphisms with "useManyArrows" option enabled based on the color
   of their origin nodes.
 * Make it possible to click on a single arrow in a morphism showing many arrows, and
   highlight that arrow brightly to distinguish it if it's among a mess of others.
 * In GE2.0, the subset pane's context menu had a Morphisms submenu that would let you
   push subsets through morphisms to find their image, or pull them back to find their
   pre-image.  We have not yet added that to GE3.0.
 * In GE2.0, it was possible to toggle a multiplication table between using its left
   column and using its top row as the source points for morphism arrows.  Add that
   feature to GE3.0 as well.
 * Extend the toJSON() and fromJSON() in DisplayDiagram.js to also respect:
    * background color:
      `Graphic_context.renderer.getClearColor().toArray()` and
      `new THREE.Color( that_array[0], that_array[1], that_array[2] )`

# To-dos not yet linked to a specific release or milestone

## Unassigned

 * Subgroup info page for Tesseract group takes forever to load.  Initialize the page with
   "Loading ${N} subgroups..." so that as the long time passes, people understand to wait.
   Later this could be enhanced with a progress bar or percent-complete indicator, but it
   can start this simply.
 * The SolvableInfo.html page says it can't report whether the group is solvable, because
   it can't convert subgroups into their names from the library.  But it knows the subgroup
   chain, so it should be able to report it using just `H_*` names.  (This "bug" will not
   manifest until you include in the release groups of order >40, because all groups of
   order 20 or less are present.  So this is low-priority.)
 * Change subgroup control so that it doesn't list subsets in sentences
   ("`H_0 = { e }` is the subset of order 1") but rather as a table (headings for
   "name", "elements", "order", and "normal?").  This will make it more succinct,
   easier to read, and will eliminate some of the line-breaking problems that exist now,
   especially if you put the elements list in the final column, and let people scroll
   left-to-right as well.
 * Include fog in small visualizers of 3D CDs, so that you can tell the back of the
   bucky ball from the front, fex.
 * Visualizers:
    * Make group name a link to visit its group info page in a new tab
    * Make visualizer name a link that pops up a context menu with the two other
      visualizers as options, and if you choose one, reload the same page with that
      visualizer name in the URL in place of the old one (if the group doesn't have a URL,
      then pass the multiplication table in the URL as a blob URL).
 * Design question, to talk with users about: Do people want to be able to add groups?
   Perhaps the way to do this is, when someone is using the GE package for GAP, and they
   visualize a group that yields `IsomorphicGroups.find(G)==null`, there is a "Save to
   group library" button on the visualizer that lets them do so; it goes in `localStorage`.
 * One day replace all MathML in the app with LaTeX instead, which should improve overall
   results because MathJax doesn't seem to be as good at processing MathML as it is at
   processing LaTeX, and Ray has had to write some code to tweak/prod the MathJax input
   or output in order to get it to make nice results from our MathML input.  LaTeX will
   also be easier to read for programmers and much less verbose.
 * The group Z3 semidirect product Z4 in the library is correctly named (including with
   the factors in the correct order) but its naming scheme is poorly chosen, because the
   generator of the normal 3-element subgroup is b^2 (or alternatively ab^2), which is
   neither of the named generators (a and b).  Create a naming scheme that makes the two
   factors Z3 and Z4 clear.
 * The group Z4 semidirect product Z5 in the library is correctly named, except that the
   operator is backwards from what it is in the other semidirect product groups.  Change
   the operator to its mirror inverse horizontally and swap the order of the factors, so
   that the meaning stays the same, but the notation becomes consistent.

## Assigned to Ray

### General

 * It is possible to ask GE3 to generate diagrams in a way that nodes become too close
   together.  Do this for example:
    * Open a Cayley Diagram for A_5.
    * Make the first generator (0 1 2 3 4), linear in x, innermost.
    * Make the second generator (0 1)(2 3), rotary in x,y, outermost.
 * Remove colored background from all three visualizers.

### CayleyDiagram diagram panel

 * Display raw element numbers for debugging?
 * Investigate how to get Cayley Diagrams to look more like VGT and less
   like GE2.0.

## Assigned to Nathan

 * Add a sharing button for naming conventions and notes that pops up a window with an
   email the user can copy&paste&send, containing instructions and a big JSON bolus at
   the end, of where in GE to paste the whole email's content to import the original
   user's notes/representations/etc. (all at once, not each note/representation
   separately).  Alternately, the original user can just post that JSON on their
   website/blog, then give you the URL to it, and you can paste the URL into GE, and
   import data that way (which GE will handle by an XHR to the blog/website).
 * One day make OSs full citizens of GE by making a Spins-like game out of them, but low
   pedagogical value, so long into the future.
 * Find out whether Tom Leong might want to make us a nice set of CSS to make the whole
   app prettier.
 * Rename Cycle Diagram HTML page to Cycle Graph instead
 * Feature for sheets: Create embed HTML code, so that an instructor can paste a whole
   sheet into their blog/website.  Students visiting that page will be able to use the
   "save" button in the sheet iframe to keep a copy if they like.  The HTML code would be
   `<iframe>[load sheet.html]</iframe><script>(after iframe loaded, pass it the sheet JSON)</script>`.
 * Add an object of symmetry for Z_1: something with no symmetry
 * Consider how to improve the default style of the three visualizations:
    * Investigate drawing Cycle Graphs with SVGs; let the browser do the
      rendering optimizations and get free vector graphics as a result.
      Is this doomed when the CG is really large?  E.g., for Tesseract, could it fail
      because SVGs can't handle that many little line segments?
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
