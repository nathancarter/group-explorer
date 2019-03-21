
/*
 * This javascript post-processes a GE Help page after it appears,
 * replacing citation codes with links to the online resources they cite.
 *
 * CITE(...) - replaced by an expandable/collapsible list of citations
 * VGT-# - replaced by a citation of a chapter in Visual Group Theory
 * VGT-#.# - replaced by a citation of a section in Visual Group Theory
 * MM-#/MM-#.# - same but for M.Macauley's online lectures and videos
 * DE-#/DE-#.# - same but for D.Ernst's online IBL materials
 * TJ-#/TJ-#.# - same but for T.Judson's free online algebra textbook
 */

// constants needed for referring to items online
const VGTURL = 'http://web.bentley.edu/empl/c/ncarter/vgt/';
const VGTLINK = `<a href="${VGTURL}">Visual Group Theory</a>`;
const MMURL = 'http://www.math.clemson.edu/~macaule/classes/m18_math4120/index.html';
const MMLINK = `<a href="${MMURL}">Matthew Macauley's online lecture notes</a>`;
const DEURL = 'http://danaernst.com/teaching/mat411f16/materials/';
const DELINK = `<a href="${DEURL}">Dana Ernst's online IBL materials</a>`;
const TJURL = 'http://abstract.ups.edu/aata/';
const TJLINK = "Tom Judson's free, interactive, online textbook "
             + `<a href="${TJURL}">Abstract Algebra: Theory and Applications</a>`;

// utility function for distinguishing chapters from sections
const option = ( number, option1, option2 ) => {
    if ( !option1 ) option1 = 'Section';
    if ( !option2 ) option2 = 'Chapter';
    return /\./.test( number ) ? `${option1} ${number}` : `${option2} ${number}`;
}

// utility functions for creating expandable/collapsible sections
// in the document, giving each a unique ID, and being able to toggle visibility
var lastUsedID = 0;
const getNewID = () => `auto_gen_id_${++lastUsedID}`;
const toggle = ( id ) => {
    const brief = document.getElementById( `${id}_brief` );
    const verbose = document.getElementById( `${id}_verbose` );
    if ( brief.style.display == 'none' ) {
        brief.style.display = 'block';
        verbose.style.display = 'none';
    } else {
        brief.style.display = 'none';
        verbose.style.display = 'block';
    }
    return false;
};

// the list of replacements documented above,
// now formalized in computer code
const replacements = [
    {
        pattern : /CITE\((.+)\)/,
        replacement : ( text, match ) => {
            const id = getNewID();
            const toggle = `return toggle('${id}');`;
            return `<div id="${id}_brief">`
          + 'See also these external resources on this topic: '
          + `<a href="#" onclick="${toggle}">show...</a></div>\n`
          + `<div id="${id}_verbose" style="display: none;">`
          + 'See also these external resources on this topic: '
          + `<a href="#" onclick="${toggle}">hide</a>`
          + `<ul>${match[1]}</ul>`
          + '</div>';
        }
    },
    {
        pattern : /VGT-([0-9.])+/,
        replacement : ( text, match ) =>
            `<li>${option( match[1] )} of ${VGTLINK}</li>`
    },
    {
        pattern : /DE-([0-9.])+/,
        replacement : ( text, match ) =>
            `<li>${option( match[1] )} of ${DELINK}</li>`
    },
    {
        pattern : /MM-([0-9.])+/,
        replacement : ( text, match ) =>
            `<li>${option( match[1], 'Section', 'Lecture' )} of ${MMLINK}</li>`
    },
    {
        pattern : /TJ-([0-9.])+/,
        replacement : ( text, match ) =>
            `<li>${option( match[1] )} of ${TJLINK}</li>`
    }
];

// find the first replacement that needs to be done in a chunk of text
const getFirstMatch = ( text ) =>
    replacements.find( item =>
        item.lastMatch = item.pattern.exec( text ) );

// apply a replacement that's been found to be needed
const computeReplacement = ( text, using ) => {
    if ( typeof( using.replacement ) == 'string' ) {
        var copy = using.replacement;
        using.lastMatch.slice( 1 ).map( ( group, index ) =>
            copy = copy.replace( RegExp( '\\$'+(index+1), 'g' ), group ) );
        return copy;
    }
    if ( typeof( using.replacement ) == 'function' )
        return using.replacement( text, using.lastMatch );
    throw `Unusable replacement data: ${using.replacement}`;
};

// do all replacements in a given text node in the document
const replaceWithin = ( node ) => {
    if ( !node.textContent ) return;
    var useThis, text = node.textContent;
    while ( useThis = getFirstMatch( text ) )
        text = text.substring( 0, useThis.lastMatch.index )
             + computeReplacement( text, useThis )
             + text.substring( useThis.lastMatch.index
                             + useThis.lastMatch[0].length );
    if ( node.textContent == text ) {
        // console.log( 'skipping', node );
    } else {
        // console.log( 'changed', node.textContent, text );
        // node.textContent = text;
        const sandbox = document.createElement( 'div' );
        sandbox.innerHTML = text;
        Array.prototype.slice.apply( sandbox.childNodes ).map( child =>
            node.parentNode.insertBefore( child, node ) );
        node.parentNode.removeChild( node );
    }
};

// do all replacements recursviely down through a DOM element
const recur = ( node ) => {
    if ( node.childNodes.length == 0 )
        replaceWithin( node );
    else
        Array.prototype.slice.apply( node.childNodes ).map( recur );
};

// do all replacements in the body after the page loads
window.addEventListener( 'load', ( event ) => {
    recur( document.body );
} );
