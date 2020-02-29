// @flow

import BasicGroup from './js/BasicGroup.js';
import {CayleyDiagramView, createUnlabelledCayleyDiagramView} from './js/CayleyDiagramView.js';
import IsomorphicGroups from './js/IsomorphicGroups.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import MathUtils from './js/MathUtils.js';
import setUpGAPCells from './js/ShowGAPCode.js';
import Subgroup from './js/Subgroup.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import {CreateNewSheet} from './js/SheetModel.js';

export {loadGroup as load, showSubgroupLattice, showEmbeddingSheet, showQuotientSheet};

/*::
import type {
   JSONType,
   SheetElementJSON,
   RectangleElementJSON,
   TextElementJSON,
   VisualizerType,
   VisualizerElementJSON,
   ConnectingElementJSON,
   MorphismElementJSON
} from './js/SheetModel.js';

type DecoratedSubgroup = Subgroup & {_tierIndex?: number, _used?: boolean};
 */

// Module variables
let group		/*: XMLGroup */;		// group for which subgroups are being displayed
let Cayley_Diagram_View	/*: CayleyDiagramView */;

// Load group from invocation URL
function loadGroup() {
   Library
      .loadFromURL()
      .then( (_group) => {
         group = _group;
         displayGroup()
      } )
      .catch( Log.err );
}

function displayGroup() {
   Cayley_Diagram_View = createUnlabelledCayleyDiagramView( { width : 50, height : 50 } );
   const $rslt = $(document.createDocumentFragment())
      .append(eval(Template.HTML('header_template')));
   if (group.isSimple) {
      $rslt.find('#not-simple').remove();
   } else {
      $rslt.find('#simple').remove();
   }

   for (let inx = 0; inx < group.subgroups.length; inx++) {
      $rslt.find('tbody').append(subgroupInfo(inx)).html();
   }

   if ($rslt.find('li.no_isomorphism').length == 0) {
      $rslt.find('#no_isomorphism_reason').remove();
   }
   if ($rslt.find('li.no_quotient_group').length == 0) {
      $rslt.find('#no_quotient_group_reason').remove();
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);

   setUpGAPCells(group);
}

function subgroupInfo(index /*: number */) {
   const subgroup = group.subgroups[index];
   const subgroupOrder = subgroup.members.popcount();
   const optionalDescription = shortDescription(subgroup);
   const element_representations = subgroup.members.toArray().map( el => group.representation[el] );

   const $row = $(eval(Template.HTML('data_row_template')));

   let isomorphicGroup = IsomorphicGroups.findForSubgroup(group, subgroup)
   if (isomorphicGroup == undefined) {
      $row.find('ul').append(eval(Template.HTML('no_isomorphism_template')));
   } else {
      // FIXME -- get CayleyDiagram to build for unnamed BasicGroup
      if (!isomorphicGroup.hasOwnProperty('name'))
         Log.err('trying to build CayleyDiagram for unnamed BasicGroup in SubgroupInfo');
      // Use cached Cayley diagram where possible
      const cached_thumbnail = ((isomorphicGroup /*: any */) /*: XMLGroup */).CayleyThumbnail;
      let image /*: Image */;
      if (cached_thumbnail != undefined) {
         image = (($('<img>').attr({src: cached_thumbnail})[0] /*: any */) /*: Image */);
      } else {
         Cayley_Diagram_View.setDiagram( ((isomorphicGroup /*: any */) /*: XMLGroup */) );
         image = Cayley_Diagram_View.getImage();
      }
      image.height = image.width = 50;
      $row.find('.image').html('').append(image);
      $row.find('ul').append(eval(Template.HTML('isomorphism_template')));
   }

   if (group.isNormal(subgroup)) {
      if (subgroupOrder == 1) {
         isomorphicGroup = group;
      } else {
         const quotientGroup = group.getQuotientGroup(subgroup.members);
         isomorphicGroup = IsomorphicGroups.find(quotientGroup);
      }

      if (isomorphicGroup === undefined) {
         $row.find('ul').append(eval(Template.HTML('no_quotient_group_template')));
      } else {
         $row.find('ul').append(eval(Template.HTML('quotient_group_template')));
      }
   }

   return $row;
}

