/* @flow
# MathML utilities

Nearly all mathematical text in GE is formatted with MathML and rendered into HTML by MathJax. The MathML class has utility functions for some simple formatting patterns, converting MathML to Unicode text, and caching MathJax output to improve performance.

* [Formatting utilities](#formatting-utilities)

* [Transformation routines](#transformation-routines)

* [Caching](#caching)

* [Initialization](#initialization)

* [Legacy functions](#legacy-functions)

```js
*/
/*::
import XMLGroup from './XMLGroup.js';

declare class XSLTProcessor {
   importStylesheet(Node): void;
   transformToFragment(Node, Document): DocumentFragment;
}

export default
 */
class MathML {
/*::
   static subscripts: {[key: string]: string};
   static superscripts: {[key: string]: string};
   static MATHML_2_HTML: string;
   static xsltProcessor: XSLTProcessor;
   static Cache: Map<string, string>;
 */
/*
```
  ## Formatting utilities
  <i>(note: examples are HTML approximations to actual MathJax output)</i>

* sans -- format a MathML string in sans-serif font
  <br>&nbsp;&nbsp;`MathML.sans('<mtext>Linear in </mtext><mi>rf</mi>')` => "Linear in <i>rf</i>"
  + All identifiers (&lt;mi&gt; elements) are italicized, including multi-character identifiers.

* sub -- format two character strings as an identifier with a subscript
  <br>&nbsp;&nbsp;`MathML.sans(MathML.sub('CC','3'))` => "<i>CC</i><sub>3</sub>"
  + Arguments are not treated as MathML strings.

* csList -- format a list of MathML strings as a comma-separated list
  <br>&nbsp;&nbsp;`MathML.csList(['<mi>x</mi>', '<mn>3</mn>'])` =>  "<i>x</i>, 3"
  + The resulting list elements are separate top-level MathML constructs, separated by normal HTML. This allows the browser to re-flow the text instead of having MathJax do it.
  + This routine is used internally by setList and genList.

* setList -- format a list of MathML strings as a comma-separated list surrounded by {, } braces
  <br>&nbsp;&nbsp;`MathML.setList(['<mi>r</mi>', '<mi>f</mi>'])` => "{ <i>r</i>, <i>f</i> }"

* genList -- format a list of MathML strings as a comma-separated list surrounded by ⟨, ⟩ brackets
  <br>&nbsp;&nbsp;`MathML.genList(['<mi>r</mi>', '<mi>f</mi>'])` => "⟨ <i>r</i>, <i>f</i> ⟩"
  + Brackets are in bold because the normal font renders them lighter than other characters.

* rowList -- format a list of MathML strings as rows (a &lt;br&gt;-separated list)

```js
*/
   static sans(mathml /*: string */) /*: string */ {
      return MathML.Cache.get(mathml)
          || '<math xmlns="http://www.w3.org/1998/Math/MathML" mathvariant="sans-serif">' +
             mathml.replace(/<mi>/g, '<mi mathvariant="sans-serif-italic">') +
             '</math>';
   }

   static sansText(plainText /*: string */) {
      return MathML.sans(MathML._2mtext(plainText));
   }

   static _2mtext(plainText /*: string */) {
      return '<mtext>' + plainText + '</mtext>';
   }
   static sub(identifier /*: string */, subscript /*: number | string */) /*: string */ {
      return '<msub><mi>' + identifier + '</mi><mn>' + subscript + '</mn></msub>';
   }

   static csList(elements /*: Array<string> */) /*: string */ {
      return elements
         .map( (el, inx) => MathML.sans(el) + (inx < elements.length-1 ? ',&nbsp;' : '') ).join('');
   }

   static ccsList(elements /*: Array<string> */) /*: string */ {
      return elements
         .map( (el, inx) => (el) + ((inx < elements.length-1) ? ',&nbsp;' : '') ).join('');
   }

   static setList(elements /*: Array<string> */) /*: string */ {
      return MathML.sans('<mtext>{</mtext>') +
             '&nbsp;' + MathML.csList(elements) + '&nbsp;' +
             MathML.sans('<mtext>}</mtext>');
   }

   static genList(generators /*: Array<string> */) /*: string */ {
      return MathML.sans('<mtext mathvariant="bold">&#x27E8;</mtext>') +
             '&nbsp;&nbsp;' + MathML.csList(generators) + '&nbsp;&nbsp;' +
             MathML.sans('<mtext mathvariant="bold">&#x27E9;</mtext>');
   }

