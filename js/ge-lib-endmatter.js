
/*
 * This file gets compiled into ge-lib.js.
 * It is not intended for use on its own.
 */

const globalVarsToExport = [
    // first import all the important classes in the GE global namespace:
    'Version',
    'BitSet',
    'MathUtils',
    'BasicGroup',
    'XMLGroup',
    'Subgroup',
    'SubgroupFinder',
    'IsomorphicGroups',
    'Library',
    'MathML',
    'Diagram3D',
    'Multtable',
    'CycleGraph',
    'CayleyDiagram',
    'SymmetryObject',
    // and some useful global functions as well:
    'mathml2text',
    // and then some things that may be useless outside the browser,
    // but I'm importing them for the sake of completeness; they are
    // global classes in the GE namespace, after all, so:
    'DisplayDiagram',
    'DisplayMulttable',
    'DisplayCycleGraph',
    'Template',
    'Menu',
    'DiagramDnD'
];
globalVarsToExport.map( name => module.exports[name] = eval( name ) );
// then expose to the client the list of URLs in our group library
module.exports.allGroupURLs = urls;
// then add to the Library class some methods that are specific to
// running GE from within node.js, which load one or all groups
// from the local filesystem synchronously.
// (later we can make these asynchronous if desired.)
Library.loadFromFilesystem = url => {
    const group = Library._dataToGroup(
        String( require( 'fs' ).readFileSync( url ) ), 'xml' );
    group.URL = url;
    Library.saveGroup( group,
        require( 'path' ).basename( url ).replace( '.group', '' ) );
    return group;
};
Library.loadByName = name =>
    Library.loadFromFilesystem( `${__dirname}/../groups/${name}.group` );
Library.getByName = name => Library.map.get( name );
Library.loadAllFromFilesystem = () => {
    const before = ( new Date() ).getTime();
    urls.map( url => Library.loadFromFilesystem( url ) );
    const elapsed = ( new Date() ).getTime() - before;
    console.log( `Loaded all groups in ${elapsed/1000}sec.` );
};
Library.allGroupNamesInFilesystem = () =>
    urls.map( url => /\/(.*)\.group$/.exec( url )[1] );

// mathml2text can't function in Node.js at the moment,
// so we create the following simple alternative
module.exports.mathml2text = ( mathml ) => {
    var match, stack = [ ];
    const attrDict = ( tag, text ) => {
        var result = { };
        result.tag = tag;
        if ( text ) text.trim().split( /\s/ ).map( pair => {
            const halves = pair.split( '=' );
            if ( halves.length != 2 ) return;
            result[halves[0]] = halves[1].substring( 1, halves[1].length - 1 );
        } );
        return result;
    }
    while ( mathml.length > 0 ) {
        // console.log( stack );
        if ( match = /^<([a-zA-Z]+)( [^>]*)?\/>/.exec( mathml ) ) {
            if ( match[1] == 'mspace' ) {
                stack.push( ' ' );
            } else {
                throw `Stuck at: ${match[0]}`;
            }
            mathml = mathml.substring( match[0].length );
        } else if ( match = /^<([a-zA-Z]+)( [^>]*)?>/.exec( mathml ) ) {
            stack.push( attrDict( match[1], match[2] ) );
            mathml = mathml.substring( match[0].length );
        } else if ( match = /^<\/([a-zA-Z]+)>/.exec( mathml ) ) {
            const operator = match[1]; // assume well-formed XML
            var operands = [ ];
            var attrs;
            while ( stack.length > 0 ) {
                var next = stack.pop();
                if ( next.hasOwnProperty( 'tag' ) ) { attrs = next; break; }
                operands.unshift( next );
            }
            if ( operator == 'mo' || operator == 'mrow'
              || operator == 'mi' || operator == 'mn' ) {
                stack.push( operands.join( '' ) );
            } else if ( operator == 'mfenced' ) {
                stack.push( attrs.open + operands.join( ',' ) + attrs.close );
            } else if ( operator == 'msup' ) {
                stack.push( operands.join( '^' ) );
            } else if ( operator == 'msub' ) {
                stack.push( operands.join( '_' ) );
            } else {
                stack.push( `${operator}(${operands})` );
            }
            mathml = mathml.substring( match[0].length );
        } else {
            const text = mathml.indexOf( '<' ) > -1 ?
                mathml.substring( 0, mathml.indexOf( '<' ) ) : mathml;
            stack.push( text );
            mathml = mathml.substring( text.length );
            if ( text.length == 0 ) {
                throw `Stuck at: ${mathml}`
            }
        }
    }
    return stack.pop();
}