function shortDescription(subgroup /*: Subgroup */) {
   let rslt = '';

   const elements = subgroup.members.toArray();
   if (elements.length == 1) {
      rslt = ', the trivial subgroup, ';
   } else if (elements.length == group.order) {
      rslt = ', the whole group, '
      if (MathUtils.isPrimePower(group.order)) {
         const prime = MathUtils.getFactors(group.order)[0];
         rslt += `a <a href="./help/rf-groupterms/index.html#p-subgroup">
                         ${prime}-group</a>, `;
      }
   } else {
      // get first non-one element,
      // find prime for group,
      // test all other elements for even divisibility
      const subgroupElementOrders /*: Array<number> */ = elements.map( el => group.elementOrders[el] );
      const prime = MathUtils.getFactors(subgroupElementOrders[1])[0];
      if (subgroupElementOrders.every(el => el == 1 || el % prime == 0)) {
         if (group.order / subgroup.members.popcount() % prime != 0) {
            rslt = `, a <a href="./help/rf-groupterms/index.html#sylow-p-subgroup">
                        Sylow ${prime}-subgroup</a>, `;
         } else {
            rslt = `, a <a href="./help/rf-groupterms/index.html#p-subgroup">
                        ${prime}-subgroup</a>, `;
         }
      }
   };

   return rslt;
}