   static rowList(elements /*: Array<string> */) /*: string */ {
      return elements.map( (el, inx) => MathML.sans(el) + '<br>').join('');
   }
/*
```
  ## Transformation routines

  These routines transform the subset of MathML used in GE .group XML files into HTML5 or Unicode text using XSLT. Only a small subset of MathML capability is used in these files, limited to subscripts and superscripts of signed numeric values.

* toHTML -- transform MathML into an HTML5 document fragment with &lt;sub&gt;...&lt;/sub&gt; and &lt;sup&gt;...&lt;/sup&gt; markup
  <br>&nbsp;&nbsp;`MathML.toHTML('<msub><mi>H</mi><mn>3</mn></msub>')` => `<i>H</i><sub>3</sub>` => "<i>H</i><sub>3</sub>"

* toUnicode -- transform MathML into Unicode text with numeric subscripts and superscripts
  <br>&nbsp;&nbsp;`MathML.toUnicode('<msub><mi>H</mi><mn>3</mn></msub>')` => "H₃"
  + Subscript and superscript characters are defined in `MathML.subscripts` and `MathML.superscripts`.

```js
*/
   static toHTML(mathml /*: mathml */) /*: DocumentFragment */ {
      return MathML.xsltProcessor.transformToFragment($.parseXML(mathml), document);
   }

   static toUnicode(mathml /*: mathml */) /*: string */ {
      const $html = $( MathML.toHTML(mathml) );

      $html.find('sub').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.subscripts[ch]).join('')) );
      $html.find('sup').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.superscripts[ch]).join('')));

      return $html.text();
   }
