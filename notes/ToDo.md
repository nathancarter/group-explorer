
# Ray's List

## General

 * GE help integration
 * Internal documentation
 * Rationalize coding style (add leading underscore to internal methods?)
 * Re-factor to hide internal implementations (e.g., js/DisplayXX classes)

## CayleyDiagram diagram panel

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

# Nathan's List

 * Sheets
    * In ClassEquationInfo.html:
       * Import allSheets.js.
       * Add a script function that pops up a sheet illustrating the class equation for
         the page's group, given a visualizer type as its parameter.  The sheet should
         contain the class equation ord1+ord2+...+ordN=|G|, a title, and a visualizer
         underneath each class equation highlighting that class (the final one with all
         conjugacy classes highlighted in different colors).
       * Replace the "not implemented" text at the end of the page with links to a sheet
         showing the class equation using each type of visualizer.
    * In SubgroupInfo.html:
       * Import allSheets.js.
       * Add a script function that pops up a sheet illustrating the subgroup lattice
         for the page's group, given a visualizer type as its parameter.  Come up with a
         simple but halfway-decent layout algorithm.  Note that the existing
         `SubgroupFinder` class already implements `getSubgroups()`, which also creates
         the whole inclusion relation as well.
       * Replace the first "not implemented" text in that page with links to a sheet
         showing the subgroup lattice using each type of visulizer.
    * In BasicGroup.js:
       * Extend the existing `getSubgroupAsGroup()` function to retain, in some inner
         private attribute, the mapping from old element indices to new element indices.
       * Extend the existing `getQuotientGroup()` function to retain, in some inner
         private attribute, the mapping from old element indices to coset indices.
         (This is already called `elementMap` in the code, and just needs to be stored.)
    * In IsomorphicGroups.js:
       * Create a function `findEmbedding(G,H)` (with H a subgroup of G) that does this:
          * Let H be `G.getSubgroupAsGroup()`.
          * Let H' be `IsomorphicGroups.find(H)`.
          * Let f be `IsomorphicGroups.isomorphism(H',H)`.
          * Let f' be f composed with the renaming stored in a private member of H,
            so that f' now embeds H' in G.
          * Return the pair [H',f'].
          * (If any of the above steps fail, return null.)
       * Create a function `findQuotient(G,N)` (with N a normal subgroup of G) that does this:
          * Let K be `G.getQuotientGroup(N)`.
          * Let K' be `IsomorphicGroups.find(K)`.
          * Let f be `IsomorphicGroups.isomorphism(K,K')`.
          * Let f' be f composed with the quotient map stored in a private member of K,
            so that f' now divides G by N to yield K'.
          * Return the pair [K',f'].
          * (If any of the above steps fail, return null.)
    * Back in SubgroupInfo.html:
       * Add a script function that pops up a sheet illustrating the embedding of any given
         subgroup of the page's group.  It should be a single row of two visualizers, one of the
         subgroup on the left and one of G on the right, with one embedding morphism between.
         Ensure that the morphism has "injective" showing.  Get both the subgroup and the embedding
         from the new `IsomorphicGroups.findEmbedding(G,H)`.  Highlight the subgroup in both
         visualizers (the whole left one, and part of the right one).
       * Replace the first remaining "not implemented" text in that page with links to a sheet
         showing this embedding visualization using any of the 3 main visualizer types.
       * Add a script function that pops up a sheet illustrating the short exact sequence for
         any normal subgroup of the page's group.  It should use `findEmbedding()` and `findQuotient()`
         to obtain groups N and Q plus morphisms e:N->G (inj) and q:G->Q (surj).  It creates a
         single row of 5 visualizers, Z_1 -> N -> G -> Q -> Z_1, with morphisms id,e,q,zero,
         and text below the middle three visualizers, saying: Im(id)=Ker(e), Im(e)=Ker(q),
         and Im(q)=Ker(z).
       * Replace the first remaining "not implemented" text in that page with links to a sheet
         showing this SES visualization using any of the 3 main visualizer types.
    * In SolvableInfo.html:
       * Write a function that computes the solvable decomposition, as a list of groups in that
         decomposition plus the corresponding abelian quotient groups and the quotient maps,
         plus the necessary embeddings.  Call it `getSolvableDecomposition(G)` and it does this:
          * If `!G.isSolvable`, return null.
          * If G is abelian, return this data structure:
```
[
    {
        group : Z_1 // always the leftmost in the chain
    },
    {
        group : G,
        embedding : [ 0 ], // from previous
        quotientGroup : G,
        quotientMap : [0,...,|G|-1]
    }
]
```
          * When G is not abelian:  For each normal subgroup N of G:
             * Let [N',e] be `IsomorphicGroups.findEmbedding(G,N)`.
               (If that fails, skip to the next loop iteration.)
             * Let [Q,q] be `IsomorphicGroups.findQuotient(G,N)`.
               (If that fails, skip to the next loop iteration.)
             * Let D be `getSolvableDecomposition(N')`.
               (If that fails, skip to the next loop iteration.)
             * Return D with one more element appended:
```
    {
        group : G,
        embedding : e,
        quotientGroup : Q,
        quotientMap : q
    }
```
          * If that loop terminates, then G is not solvable, so return null, but dump a warning
            to the console that this should have been detected earlier.
       * Write a function that pops up a sheet showing the solvable decomposition.  It contains
         these items, all of which are provided by `getSolvableDecomposition(G)`:
          * Title text
          * Descriptive text: "The top row is the solvable decomposition.  The bottom row are
            abelian quotient groups."
          * Top row of visualizers: Z_1 -> H_1 -> ... -> H_n -> G, with each arrow an embedding,
            e_1, ..., e_{n+1}.  (Use the actual names of the H_i from the group library.)
          * Names of the subgroups above those subgroups.
          * Quotient groups below every group except Z_1, Q_1,...,Q_{n+1}, with quotient maps
            q_1,...,q_{n+1} from H_1,...,H_n,G to the Q_1,...,Q_{n+1}.
          * Names of the quotient groups below their visualizers.
       * Replace the "not implemented" text in the page with links to a sheet showing the solvable
         decomposition for each type of visualizer.
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
 * Change the default so that navigating into a group's Group Info page doesn't use a
   blob URL, but the group URL, so that users can share links to such pages the usual way.

## Bug fixes
 * Setting line thickness to minimum does not work; it gets reset to a thicker value.
 * Render multiple-character element names in same font as single-character names. (By default, MathJax renders
   single-character elements in italic, multiple-character in normal font, so you get odd-looking element
   names like &#x27E8;<i>e</i>,fr&#x27E9; in D<sub>4</sub> x &Zopf;<sub>2</sub>.)
 * Eliminate juxtapositions of dissimilar fonts in, e.g., visualizer titles (perhaps make entire title mathml?)
 * Adjust radial scaling in, e.g., A_5 generated by `[(0 1 2 3 4),0,0,0][(0 1)(2 3),2,0,1]`
 * Fix test for circular/rotary layout in `CayleyDiagram.setStrategies`