function highlightSubgroup ( H /*: Subgroup */ ) {
   return Array( group.order ).fill( '' ).map( ( e /*: color */, i ) =>
      H.members.isSet( i ) ? 'hsl(0, 100%, 80%)' : e );
}
function showSubgroupLattice ( type /*: VisualizerType */ ) {
   // Handy function
   function subset ( H /*: Subgroup */, K /*: Subgroup */ ) /*: boolean */ { return K.members.contains( H.members ); }
   // Let's tier the group's subgroups by order.
   var subgroupTiers /*: Array<Array<DecoratedSubgroup>> */ = [ ];
   for ( var i = 0 ; i < group.subgroups.length ; i++ ) {
      const sgp /*: DecoratedSubgroup */ = group.subgroups[i];
      var existingTier /*: Array<DecoratedSubgroup> */ = (subgroupTiers.find( ( tier ) => tier[0].order == sgp.order ) /*: any */);
      if ( existingTier )
         existingTier.push( sgp );
      else
         subgroupTiers.push( [ sgp ] );
   }
   // Now sort those tiers with the smallest subgroups first, largest later.
   // Sort the original list of subgroups as well.
   subgroupTiers.sort( ( tiera, tierb ) => tiera[0].order - tierb[0].order );
   subgroupTiers.map( ( tier, i ) => tier.map( sgp => {
      sgp._tierIndex = i;
      sgp._used = false;
   } ) );
   // We wish to organize each tier so that connections between tiers are least tangled.
   // We begin by getting a list of the tiers' orders.
   const tierOrders = subgroupTiers.map( ( tier ) => tier[0].order );
   // We now compute a series of paths from {e} to G, passing through as many subgroups
   // as possible, so we can form chains that should be vertically arranged.
   // As we place subgroups in a chain, we remove them from placement in other chains.
   function pathsUpFrom ( H /*: DecoratedSubgroup */) /*: Array<Array<null | DecoratedSubgroup>> */ {
      H._used = true;
      // This is a recursive walk through the graph, turning it into a tree.
      if ( H._tierIndex == subgroupTiers.length - 1 ) {
         // Base case: We've already reached the top node.
         // Thus there is one path up, the one-step path containing just H, which is G.
         return [ [ H ] ];
      } else {
         // Find the tier containing the next subgroup we can walk to.
         var result /*: Array<Array<null | DecoratedSubgroup>> */ = [ ];
         var initialSegment /*: Array<null | DecoratedSubgroup> */ = [ H ];
         for ( var tierIdx = H._tierIndex + 1 ; tierIdx < subgroupTiers.length ; tierIdx++ ) {
            subgroupTiers[tierIdx]
               .filter( (K /*: DecoratedSubgroup */) => subset( H, K ) && !K._used )
               .map( (K) => {
                  pathsUpFrom( K )
                     .map( (path /*: Array<null | DecoratedSubgroup> */) => {
                        result.push( initialSegment.concat( path ) );
                        initialSegment[0] = null;
                     } );
               } );
            initialSegment.push( null );
         }
         if ( initialSegment[0] != null ) result.push( initialSegment );
         return result;
      }
   }
   const chains = pathsUpFrom( group.subgroups[0] );
   // Now we write a function that uses the chains structure to compute a position on
   // the sheet for a visualizer of the subgroup.
   const hSize = chains.length, vSize = chains[0].length,
         cellWidth = Math.min( 300, Math.ceil( 800 / hSize ) ),
         cellHeight = cellWidth * 1.5,
         hMargin = Math.ceil( cellWidth * 0.1 ),
         vMargin = hMargin + ( cellHeight - cellWidth ) / 2,
         latticeTop = 100, latticeLeft = 50;
   function subgroupPosition ( H  /*: Subgroup */ ) /*: {x: number, y: number} */ {
      var x, y;
      if ( ( H.order == 1 ) || ( H.order == group.order ) ) {
         x = chains.length * cellWidth / 2 - cellWidth / 2;
         y = ( H.order == 1 ) ? cellHeight * ( vSize - 1 ) : 0;
      } else {
         const hIndex = chains.indexOf( chains.find(
            chain => chain.indexOf( H ) > -1 ) );
         x = hIndex * cellWidth;
         const vIndex = vSize - 1 - chains[hIndex].indexOf( H );
         y = vIndex * cellHeight;
      }
      return { x : latticeLeft + x, y : latticeTop + y };
   }
   // Build a sheet with subgroups shown at those locations.
   var sheetElementsAsJSON = [ ];
   group.subgroups.map( (H /*: Subgroup */) => {
      const pos = subgroupPosition( H );
      sheetElementsAsJSON.push( {
         className : type, groupURL : group.URL,
         x : pos.x + hMargin, y : pos.y + vMargin,
         w : cellWidth - 2 * hMargin, h : cellHeight - 2 * vMargin,
         highlights : { background : highlightSubgroup( H ) }
      } );
   } );
   // Connect every pair of subgroups that don't have an intermediate connection.
   function existsIntermediateSubgroup ( H /*: Subgroup */, K /*: Subgroup */ ) /*: boolean */ {
      for ( var i = 0 ; i < group.subgroups.length ; i++ ) {
         const considerMe = group.subgroups[i];
         if ( ( H != considerMe ) && ( K != considerMe )
           && subset( H, considerMe ) && subset( considerMe, K ) )
            return true;
      }
      return false;
   }
   group.subgroups.map( ( H /*: Subgroup */, i /*: number */ ) => {
      group.subgroups.map( ( K, j ) => {
         if ( ( H != K ) && subset( H, K ) && !existsIntermediateSubgroup( H, K ) ) {
            sheetElementsAsJSON.push( {
               className : 'ConnectingElement', fromIndex : i, toIndex : j
            } );
         }
      } );
   } );
   // Add a title.
   sheetElementsAsJSON.push( {
      className : 'TextElement',
      text : `Subgroup Lattice for the Group ${MathML.toUnicode( group.name )}`,
      x : latticeLeft, y : latticeTop / 2,
      w : hSize * cellWidth, h : latticeTop / 2,
      fontSize : '20pt', alignment : 'center'
   } );
   // Show the sheet.
   CreateNewSheet( sheetElementsAsJSON );
}

