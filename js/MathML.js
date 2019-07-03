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

var group: XMLGroup;

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
      const mml = mathml.replace(/<mi>/g, '<mi mathvariant="sans-serif-italic">');
      return MathML.Cache.get(mml)
          || '<math xmlns="http://www.w3.org/1998/Math/MathML" mathvariant="sans-serif">' + mml + '</math>';
   }

   static sub(identifier /*: string */, subscript /*: number*/) /*: string */ {
      return '<msub><mi>' + identifier + '</mi><mn>' + subscript + '</mn></msub>';
   }

   static csList(elements /*: Array<string>*/) /*: string */ {
      return elements
         .map( (el, inx) => MathML.sans(el) + (inx < elements.length-1 ? ',&nbsp;' : '') ).join('');
   }

   static setList(elements /*: Array<string>*/) /*: string */ {
      return MathML.sans('<mtext>{&nbsp;</mtext>') +
             MathML.csList(elements) +
             MathML.sans('<mtext>&nbsp;}</mtext>');
   }

   static genList(generators /*: Array<string>*/) /*: string */ {
      return MathML.sans('<mtext mathvariant="bold">&#x27E8;&nbsp;&nbsp;</mtext>') +
             MathML.csList(generators) +
             MathML.sans('<mtext mathvariant="bold">&nbsp;&nbsp;&#x27E9;</mtext>');
   }

   static rowList(elements /*: Array<string>*/) /*: string */ {
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

  The approach below has `MathML.sans` consult a cache of already formatted MathML elements and return the HTML generated by a previous MathJax run if a match is found. This HTML can be inserted into the DOM where a MathML expression would otherwise be put, where it needs no further MathJax processing to be displayed in its final form. The cache is initially loaded with the HTML generated by formatting all the element representations, all the subgroup names (<i>H</i><sub>0</sub>, <i>H</i><sub>1</sub>, etc.), all the subgroup orders, and a few static strings commonly used in the indicated displays. These contents are sufficient to generate the entire subgroup display, and show it immediately on construction. In the current implementation the cache is not modified after this initial load: most of the available performance improvements are realized by the choice of initial content, and this ensures that the cache doesn't grow without bound.

  Since repeated use of formatted elements does not occur on all pages, use of the cache is optional. Without it every MathML element inserted in the DOM must be transformed by MathJax into HTML that the browser can render; with it, some of that HTML may simply be copied from the cache. In either case, however, the same formatting routines are used (`MathML.sans`, `MathML.sub`, etc.) and the same results are achieved. To enable the cache `MathML.preload` must be called to create and populate it. Since MathJax formatting is done asynchronously to the main javascript thread the cache is not immediately available on return from the call, so the method returns a Javascript `Promise`. The cache is available when the `then` clause executes. In the GE visualizer implementations this is done during the process of loading the page, after the group is loaded (the group is needed to load the cache), but before the subset display (which uses the cache) executes.

  The implementation follows: The cache is a `Map` from MathML to the MathJax-generated HTML that the browser renders. The `preload` method places all the MathML representations, strings, etc. in a hidden &lt;div&gt; element, typesets it with MathJax, and on completion gathers the generated HTML into the cache and removes the hidden &lt;div&gt;. A few notes about the process:
* The dummy &lt;div&gt; has id="mathml-cache-preload".
* The &lt;div&gt; can't simply be hidden with `display: none`: MathJax won't size spaces like `<mspace width="0.3em"></mspace>` correctly, rendering permutation representations as `(123)` instead of `(1 2 3)`. In the implementation it's simply written beyond the bottom of the screen.
* The cache keys are derived from the `data-mathml` attributes of all the top-level spans generated by MathJax in the hidden &lt;div&gt; as follows:
  + Remove &lt;math...&gt;...&lt;/math&gt; tags.
  + Translate the entity '&amp;#xA0;' to the more commonly used named entity '&amp;nbsp;'. (This means that '&amp;nbsp;' should be used in MathML expressions, not '&amp;#xA0' or equivalent!)
* The cache values are determined by removing all the `.MJX_Assistive_MathML` spans (which aren't used in GE) and then recovering the outerHTML of every top-level span with a `data-mathml` attribute.

```js
*/
   static preload() /*: Promise<void> */ {
      // dom fragment in which all MathML elements will be staged
      const $preload = $('<div id="mathml-cache-preload">');

      // cache all subgroup names, and find all subgroup orders
      const orderSet = new Set();
      for (let inx = 0; inx < group.subgroups.length; inx++) {
         $preload.append(MathML.sans(MathML.sub('H', inx)));
         orderSet.add(group.subgroups[inx].order);
      }

      // cache all subgroup orders as MathML numbers <mn>...</mn>
      orderSet.forEach( (el) => $preload.append(MathML.sans(`<mn>${el}</mn>`)) );

      // cache all element representations
      for (let inx = 0; inx < group.representations.length; inx++) {
         for (let jnx = 0; jnx < group.representations[inx].length; jnx++) {
            $preload.append(MathML.sans(group.representations[inx][jnx]));
         }
      }

      // static strings (in addition to previous data-dependent strings)
      const staticStrings = [
         // from subsetDisplay
         '<mtext>is a subgroup of order</mtext>',
         '<mtext>is the group itself.</mtext>',
         '<mtext>is the trivial subgroup</mtext>',
         '<mtext>{&nbsp;</mtext>',
         '<mtext>&nbsp;}</mtext>',
         '<mtext mathvariant="bold">&#x27E8;&nbsp;&nbsp;</mtext>',  // left math bracket, similar to <
         '<mtext mathvariant="bold">&nbsp;&nbsp;&#x27E9;</mtext>',  // right math bracket, similart to >

         // from diagramDisplay
         '<mtext>, a subgroup of order</mtext>',
      ];

      // cache static strings
      for (let inx = 0; inx < staticStrings.length; inx++) {
         $preload.append(MathML.sans(staticStrings[inx]));
      }

      // append fragment to document
      $preload.appendTo('html');

      const harvest = () => {
         // Harvest keys, values from spans generated by MathJax
         $('#mathml-cache-preload .MJX_Assistive_MathML').remove();
         $('#mathml-cache-preload > [data-mathml]').each( (_, span) => {
            const mathml = $(span).attr('data-mathml')
                  .replace(/<\/?math[^>]*>/g, '')     // remove <math...>, </math> tags
                  .replace(/&#xA0;/g, '&nbsp;');      // convert &#xA0; to query-appropriate &nbsp;
            // .replace(/[ ]*\/>/g, '></mspace>'); // change <mspace.../> to <mspace...></mspace>
            if (!MathML.Cache.has(mathml)) {
               MathML.Cache.set(mathml, $(span).attr('fromCache', 'true')[0].outerHTML);
            }
         } )

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
