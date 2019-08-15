//@flow
/*
 * The functions in this script file define how Group Explorer
 * displays and lets users interact with GAP code throughout
 * the application.
 */

/*
 * We give access to live GAP execution online through the
 * Sage Cell Server, at the following URL.
 */
const SageCellURL = 'https://sagecell.sagemath.org/static/embedded_sagecell.js';
/*
 * Define a few text constants for use below.
 */
const showtext = 'Compute this in GAP \u25bc';
const hidetext = 'Hide GAP code \u25b2';
const GAPlink = '<a target="_blank" href="help/rf-um-gap">What is GAP?</a>';

/*
 * Any Group Explorer page can call this function after it has done all
 * the work of setting up the page, including such things as instantiating
 * templates.
 */
/*::
import XMLGroup from './XMLGroup.js';
import Log from './Log.js';

var group: XMLGroup;
var sagecell: any;

export default
*/
function setUpGAPCells () {
    // Import the Sage Cell script and wait until it has loaded.
    // Note that the sequence of calls here is very important;
    // we must create the script element, add it to the document,
    // add its load event listener, then set its src property.
    // Other sequences of these events do not do what you want.
    const script = document.createElement( 'script' );
    $( document.head ).append( script );
    script.addEventListener( 'load', () => {
        // Find all elements marked with the "gapcode" class
        // and process each one as follows.
        $( '.gapcode' ).each( function () {
            const $block = $( this );
            $block.css( { position : 'relative' } );
            // Create a button for revealing the GAP code in the block
            // and place it before the block.
            const $button = $( `<input type="button"/>` );
            (($button.get(0) /*: any */) /*: HTMLInputElement */).value = showtext;
            $button.css( { margin : '5px 0px 0px 10px' } );
            const $div = $( '<div></div>' );
            $div.append( $button );
            $div.insertBefore( $block );
            // Hide the code, then let the user use the button
            // to show the code and/or hide it again.
            $block.hide();
            $button.on( 'click', event => {
                if ( (($button.get(0) /*: any */) /*: HTMLInputElement */).value == showtext ) {
                    $block.show();
                    (($button.get(0) /*: any */) /*: HTMLInputElement */).value = hidetext;
                } else {
                    $block.hide();
                    (($button.get(0) /*: any */) /*: HTMLInputElement */).value = showtext;
                }
            } );
            // For each .gapcode element, do any pre-processing necessary
            // to generate the code and properties it's supposed to have.
            prepareGAPCodeBlock( this );
            // While the block is hidden, have the Sage Cell script
            // replace it with an editor and Run button that can send
            // the code to the Sage Cell Server for execution.
            sagecell.makeSagecell( {
                inputLocation : $block.get(0),
                evalButtonText : 'Run',
                languages : [ 'gap' ],
                hide : [ 'language', 'fullScreen' ],
                callback : () => {
                    // Style it so that it's obviously separate from
                    // the surrounding content.
                    $block.css( {
                        border : '3px solid blue',
                        borderRadius : '10px',
                        padding : '10px',
                        margin : '0px 10px 10px 10px'
                    } );
                    // Add a heading
                    var heading = 'GAP code';
                    if ( this.dataset.purpose )
                        heading += ' for ' + this.dataset.purpose;
                    const $hdr = $( `<h2>${heading}</h2>` );
                    $hdr.css( { marginTop : 0, marginBottom : '10px' } );
                    $block.prepend( $hdr );
                    // Add a link to the GE help page on GAP integration
                    const $whatIsGAP = $( `<p>${GAPlink}</p>` );
                    $whatIsGAP.css( {
                        position : 'absolute',
                        right : 0,
                        top : 0,
                        margin : '10px',
                        fontSize : '0.7em'
                    } );
                    $block.prepend( $whatIsGAP );
                }
            } );
        } );
    } );
    // Assign the script's src attribute last, as documented at the top.
    script.src = SageCellURL;
}

/*
 * For now, this function is a stub.
 * More later.
 */