function showEmbeddingSheet ( indexOfH /*: number */, type /*: VisualizerType */ ) {
   const H = group.subgroups[indexOfH],
         [ libraryH, embedding ] = ((IsomorphicGroups.findEmbedding( group, H ) /*: any */) /*: [XMLGroup, Array<groupElement>] */);
   CreateNewSheet( [
      {
         className : 'TextElement',
         text : `Embedding ${MathML.toUnicode( libraryH.name )} as `
              + MathML.toUnicode( `<msub><mi>H</mi><mn>${indexOfH}</mn></msub>` )
              + ` in ${MathML.toUnicode( group.name )}`,
         x : 50, y : 50, w : 500, h : 40,
         fontSize : '20pt', alignment : 'center'
      },
      {
         className : type, groupURL : libraryH.URL,
         x : 50, y : 100, w : 200, h : 200,
         highlights : {
            background : Array( libraryH.order ).fill( 'hsl(0, 100%, 80%)' )
         }
      },
      {
         className : type, groupURL : group.URL,
         x : 350, y : 100, w : 200, h : 200,
         highlights : {
            background : Array( group.order ).fill( '' ).map( ( _, elt ) =>
               embedding.indexOf( elt ) > -1 ? 'hsl(0, 100%, 80%)' : '' )
         }
      },
      {
         className : 'MorphismElement',
         fromIndex : 1, toIndex : 2, name : MathML.toUnicode( '<mi>e</mi>' ),
         definingPairs : libraryH.generators[0].map( gen =>
            [ gen, embedding[gen] ] ),
         showManyArrows : true, showInjSurj : true
      }
   ] );
}