/*
```
  ## Caching

  The subgroup display that is part of many of the visualizers takes a noticeable amount of time to format with MathJax, particularly since it occurs at the same time as the main graphic is being generated and because it must complete before the browser is fully responsive. Since many formatted elements are used repeatedly, caching the results of the formatting operation can be used to improve performance. The approach below is particularly suited to the visualizers' subset display and the diagram control panels.

  The approach below has `MathML.sans` consult a cache of already formatted MathML elements and return the HTML generated by a previous MathJax run if a match is found. This HTML can be inserted into the DOM where a MathML expression would otherwise be put; it needs no further MathJax processing to be displayed in its final form. The cache is initially loaded with the HTML generated by formatting all the element representations, all the subgroup names (<i>H</i><sub>0</sub>, <i>H</i><sub>1</sub>, etc.), all the subgroup orders, and a few static strings commonly used in the indicated displays. These contents are sufficient to generate the subgroup display and show it immediately on construction. In the current implementation the cache is not modified after this initial load: most of the available performance improvements are realized by the choice of initial content, and this ensures that the cache doesn't grow without bound.

  Since repeated use of formatted elements does not occur on all pages, use of the cache is optional. Without it every MathML element inserted in the DOM must be transformed by MathJax into HTML that the browser can render; with it, some of that HTML will just be copied from the cache. In either case, however, the same formatting routines are used (`MathML.sans`, `MathML.sub`, etc.) and the same results are achieved. To enable the cache `MathML.preload` must be called to create and populate it. Since MathJax formatting is done asynchronously to the main javascript thread the cache is not immediately available on return from the call, so the method returns a Javascript `Promise`. The cache is available when the `then` clause executes. In the GE visualizer implementations this is done during the process of loading the page, after the group is loaded (the group is needed to load the cache), but before the subset display (which uses the cache) executes.

  The implementation follows: The cache is a `Map` from MathML strings to MathJax-generated HTML that the browser can render. The `preload` method places the MathML to be cached in a hidden &lt;div&gt; element, typesets it with MathJax, and on completion gathers the generated HTML into the cache and removes the hidden &lt;div&gt;. A few notes about the process:
* The hidden  &lt;div&gt; has id `mathml-cache-preload`.
* Each MathML expression is wrapped in a separate &lt;div&gt; within `mathml-cache-preload`.
* The cache keys, the unformatted MathML expressions, are saved in the key attribute of the wrapper &lt;div&gt;'s.
* The cache values, the HTML derived from the MathML expressions, are determined by removing all the `.MJX_Assistive_MathML` spans (which aren't used in GE) and then recovering the outerHTML of every top-level span having the `mjx-chtml` class.
* These elements can't simply be hidden with `display: none`. If the display is not rendered, MathJax won't size spaces like `<mspace width="0.3em"></mspace>` correctly, and permutation representations will be formatted as `(123)` instead of `(1 2 3)`. In the implementation `mathml-cache-preload` is hidden by placing it past the bottom of the screen.

```js
*/
   static preload(group /*: XMLGroup */) /*: Promise<void> */ {
      const mathmlStrings = new Set([
         // from subsetDisplay
         MathML._2mtext(')'),
         MathML._2mtext(','),
         MathML._2mtext('...'),
         MathML._2mtext('Clear all highlighting'),
         MathML._2mtext('Compute'),
         MathML._2mtext('Create'),
         MathML._2mtext('Customize the elements of'),
         MathML._2mtext('Delete partition'),
         MathML._2mtext('Delete'),
         MathML._2mtext('Edit list of elements in'),
         MathML._2mtext('Elements in'),
         MathML._2mtext('Elements not in'),
         MathML._2mtext('Highlight item by'),
         MathML._2mtext('Highlight partition by'),
         MathML._2mtext('Node color'),
         MathML._2mtext('Norm('),
         MathML._2mtext('Ring around node'),
         MathML._2mtext('Square around node'),
         MathML._2mtext('a union'),
         MathML._2mtext('all conjugacy classes'),
         MathML._2mtext('all left cosets'),
         MathML._2mtext('all order classes'),
         MathML._2mtext('all right cosets'),
         MathML._2mtext('an elementwise product'),
         MathML._2mtext('an intersection'),
         MathML._2mtext('by dragging elements into or out of it below.'),
         MathML._2mtext('by'),
         MathML._2mtext('elementwise product'),
         MathML._2mtext('intersection'),
         MathML._2mtext('is a conjugacy class of size'),
         MathML._2mtext('is a subgroup of order'),
         MathML._2mtext('is a subset of size'),
         MathML._2mtext('is an order class of size'),
         MathML._2mtext('is the group itself.'),
         MathML._2mtext('is the left coset of'),
         MathML._2mtext('is the right coset of'),
         MathML._2mtext('is the subset of size'),
         MathML._2mtext('is the trivial subgroup'),
         MathML._2mtext('of'),
         MathML._2mtext('the closure of'),
         MathML._2mtext('the normalizer of'),
         MathML._2mtext('the'),
         MathML._2mtext('union'),
         MathML._2mtext('with'),
         MathML._2mtext('{'),
         MathML._2mtext('}'),
         '<mtext mathvariant="bold">&#x27E8;</mtext>',  // left math bracket, similar to <
         '<mtext mathvariant="bold">&#x27E9;</mtext>',  // right math bracket, similart to >
         '<mtext mathvariant="bold">⟨</mtext>',         // left math bracket in unicode
         '<mtext mathvariant="bold">⟩</mtext>',         // right math bracket in unicode
         '<mi>g</mi>',

         // from diagramController
         MathML._2mtext('(no chunking)'),
         MathML._2mtext('a subgroup of order'),
         MathML._2mtext('generated by'),
         MathML._2mtext('Generate diagram'),
         MathML._2mtext('Organize by'),
         MathML._2mtext('The whole group'),
         '<mtext>Linear in&nbsp;</mtext><mi>x</mi>',
         '<mtext>Linear in&nbsp;</mtext><mi>y</mi>',
         '<mtext>Linear in&nbsp;</mtext><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>',
         MathML._2mtext('N/A'),
         MathML._2mtext('inside'),
         MathML._2mtext('outside'),
         MathML._2mtext('innermost'),
         MathML._2mtext('middle'),
         MathML._2mtext('outermost'),
         MathML._2mtext('innermost'),
         MathML._2mtext('second innermost'),
         MathML._2mtext('second outermost'),
         MathML._2mtext('outermost'),
         MathML._2mtext('innermost'),
         MathML._2mtext('second innermost'),
         MathML._2mtext('middle'),
         MathML._2mtext('second outermost'),
         MathML._2mtext('outermost'),

         // from Table controller
         MathML._2mtext('none'),
      ]);

      // cache diagram heading
      mathmlStrings.add(`<mtext>Cayley Diagram for&nbsp;</mtext>${group.name}`);
      mathmlStrings.add(`<mtext>Multiplication Table for&nbsp;</mtext>${group.name}`);
      mathmlStrings.add(`<mtext>Cycle Graph for&nbsp;</mtext>${group.name}`);

      // cache diagram names
      for (let inx = 0; inx < group.cayleyDiagrams.length; inx++) {
         mathmlStrings.add(`<mtext>${group.cayleyDiagrams[inx].name}</mtext>`);
      }

      // cache integers <= group order
      for (let inx = 0; inx <= group.order; inx++) {
         mathmlStrings.add(`<mn>${inx}</mn>`);
      }

      // cache subgroup names, subgroup orders
      for (let inx = 0; inx < group.subgroups.length; inx++) {
         mathmlStrings.add(MathML.sub('H', inx));
      }

      // cache current element representations
      for (let inx = 0; inx < group.representation.length; inx++) {
         mathmlStrings.add(group.representation[inx]);
      }

      // cache first two user-defined subset names
      mathmlStrings.add(MathML.sub('S', 0));
      mathmlStrings.add(MathML.sub('S', 1));

      // cache conjugacy class names
      mathmlStrings.add(MathML.sub('CC', 'i'));
      for (let inx = 0; inx < group.conjugacyClasses.length; inx++) {
         mathmlStrings.add(MathML.sub('CC', inx));
      }

      // cache order class names
      mathmlStrings.add(MathML.sub('OC', 'i'));
      for (let inx = 0, jnx = 0; inx < group.orderClasses.length; inx++) {
         if (group.orderClasses[inx].popcount() != 0) {
            mathmlStrings.add(MathML.sub('OC', jnx++));
         }
      }

      return MathML.cacheStrings(mathmlStrings);
   }

   static cacheStrings(mathmlStrings /*: Iterable<string> */) /*: Promise<void> */ {
      // dom fragment in which all MathML elements will be staged
      const $preload = $('<div id="mathml-cache-preload">');

      for (const mathml of mathmlStrings) {
         $preload.append($(`<div>${MathML.sans(mathml)}</div>`).attr('key', mathml));
      }

      // append fragment to document
      $preload.appendTo('html');

      const harvest = () => {
         // Harvest keys, values from spans generated by MathJax
         $('#mathml-cache-preload .MJX_Assistive_MathML').remove();
         $('#mathml-cache-preload > div').each( (_, div) => {
            const $span = $(div).find('> .mjx-chtml');
            MathML.Cache.set($(div).attr('key'), $span.attr('fromCache', 'true')[0].outerHTML);
         } );

         // remove the hidden div
         $('#mathml-cache-preload').remove();
      };

      // typeset the MathML in the mathml-cache-preload, then harvest the typeset results and fulfill the promise
      return new Promise/*:: <void> */(
         (resolve, _reject) => MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'mathml-cache-preload'], harvest, resolve)
      );
   }