function prepareGAPCodeBlock ( elt ) {
    /*
     * Declare some private functions
     */

    // converting an arbitrary string to a JS identifier (not injective)
    function toIdent ( str ) {
        if ( !/^[a-zA-Z_]/.test( str ) ) str = '_' + str;
        return str.replace( /[^a-zA-Z0-9_]/g, '' );
    }
    // convert a permutation represented as \sigma(i)=array[i]
    // into cycle notation as an array of arrays
    function cycleNotation ( array ) {
        var todo = array.map( ( _, index ) => index );
        var result = [ ];
        while ( todo.length > 0 ) {
            var start = todo[0];
            var cycle = [ ];
            for ( var walk = start ; todo.indexOf( walk ) > -1 ; walk = array[walk] ) {
                cycle.push( walk );
                const index = todo.indexOf( walk );
                todo.splice( index, 1 );
            }
            if ( cycle.length > 1 ) result.push( cycle );
        }
        return result;
    }
    // converting an arbitrary group element to a GAP permutation
    function toGAPPerm ( G, g ) {
        return cycleNotation( G.elements.map( e => G.mult( e, g ) ) ).map( cycle =>
            `(${cycle.map( i => i+1 ).join( ',' )})` ).join( '' );
    }
    // create a GAP code string that will construct the group
    function GAPConstructor ( G ) {
        if ( G.order == 1 ) return 'Group( [ () ] )';
        const gens = G.generators[0].map( gen => toGAPPerm( G, gen ) );
        return `Group( [ ${gens.join( ', ' )} ] )`;
    }
    // fill the DIV with text, removing indentation that was here only for
    // making the code look pretty in this file
    function setCode ( code /*: string */ ) {
        const lines = code.split( '\n' );
        while ( /^\s*$/.test( lines[0] ) ) lines.shift();
        while ( /^\s*$/.test( lines[lines.length-1] ) ) lines.pop();
        const indents = lines.reduce( (indents, line) => {
            if ( /\S/.test( line ) )
                indents.push( ((/\S/.exec( line ) /*: any */) /*: RegExp$matchResult */).index );
            return indents;
        }, [] );
        const minIndent = indents.reduce( ( a, b ) => Math.min( a, b ) );
        elt.textContent =
            lines.map( line => line.substr( minIndent ) ).join( '\n' );
    }

    /*
     * Now consider each type of code we know how to generate.
     */
    const G = toIdent( group.shortName );
    // const gens = group.generators[0].map( gen => toGAPPerm( group, gen ) );
    const [ ord, idx ] = group.gapid.split( ',' );
    const gpdef = `SmallGroup( ${ord}, ${idx} )`;
    // window.DUMP = function () {
    //     var strs = [ ];
    //  ******* out of date -- see Library.js ********
    //     [...Library.map.keys()].sort().map( ( key ) => {
    //         const G = Library.map.get( key );
    //         const Gname = toIdent( G.shortName );
    //         strs.push( `Print( "${key}\\n" );;` );
    //         strs.push( `tmp := IdGroup( ${GAPConstructor( G )} );;` );
    //         strs.push( `Print( "    <gapid>", tmp[1], ",", tmp[2], "</gapid>\\n" );;` );
    //         strs.push( `tmp := SmallGroup( tmp[1], tmp[2] );;` );
    //         strs.push( `Print( "    <gapname>", StructureDescription( tmp ), "</gapname>\\n" );;` );
    //     } );
    //     Log.debug( strs.join( '\n' ) );
    // };
    const goal = elt.dataset.builtInCodeType;
    let code = '';
    if ( goal == 'create group' ) {
        setCode( `
            # In GAP's Small Groups library, of all the groups
            # of order ${ord}, this one is number ${idx}:
            ${G} := ${gpdef};
        ` );
        elt.dataset.purpose = 'creating this group';
    } else if ( goal == 'is abelian' ) {
        code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is abelian:
            IsAbelian( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( !group.isAbelian ) code += `
        //     # Ask for example elements that do not commute:
        //     a := First( ${G}, a -> ForAny( ${G}, b -> a*b <> b*a ) );
        //     b := First( ${G}, b -> a*b <> b*a );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is abelian';
    } else if ( goal == 'class equation' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Get the sizes of all conjugacy classes:
            List( ConjugacyClasses( ${G} ), Size );
        ` );
        elt.dataset.purpose = 'computing the numbers in a class equation';
    } else if ( goal == 'is cyclic' ) {
        code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is cyclic:
            IsCyclic( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( group.isCyclic ) code += `
        //     # Ask for an element that generates the group:
        //     First( ${G}, g -> Order( g ) = Order( ${G} ) );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is cyclic';
    } else if ( goal == 'all subgroups' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask for the list of subgroups:
            AllSubgroups( ${G} );
        ` );
        elt.dataset.purpose = 'getting the list of all subgroups of a group';
    } else if ( goal == 'is normal' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Pick a random subgroup as an example:
            S := Random( AllSubgroups( ${G} ) );

            # Ask whether it is normal:
            IsNormal( ${G}, S );
        ` );
        elt.dataset.purpose = 'checking whether a subgroup is normal';
    } else if ( goal == 'subgroup lattice' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask for the lattice of subgroups:
            LatticeSubgroups( ${G} );

            # (See the GAP manual for how to manipulate the resulting object.)
        ` );
        elt.dataset.purpose = 'getting the lattice of subgroups of a group';
    } else if ( goal == 'is simple' ) {
        code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is simple:
            IsSimple( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( !group.isSimple ) code += `
        //     # Ask for a normal subgroup:
        //     First( AllSubgroups( ${G} ), S -> IsNormal( ${G}, S ) );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is simple';
    } else if ( goal == 'order classes' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Compute all element orders and make a set of those results:
            Set( ${G}, Order );
        ` );
        elt.dataset.purpose = 'computing how many order classes a group has';
    } else if ( goal == 'is solvable' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is solvable:
            IsSolvable( ${G} );
        ` );
        elt.dataset.purpose = 'checking if a group is solvable';
    } else if ( goal == 'all computed properties' ) {
        if ( group.isCyclic ) code += `
            # Is it decomposable as a product of smaller cyclic groups?
            # (That is, are there relatively prime n,m with n*m=${group.order}?)
            First( [2..Size(G)-1], n -> Gcd(n,Size(G)/n) = 1 );
            `;
        setCode( code );
        elt.dataset.purpose = 'computing group properties';
    } else {
        Log.info( 'Would not prepare this:', elt );
    }
}