function showQuotientSheet ( indexOfN /*: number */, type /*: VisualizerType */) {
   const N = group.subgroups[indexOfN],
         [ libraryQ, quotientMap ] = ((IsomorphicGroups.findQuotient( group, N ) /*: any */) /*: [XMLGroup, Array<groupElement>] */),
         [ libraryN, embedding ] = ((IsomorphicGroups.findEmbedding( group, N ) /*: any */) /*: [XMLGroup, Array<groupElement>] */),
         L = 25, T = 150, W = 120, H = W, gap = 100;
   function shrink ( order, x, y, w, h ) {
      const factor = 0.5 * ( 1 + order / group.order ),
            hMargin = ( w - factor * w ) / 2,
            vMargin = ( h - factor * h ) / 2;
      return {
         x : x + hMargin, y : y + vMargin, w : factor * w, h : factor * h
      };
   }
   const col1 = 'hsl(60, 100%, 60%)',
         col2 = 'hsl(240, 100%, 80%)',
         col3 = '',
         col4 = 'hsl(120, 100%, 50%)',
         col5 = 'hsl(120, 90%, 85%)',
         loc1 = shrink( 1, L, T, W, H ),
         loc2 = shrink( libraryN.order, L+W+gap, T, W, H ),
         loc3 = shrink( group.order, L+2*W+2*gap, T, W, H ),
         loc4 = shrink( libraryQ.order, L+3*W+3*gap, T, W, H ),
         loc5 = shrink( 1, L+4*W+4*gap, T, W, H ),
         high1 = Array( 1 ).fill( col1 ),
         high2 = Array( libraryN.order ).fill( col2 ),
         high3 = Array( group.order ).fill( col3 ),
         high4 = Array( libraryQ.order ).fill( col3 ),
         high5 = Array( 1 ).fill( col5 );
   embedding.map( elt => high3[elt] = col2 );
   high2[0] = col1;
   high3[0] = col1;
   high4[0] = col4;
   CreateNewSheet( [
      {
         className : 'TextElement',
         x : L, y : T-100, w : 5*W+4*gap, h : 50,
         text : 'Short Exact Sequence showing '
              + MathML.toUnicode( group.name ) + ' / '
              + MathML.toUnicode( libraryN.name ) + ' ≅ '
              + MathML.toUnicode( libraryQ.name ),
         fontSize : '20pt', alignment : 'center'
      },
      {
         className : 'TextElement',
         x : L, y : T-50, w : W, h : 50,
         text : MathML.toUnicode( '<msub><mi>Z</mi><mn>1</mn></msub>' ),
         alignment : 'center'
      },
      {
         className : type, groupURL : './groups/Trivial.group',
         x : loc1.x, y : loc1.y, w : loc1.w, h : loc1.h,
         highlights : { background : high1 }
      },
      {
         className : 'TextElement',
         x : L+W+gap, y : T-50, w : W, h : 50,
         text : MathML.toUnicode( libraryN.name ), alignment : 'center'
      },
      {
         className : type, groupURL : libraryN.URL,
         x : loc2.x, y : loc2.y, w : loc2.w, h : loc2.h,
         highlights : { background : high2 }
      },
      {
         className : 'TextElement',
         x : L+2*W+2*gap, y : T-50, w : W, h : 50,
         text : MathML.toUnicode( group.name ), alignment : 'center'
      },
      {
         className : type, groupURL : group.URL,
         x : loc3.x, y : loc3.y, w : loc3.w, h : loc3.h,
         highlights : { background : high3 }
      },
      {
         className : 'TextElement',
         x : L+3*W+3*gap, y : T-50, w : W, h : 50,
         text : MathML.toUnicode( libraryQ.name ), alignment : 'center'
      },
      {
         className : type, groupURL : libraryQ.URL,
         x : loc4.x, y : loc4.y, w : loc4.w, h : loc4.h,
         highlights : { background : high4 }
      },
      {
         className : 'TextElement',
         x : L+4*W+4*gap, y : T-50, w : W, h : 50,
         text : MathML.toUnicode( '<msub><mi>Z</mi><mn>1</mn></msub>' ),
         alignment : 'center'
      },
      {
         className : type, groupURL : './groups/Trivial.group',
         x : loc5.x, y : loc5.y, w : loc5.w, h : loc5.h,
         highlights : { background : high5 }
      },
      {
         className : 'TextElement',
         x : L+W+gap, y : T+H+25, w : W, h : 50,
         text : MathML.toUnicode(
            '<mrow>'
            + '<mi>Im</mi><mfenced open="(" close=")"><mi>id</mi></mfenced>'
            + '<mo>=</mo>'
            + '<mi>Ker</mi><mfenced open="(" close=")"><mi>e</mi></mfenced>'
            + '</mrow>' ), alignment : 'center'
      },
      {
         className : 'TextElement',
         x : L+2*W+2*gap, y : T+H+25, w : W, h : 50,
         text : MathML.toUnicode(
            '<mrow>'
            + '<mi>Im</mi><mfenced open="(" close=")"><mi>e</mi></mfenced>'
            + '<mo>=</mo>'
            + '<mi>Ker</mi><mfenced open="(" close=")"><mi>q</mi></mfenced>'
            + '</mrow>' ), alignment : 'center'
      },
      {
         className : 'TextElement',
         x : L+3*W+3*gap, y : T+H+25, w : W, h : 50,
         text : MathML.toUnicode(
            '<mrow>'
            + '<mi>Im</mi><mfenced open="(" close=")"><mi>q</mi></mfenced>'
            + '<mo>=</mo>'
            + '<mi>Ker</mi><mfenced open="(" close=")"><mi>z</mi></mfenced>'
            + '</mrow>' ), alignment : 'center'
      },
      {
         className : 'MorphismElement', name : 'id',
         fromIndex : 2, toIndex : 4,
         showManyArrows : true, showInjSurj : true,
         definingPairs : [ [ 0, 0 ] ]
      },
      {
         className : 'MorphismElement', name : 'e',
         fromIndex : 4, toIndex : 6,
         showManyArrows : true, showInjSurj : true,
         definingPairs : libraryN.generators[0].map( gen => [ gen, embedding[gen] ] )
      },
      {
         className : 'MorphismElement', name : 'q',
         fromIndex : 6, toIndex : 8,
         showManyArrows : true, showInjSurj : true,
         definingPairs : group.generators[0].map( gen => [ gen, quotientMap[gen] ] )
      },
      {
         className : 'MorphismElement', name : 'z',
         fromIndex : 8, toIndex : 10,
         showManyArrows : true, showInjSurj : true,
         definingPairs : libraryQ.generators[0].map( gen => [ gen, 0 ] )
      }
   ] );
}