/*
```
## Initialization
   The following items are created during initialization:
* `MathML.subscripts` and `MathML.superscripts` contain the Unicode characters for subscript and superscript numerals.
* `MathML.MATHML_2_HTML` contains XSLT code to transform the MathML subset used in GE into HTML.
* `MathML.xsltProcessor` is an XSLT processor for transforming MathML into HTML.
* `MathML.Cache` contains a fresh `Map` relating MathML strings => formatted DOM elements

```js
*/
   static _init() {
      // Unicode characters for numeric subscripts, superscripts
      MathML.subscripts =
         {'0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
          '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089' };
      MathML.superscripts =
         {'0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
          '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
          '-': '\u207B'};

      // Create XSLT to transform MathML subset into HTML
      MathML.MATHML_2_HTML =
         `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

<xsl:template match="math">
   <xsl:apply-templates/>
</xsl:template>

<xsl:template match="mfenced">
   <xsl:value-of select="@open"/>
   <xsl:for-each select="./*">
      <xsl:apply-templates select="."/>
      <xsl:if test="position() != last()">
         <xsl:choose>
            <xsl:when test="../@separators">
               <xsl:value-of select="../@separators"/>
            </xsl:when>
            <xsl:otherwise>
               <xsl:text>,</xsl:text>
            </xsl:otherwise>
         </xsl:choose>
      </xsl:if>
   </xsl:for-each>
   <xsl:value-of select="@close"/>
</xsl:template>

<xsl:template match="msup">
   <xsl:apply-templates select="*[1]"/>
   <sup><xsl:apply-templates select="*[2]"/></sup>
</xsl:template>

<xsl:template match="msub">
   <xsl:apply-templates select="*[1]"/>
   <sub><xsl:apply-templates select="*[2]"/></sub>
</xsl:template>

<xsl:template match="mi">
   <i><xsl:value-of select="."/></i>
</xsl:template>

<xsl:template match="mn">
   <xsl:value-of select="."/>
</xsl:template>

<xsl:template match="mo">
   <xsl:if test=". != ',' and . != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
   <xsl:value-of select="."/>
   <xsl:if test=". != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
</xsl:template>

<xsl:template match="mspace">
   <xsl:text> </xsl:text>
</xsl:template>

<xsl:template match="mtext">
   <xsl:value-of select="."/>
</xsl:template>

</xsl:stylesheet>
         `;
      MathML.xsltProcessor = new XSLTProcessor();
      MathML.xsltProcessor.importStylesheet($.parseXML(MathML.MATHML_2_HTML));

      // Create MathML.Cache
      MathML.Cache = new Map();
   }

}

MathML._init();
/*
```
## Legacy functions

These functions are deprecated in favor of their MathML equivalents. They are retained to aid migration.

* math2text -- transforms the MathML subset used in GE into Unicode text with numeric subscripts and superscripts.

```js
*/
   const mathml2text = MathML.toUnicode;
/*
```
 */
