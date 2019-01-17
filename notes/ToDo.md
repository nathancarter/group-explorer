
# To-dos for first release, Group Explorer v3.0

## To work on together, or whoever gets to it first

 * Visualizer pages also hide the "Help" and "Reset" buttons, just like Sheets do.
   But that's working on Ray's laptop, so figure out what's going on.
 * Make the mesh lines respect fog like the rest of the 3D diagram does.  (Ray will do
   the initial investigations on this one.)

## Assigned to Ray

### Miscellany

 * In GroupExplorer.html:
    * Each td containing a link should be active, with the correct hand cursor over the whole td.
    * Each such td should change its background on mouse enter, along with the cursor.
    * Use gray background for links to GroupInfo.html, colors for visualizers.
 * Subgroup info page for Tesseract group takes forever to load.  Initialize the page with
   "Loading ${N} subgroups..." so that as the long time passes, people understand to wait.
   Later this could be enhanced with a progress bar or percent-complete indicator, but it
   can start this simply.
 * The SolvableInfo.html page says it can't report whether the group is solvable, because
   it can't convert subgroups into their names from the library.  But it knows the subgroup
   chain, so it should be able to report it using just `H_*` names.
 * The Notes section of the GroupInfo.html page should be a text box that, whenever its
   contents change, writes them to `localStorage`, and reloads them from there on page load.
 * When using subset diagram, "Organize by" should reset the innermost/outermost/etc. column
   to the identity permutation.
 * Default naming scheme, when changed, should be written to `localStorage` and re-used
   throughout the app thereafter.
 * Setting line thickness to minimum does not work; it gets reset to a thicker value.
 * Fix test for circular/rotary layout in `CayleyDiagram.setStrategies`

### Fonts and math

 * Change sdp symbol from left to right join
 * Render multiple-character element names in same font as single-character names.
   (By default, MathJax renders single-character elements in italic, multiple-character
   in normal font, so you get odd-looking element names like `&#x27E8;<i>e</i>,fr&#x27E9;`
   in `D<sub>4</sub> x &Zopf;<sub>2</sub>`.)
 * Eliminate juxtapositions of dissimilar fonts in, e.g., visualizer titles (perhaps make
   entire title mathml?).
 * Some element names are shown in non-math font.  For example, fr and rf in S_3.
 * Improve the Subgroups view so that instead of using HTML with MathJax inside,
   the entire `H_{index} = < element names >` portion is MathJax.
 * Change `<select>` elements that use formatted math strings to use hand-rolled menus
   with mathml instead of text (similar to menus in Subgroups view)

### Help system

 * Complete the integration
 * On SubgroupInfo page, link to First Iso Theorem is broken.

