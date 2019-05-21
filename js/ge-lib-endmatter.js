
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
    Library.loadFromFilesystem( `./groups/${name}.group` );
Library.getByName = name => Library.map.get( name );
Library.loadAllFromFilesystem = () => {
    const before = ( new Date() ).getTime();
    urls.map( url => Library.loadFromFilesystem( url ) );
    const elapsed = ( new Date() ).getTime() - before;
    console.log( `Loaded all groups in ${elapsed/1000}sec.` );
};
Library.allGroupNamesInFilesystem = () =>
    urls.map( url => /^\.\/groups\/(.*)\.group$/.exec( url )[1] );
