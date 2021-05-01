/* @flow
# MathML utilities

Most of the group names and element representations are defined in the .group files as MathML and transformed into HTML by routines in this class.

A legacy routine no longer used in the body of GE3, `mathml2text` is maintained for use in [ge-lib-endmatter.js](./ge-lib-endmatter.js).
```js
*/
export { toHTML, htmlToUnicode }
export { mathml2text } // used in ge-lib-endmatter.js

// Unicode characters for numeric subscripts, superscripts
const Subscripts /*: {[key: string]: string} */ = {
  '0': '\u2080',
  '1': '\u2081',
  '2': '\u2082',
  '3': '\u2083',
  '4': '\u2084',
  '5': '\u2085',
  '6': '\u2086',
  '7': '\u2087',
  '8': '\u2088',
  '9': '\u2089'
}

const Superscripts /*: {[key: string]: string } */ = {
  '0': '\u2070',
  '1': '\u00B9',
  '2': '\u00B2',
  '3': '\u00B3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
  '-': '\u207B'
}

let xsltProcessor /*: ?XSLTProcessor */ = null

// XSLT to transform MathML subset into HTML
const MATHML_2_HTML =
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
               <xsl:text> </xsl:text><xsl:value-of select="../@separators"/><xsl:text> </xsl:text>
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
   <sub><xsl:apply-templates select="*[2]" mode="processingSubscript"/></sub>
</xsl:template>

<!-- Don't italicize ℤ in GE3 -->
<xsl:template match="mi">
   <xsl:choose>
      <xsl:when test=". = 'ℤ'">
         <xsl:text>ℤ</xsl:text>
      </xsl:when>
      <xsl:otherwise>
         <i><xsl:value-of select="."/></i>
      </xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template match="mn">
   <xsl:value-of select="."/>
</xsl:template>

<!-- No space after comma in a subscript, thus: G₄,₄ -->
<xsl:template match="mo" mode="processingSubscript">
   <xsl:if test=". != ',' and . != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
   <xsl:value-of select="."/>
   <xsl:if test=". != ',' and . != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
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
`
/*
```
  ## Exported routines

  These routines transform the subset of MathML used in GE .group XML files into HTML5 or Unicode text using XSLT. Only a small subset of MathML capability is used in these files, limited to subscripts and superscripts of signed numeric values.

* toHTML -- transform MathML into an HTML5 string with &lt;sub&gt;...&lt;/sub&gt; and &lt;sup&gt;...&lt;/sup&gt; elements
  <br>&nbsp;&nbsp;`MathML.toHTML('<msub><mi>H</mi><mn>3</mn></msub>')` => `<i>H</i><sub>3</sub>` => "<i>H</i><sub>3</sub>"

* htmlToUnicode -- transform HTML with subscripts and superscripts into Unicode text
  <br>&nbsp;&nbsp;`MathML.htmlToUnicode('<i>H</i><sub>3</sub>')` => "<i>H</i>₃"

* mathml2text -- legacy routine that transforms MathML into Unicode text with numeric subscripts and superscripts
  <br>&nbsp;&nbsp;`MathML.mathml2text('<msub><mi>H</mi><mn>3</mn></msub>')` => "<i>H</i>₃"
  + Numberic subscript and superscript characters are defined in module constants `Subscripts` and `Superscripts`.

```js
*/
function toHTML (mathml /*: mathml */) /*: html */ {
  if (xsltProcessor == null) {
      xsltProcessor = new XSLTProcessor()
      xsltProcessor.importStylesheet($.parseXML(MATHML_2_HTML))
  }

  const frag = xsltProcessor.transformToFragment($.parseXML(mathml), document)
  const result = $('<div>').html(frag).html()
  return result
}

function htmlToUnicode (html /*: html */) /*: string */ {
  const $html = $('<div>').html(html)

  $html.find('sub').each( (_,el) => $(el).text($(el).text().split('').map(ch => Subscripts[ch]).join('')) );
  $html.find('sup').each( (_,el) => $(el).text($(el).text().split('').map(ch => Superscripts[ch]).join('')));

  const result = $html.text();

  return result;
}

function mathml2text (mathml /*: mathml */) /*: string */ {
  return htmlToUnicode(toHTML(mathml))
}
/*
```
 */
