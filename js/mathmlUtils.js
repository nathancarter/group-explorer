
// MathML Utilities

// Enclose MathML fragment from, e.g., .group file, in <math>..</math> tags
function math(fragment) {
   return (fragment === undefined) ? ''
	: '<math xmlns="http://www.w3.org/1998/Math/MathML">' + fragment + '</math>';
}


// Routines for manipulating subset of MathML used in .group files
// Subset has only signed numeric subscripts and superscripts

// Transform MathML subset into HTML with <sub>...</sub> and <sup>...</sup> markup
function mathml2html(mathml) {
   if (xsltProcessor === undefined) {
      xsltProcessor = new XSLTProcessor();
      xsltProcessor.importStylesheet($.parseXML(MATHML_2_HTML));
   }
   return xsltProcessor.transformToFragment($($.parseXML(mathml))[0], document);
}


// Unicode characters for numeric subscripts, superscripts
var subscripts =
   {0: '\u2080', 1: '\u2081', 2: '\u2082', 3: '\u2083', 4: '\u2084',
    5: '\u2085', 6: '\u2086', 7: '\u2087', 8: '\u2088', 9: '\u2089' };
var superscripts =
   {0: '\u2071', 1: '\u00B9', 2: '\u00B2', 3: '\u00B3', 4: '\u2074',
    5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079',
    '-': '\u207B'};

// Transform MathML subset into Unicode text with numeric subscripts and superscripts
function mathml2text(mathml) {
   let $html = $( mathml2html(mathml) );

   return html2text($html);
}

function html2text($html) {
   $html.find('sub').each( (_,el) =>
      $(el).text(
         $(el).text().split('').map(ch => subscripts[ch]).join(''))
   );
   $html.find('sup').each( (_,el) =>
      $(el).text(
         $(el).text().split('').map(ch => superscripts[ch]).join(''))
   );

   return $html.text();
}

// XSLT code to transform MathML subset into HTML
var xsltProcessor;

const MATHML_2_HTML =
   `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

<xsl:template match="math">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="mfenced">
  <xsl:value-of select="@open"/><xsl:text> </xsl:text>
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
      <xsl:text> </xsl:text>
    </xsl:if>
  </xsl:for-each>
  <xsl:text> </xsl:text><xsl:value-of select="@close"/>
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