### 3D diagrams and viewing angles

 * Offset default 3D viewing angle in CD and OS a bit from (1,1,1) so that opposite
   corners don't align, making too-symmetrical things that aren't obviously 3D.
   Ensure that this change also solves the problem for CayleyDiagram.html and
   SymmetryObject.html as well, not just the small images in the main table.  In
   fact, the default viewing angle isn't the same in both those cases, so that may
   need to be fixed as well.
 * Small visualizer for OS for A_4 shows at different angle than large visualizer.
   Also, neither angle is very good; adjust coords in group file to make it obvious
   that it's a tetrahedral pyramid?  Same for aligned tetrahedral CD for Q_4 --
   coordinates don't have the top of the pyramid facing the camera's UP vector (+/-y).
 * Don't `diagram3D.normalize()` for diagrams that were loaded from the group file.
   Just trust that their coordinates are correct.
 * The +y and -y axes are backwards from GE2, and so some pre-specified diagrams look
   different (and a few aren't good), e.g. V_4 Tetrahedron.
 * Eventually, we want to have a camera position be specifiable in the OS/CD diagram
   itself, so the diagram author can choose it.
 * Change fog color to match background color.
 * In an object of symmetry, disable the Shift+Drag feature that lets the user curve the lines.

## Assigned to Nathan

### Miscellany

 * Debug the ugliness of the Tesseract CG.
 * Many subgroup images on the subgroup info page do not load, and show the
   "broken image" icon.  Take code from GroupExplorer.html for creating the images
   rather than trying to load them from the library blob.

### Page-level issues

 * Replace `index.html` redirector with an actual landing page, one that follows
   the pattern of `groupexplorer.sourceforge.net`, and maybe uses the logo from
   `GroupExplorer/images/biglogo.png`.  On that same page, explain the idea that
   GE3.0 is GE2.0 on the web, with improvements to come in 3.1, 3.2, etc.
 * Get the following stuff into the heading on the main page:
    * Simple logo, w/version number
    * Link to landing page for the app (to be created)
    * Link to help files (or to help stub if they're not yet done)
    * [GitHub icon](https://github.com/logos) linking to this source code repository
 * Some subset of this could go on every page (visualizer, sheet, etc.).
   Logo, link to landing page, link to github, others?
 * Main page heading doesn't need contributors names; but put them in GitHub README.md.
 * Make the "settings" menu in the top right of the main page actually a three-lines
   menu that contains "New Sheet" and "Load Sheet > [submenu of all saved sheets]".
 * Change the default so that navigating into a group's Group Info page doesn't use a
   blob URL, but the group URL, so that users can share links to such pages the usual way.

### Sheets

 * Bug: Can't double-click to edit text (errors in console).
 * Bug: Can't OK to save changes to connection (errors in console).
 * Bug: Build a morphism A_4 -> A_4 and try to add a pair mapping (0 1)(2 3) to something.  Can't map to anything but ().  Bug.
 * Bug: Show full table of morphism values; they all map to () even if that's not correct.
 * Bug? Load My Sheet 3: moving one end of the connection doesn't move the connection.
 * Give right pane a big z-index so nothing is ever on top of it.
 * Make all sheets have a fixed size - say, 10000x7500.
 * For improving math content in sheets text:  Use Ray's global `mathml2text()` function
   that takes a MathML string as input and produces unicode text output that uses all the
   nice tricks to make it as good as possible.
 * Until you have custom code for exporting sheets, make the right hand pane hideable.
   Do this for all right hand panes consistently across the app.  This way the visualizer
   or sheet in question can be printed (or printed to a PDF) easily.
 * Extend the toJSON() and fromJSON() in CayleyDiagram.html to also respect:
    * all the rest of the Diagram panel needs to wait until I talk to Ray
    * background color:
      `Graphic_context.renderer.getClearColor().toArray()` and
      `new THREE.Color( that_array[0], that_array[1], that_array[2] )`
    * diagram name: global var in HTML page, `Diagram_name`, plus the
      drop-down selector with id `'#diagram-select'` (then `displayGraphic()`)
    * node positions: `Cayley_diagram.nodes[i].point.x` (y, z), then update diagram with `updateNodes()`
    * node radii: `Cayley_diagram.nodes[i].radius` then same (original) update routine
    * arc curvature: once I talk to Ray
    * chunking: once I talk to Ray
 * In ZmnInfo.html:
    * Create a function `showZnmIsomorphism(n,m)` that pops up a sheet with the following
      content and a suitable title.  (This works only if n and m are relatively prime.)
       * Left column: A Cayley Diagram of Z_n x Z_m with generators a of order n and b of order m,
         under which is text stating exactly that.
       * Center column: The same Cayley Diagram, now with arrows also added for the element ab,
         under which is text stating exactly that.
       * Right column: A Cayley Diagram of Z_{nm} with cyclic arrangement of nodes, under which is
         text stating that if you unroll the ab cycle from the previous diagram and drop the a and b
         arrows, this is what you get, which is obviously Z_{nm}.
    * Replace the "not implemented" text in the page with links to a sheet showing this content
      for each type of visualizer.
    * Create a function `showNoZnmIsomorphism(n,m)` that pops up a sheet with the following
      content and a suitable title.  (This works only if n and m are not relatively prime.)
       * Left and center columns the same as those produced by `showZnmIsomorphism(n,m)`.
       * Right column: A Cayley Diagram of Z_n x Z_m generated by <ab,b> with the axis for ab being
         cyclic in x,y and the axis for b being linear in z.  Show the ab arrow, do not show b.
         Look at it from diagonally above so that we can see multiple rings in perspective.
         The text below it says that untangling the ab arrows from the second column clearly shows
         that the result is not a single cycle of length nm.
    * Add links at the end of the page that offer to show this type of sheet using any type of
      visualizer.
 * Bug fix: Visualizers created programmatically (through `CreateNewSheet()`) don't propagate
   changes back from their editor version in the new tab.
 * Make it so that clicking on the sheet background unselects all sheet items.
 * Bug fix: It is possible to connect a connection to something else; disable this.

# In GAP's Group Explorer package

## Assigned to Nathan

 * Support accepting a name in the JSON options
 * If a name is not provided, use `IsomorphicGroups.find()` to try to find one
 * If you found one, make it a link to the group info page for that group

# To-dos related to tablet support

 * In general, check how everything works on a tablet, find those things that don't work,
   and then design how we want them to work, and make it happen.
 * Change subset control: don't pop up elements on double-click, but on hover...unless
   that's bad for tablets?

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
 * Use this new feature to stop passing blob data around, so that all pages have permalink
   URLs (with the query string using the database key).

# To-dos related to the main page

 * Remove the definition column?
    * Makes room for other things like number of subgroups, etc.
      (which could be direct links to subgroup info.,html, etc.)
    * Lets us move visualizations to the left, giving them central visual prominence
 * Consider striping the table rows by group order.
 * Add to the three-lines menu these settings:
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

# To-dos related to the Group Info page

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
 * Add a sharing button for naming conventions and notes that pops up a window with an
   email the user can copy&paste&send, containing instructions and a big JSON bolus at
   the end, of where in GE to paste the whole email's content to import the original
   user's notes/representations/etc. (all at once, not each note/representation
   separately).  Alternately, the original user can just post that JSON on their
   website/blog, then give you the URL to it, and you can paste the URL into GE, and
   import data that way (which GE will handle by an XHR to the blog/website).
 * Views section
    * Rather than have headings with "Help on this" links below them, just make the
      titles the help link in the first place.
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

 * Add column for elements, remove that data from the interstitial rows.  (For really
   large subgroups, use "more..." and "less..." links.)
 * Add column for whether it's a Sylow p-subgroup, remove that data from the interstitial
   rows.
 * Extend name column to say H_i \cong [shortname of group it's isomorphic to], remove
   that data from the interstitial rows.  In that same cell, include the links to
   embedding sheets as tersely as possible.
 * Rename "Normal" column to "Quotient" and have it be one of two things, then remove that
   data from the interstitial rows:
    * No quotient, subgroup not normal
    * `G / H_i \cong Q`, then links to see it shown as an SES via CD, CG, MT.
 * For big groups like the Tesseract, the SubgroupInfo.html page says it can't show the
   embedding of `H_{1522}`, because it's a group of order 32 not in the library.  But it
   should be able to just visualize it because it has the multiplication table, period.
 * Consider eventually making the SubgroupInfo.html page not its own page, but just one
   of the sections on the main GroupInfo.html page.  Some of them are big, but you choose
   whether to expand it or not anyway.

# To-dos related to sheets

 * Title DIV of the Sheet page should update itself with the name of the sheet when you
   save/load.
 * Eventually add export tools to sheets: to PNG, to PDF.
 * Make morphism arrows use filled arrowheads, not carets.
 * Color the arrows in morphisms with "useManyArrows" option enabled based on the color
   of their origin nodes.
 * Make it possible to click on a single arrow in a morphism showing many arrows, and
   highlight that arrow brightly to distinguish it if it's among a mess of others.

# To-dos not yet linked to a specific release or milestone

## Unassigned

 * GroupExplorer.html column headings should be link to help on that topic.
 * Change subgroup control so that it doesn't list subsets in sentences
   ("`H_0 = { e }` is the subset of order 1") but rather as a table (headings for
   "name", "elements", "order", and "normal?").  This will make it more succinct,
   easier to read, and will eliminate some of the line-breaking problems that exist now,
   especially if you put the elements list in the final column, and let people scroll
   left-to-right as well.
 * Include fog in small visualizers of 3D CDs, so that you can tell the back of the
   bucky ball from the front, fex.
 * How can we integrate into GE a way to ask, for any computation that's done, a way for
   the user to ask how you would do the same thing in GAP?
 * One day: Bootstrap or something for auto-reflow on small screens??  Not yet...too
   much work for little gain.
 * Visualizers:
    * Make group name a link to visit its group info page in a new tab
    * Make visualizer name a link that pops up a context menu with the two other
      visualizers as options, and if you choose one, reload the same page with that
      visualizer name in the URL in place of the old one (if the group doesn't have a URL,
      then pass the multiplication table in the URL as a blob URL).
 * One day make OSs full citizens of GE by making a Spins-like game out of them, but low
   pedagogical value, so long into the future.
 * It is possible to ask GE3 to generate diagrams in a way that nodes become too close
   together.  Do this for example:
    * Open a Cayley Diagram for A_5.
    * Make the first generator (0 1 2 3 4), linear in x, innermost.
    * Make the second generator (0 1)(2 3), rotary in x,y, outermost.

## Assigned to Ray

### General

 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

### CayleyDiagram diagram panel

 * Change label representations in visualizers?
 * Display raw element numbers for debugging?
 * Follow up approach in https://stackoverflow.com/questions/15558418/how-do-you-save-an-image-from-a-three-js-canvas for saving buffer
 * Add indication to Subgroups panel that subgroup is normal?

### Local files

 * Group Explorer
    * add groups
 * Group Info page
    * user-defined naming scheme
 * Preferences

## Assigned to Nathan

 * Find out whether Tom Leong might want to make us a nice set of CSS to make the whole
   app prettier.
 * Rename Cycle Diagram HTML page to Cycle Graph instead
 * Feature for sheets: Create embed HTML code, so that an instructor can paste a whole
   sheet into their blog/website.  Students visiting that page will be able to use the
   "save" button in the sheet iframe to keep a copy if they like.  The HTML code would be
   `<iframe>[load sheet.html]</iframe><script>(after iframe loaded, pass it the sheet JSON)</script>`.
 * Add an object of symmetry for Z_1: something with no symmetry
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
