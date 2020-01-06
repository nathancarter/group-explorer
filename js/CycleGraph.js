//@flow

import XMLGroup from './XMLGroup.js';

/*::
export type Highlights = {background: Array<color>; border: Array<color>; top: Array<color>};

type Coordinate = {x: float, y: float};
type Path = {
   pts: Array<Coordinate>,
   partIndex?: number,
   part?: Array<Array<groupElement>>,
   cycleIndex?: number,
   cycle?: Array<groupElement>,
   pathIndex?: number
};
*/

export default
class CycleGraph {
/*::
   static SOME_SETTING_NAME: string;
   group: XMLGroup;
   SOME_SETTING_NAME: string;
   elements: Array<groupElement>;
   cycles: Array<Array<groupElement>>;
   positions: Array<Coordinate>;
   rings: Array<number>;
   cyclePaths: Array<Path>;
   partIndices: Array<number>;
   bbox: {left: number, right: number, top: number, bottom: number};
   closestTwoPositions: number;
   highlights: Highlights;
 */   
   constructor(group /*: XMLGroup */) {
      this.group = group;
      this.layOutElementsAndPaths();
      this.findClosestTwoPositions();
      this.reset();
   }

   static _init() {
      CycleGraph.SOME_SETTING_NAME = 'its default value';
   }

   // gcd of two natural numbers
   static gcd(n /*: number */, m /*: number */) /*: number */ { return m ? CycleGraph.gcd( m, n % m ) : n; }

   // orbit of an element in the group, but skipping the identity
   orbitOf(g /*: groupElement */) /*: Array<groupElement> */ {
      var result = [ 0 ];
      var next;
      while ( next = this.group.mult( result[result.length-1], g ) )
         result.push( next );
      result.shift();
      return result;
   }

   // element to a power
   raiseToThe(h /*: groupElement */, n /*: number */) /*: groupElement */ {
      var result = 0;
      for ( var i = 0 ; i < n ; i++ ) result = this.group.mult( result, h );
      return result;
   }

   // how soon does the orbit of g intersect the given list of elements?
   // that is, consider the smallest power of g that appears in the array;
   // at what index does it appear?
   howSoonDoesOrbitIntersect(g /*: groupElement */, array /*: Array<groupElement> */) /*: number */ {
      var orbit = this.orbitOf( g );
      var power = 0;
      for ( var walk = g ; walk != 0 ; walk = this.group.mult( walk, g ) ) {
         ++power;
         var index = array.indexOf( walk );
         if ( index > -1 ) return index;
      }
      return -1;
   }

   // Given elements g,h in this.group, find the "best power of h relative
   // to g," meaning the power t such that the orbit [e,h^t,h^2t,...]
   // intersects the orbit [e,g,g^2,...] as early as possible (in the orbit
   // of g).
   bestPowerRelativeTo(h /*: groupElement */, g /*: groupElement */) /*: number */ {
      var orbit_g = this.orbitOf( g );
      var bestPower = 0;
      var bestIndex = orbit_g.length;
      var hToThePower = 0;
      for ( var t = 1 ; t < this.group.elementOrders[h] ; t++ ) {
         hToThePower = this.group.mult( hToThePower, h );
         if ( CycleGraph.gcd( t, this.group.elementOrders[h] ) == 1 ) {
            var index = this.howSoonDoesOrbitIntersect(
               hToThePower, orbit_g );
            if ( index < bestIndex ) {
               bestIndex = index;
               bestPower = t;
            }
         }
      }
      // return it
      return bestPower;
   }

   // ease-in-out curves, one going uphill from (0,0) to (1,1)
   static easeUp(t /*: float */) /*: float */ {
      return ( Math.cos( ( 1 - t ) * Math.PI ) + 1 ) / 2;
   }
   // and another going downhill, from (0,1) to (1,0)
   static easeDown(t /*: float */) /*: float */ { return 1 - CycleGraph.easeUp( 1 - t ); }

   // generic linear interpolation function
   static interp(A /*: float */, B /*: float */, t /*: float */) /*: float */ { return ( 1 - t ) * A + t * B; }

   // mutating a point in the upper half plane to sit within the arc
   // defined by two given angles alpha and beta, pulled toward the
   // center of that arc with a specific level of gravity, 0<=g<=1.
   static mutate(x /*: float */, y /*: float */, alpha /*: float */, beta /*: float */, g /*: float */) /*: Coordinate */ {
      var r = Math.sqrt( x*x + y*y );
      var theta = Math.atan2( y, x );
      var theta2 = CycleGraph.interp( alpha, beta, theta/Math.PI );
      var x2 = r * Math.cos( theta2 );
      var y2 = r * Math.sin( theta2 );
      var cx = Math.cos( ( alpha + beta ) / 2 ) / 2;
      var cy = Math.sin( ( alpha + beta ) / 2 ) / 2;
      return {
         x: CycleGraph.interp( x2, cx, g ),
         y: CycleGraph.interp( y2, cy, g )
      };
   }

   reset() {
      this.elements = this.group.elements.slice();
      this.SOME_SETTING_NAME = CycleGraph.SOME_SETTING_NAME;
   }

   layOutElementsAndPaths() {
      // sort the elements by the length of their name, as text
      var eltsByName = this.group.elements.slice();
      if ( this.group.representation ) {
         eltsByName.sort( ( a, b ) => {
            var aName = this.group.representation[a];
            var bName = this.group.representation[b];
            return aName.length < bName.length ? -1 : (aName.length > bName.length ?  1 : 0);
         } );
      }
      // for ( var i = 0 ; i < this.group.order ; i++ ) Log.debug( i, this.group.representations[this.group.representationIndex][i] );

      // compute a list of cycles
      var cycles /*: Array<Array<groupElement>> */ = [ ];
      var notYetPlaced /*: Array<groupElement> */ = eltsByName.slice();
      notYetPlaced.splice( notYetPlaced.indexOf( 0 ), 1 );
      while ( notYetPlaced.length > 0 ) {
         // find the element with the maximum order
         var eltWithMaxOrder = notYetPlaced[0];
         notYetPlaced.forEach( unplaced => {
            if ( this.group.elementOrders[unplaced]
               > this.group.elementOrders[eltWithMaxOrder] )
               eltWithMaxOrder = unplaced;
         } );
         // add its orbit to the list of cycles
         var nextCycle = this.orbitOf( eltWithMaxOrder );
         cycles.push( nextCycle );
         // remove all its members from the notYetPlaced array
         var old = notYetPlaced.slice();
         notYetPlaced = [ ];
         old.forEach( maybeUnplaced => {
            if ( nextCycle.indexOf( maybeUnplaced ) == -1 )
               notYetPlaced.push( maybeUnplaced );
         } );
         // continue iff there's stuff left in the notYetPlaced array
      }
      this.cycles = cycles;
      // Log.debug( 'cycle', JSON.stringify( cycles ) );

      // partition the cycles, forming a list of lists.
      // begin with all cycles in their own part of the partition,
      // and we will unite parts until we can no longer do so.
      var partition /*: Array<Array<Array<groupElement>>> */ = cycles.map( cycle => [ cycle ] );
      var that = this;
      function uniteParts ( partIndex1 /*: number */, partIndex2 /*: number */ ) {
         partition[partIndex2].forEach( cycle => {
            var cycleGen = cycle[0];
            var partGen = partition[partIndex1][0][0];
            var replacement = that.raiseToThe( cycleGen,
               that.bestPowerRelativeTo( cycleGen, partGen ) );
            partition[partIndex1].push( that.orbitOf( replacement ) );
         } );
         partition.splice( partIndex2, 1 );
      }
      function flattenPart ( part /*: Array<Array<groupElement>> */ ) /*: Array<groupElement> */ {
         return part.reduce( ( acc, cur ) => acc.concat( cur ) );
      }
      function arraysIntersect ( a1 /*: Array<groupElement> */, a2 /*: Array<groupElement> */ ) /*: boolean */ {
         return a1.findIndex( elt => a2.indexOf( elt ) > -1 ) > -1;
      }
      var keepChecking = true;
      while ( keepChecking ) {
         keepChecking = false;
         for ( var i = 0 ; !keepChecking && i < partition.length ; i++ ) {
            for ( var j = 0 ; !keepChecking && j < i ; j++ ) {
               if ( arraysIntersect( flattenPart( partition[i] ),
                                     flattenPart( partition[j] ) ) ) {
                  uniteParts( i, j );
                  keepChecking = true;
               }
            }
         }
      }
      // Log.debug( 'partition', JSON.stringify( partition ) );
      // sanity check:
      // partition.forEach( ( part, i ) => {
      //    partition.forEach( ( otherPart, j ) => {
      //       if ( i > j ) return;
      //       part.forEach( ( cycle, ii ) => {
      //          otherPart.forEach( ( otherCycle, jj ) => {
      //             const inSamePart = ( i == j );
      //             const commonElt = cycle.find( ( x ) => otherCycle.indexOf( x ) > -1 );
      //             if ( !inSamePart && typeof( commonElt ) != 'undefined' ) {
      //                Log.err( `Cycle ${ii} in part ${i} is ${cycle} `
      //                       + `and cycle ${jj} in part ${j} is ${otherCycle} `
      //                       + `and they share ${commonElt}.` );
      //             }
      //          } );
      //       } );
      //    } );
      // } );

      // assign arc sizes to parts of the partition
      // (unless there is only one part, the degenerate case)
      if ( partition.length > 1 ) {
         // find the total sizes of all cycles in each part
         var partSizes /*: Array<number> */ = [ ];
         for ( var i = 0 ; i < partition.length ; i++ ) {
            var size = 0;
            for ( var j = 0 ; j < partition[i].length ; j++ )
               size += partition[i][j].length;
            partSizes.push( size );
         }
         // assign angles proportional to those sizes,
         // but renormalize to cap the max at 180 degrees if needed
         var total /*: number */ = 0;
         partSizes.forEach( x => total += x );
         var max = Math.max.apply( null, partSizes );
         if ( max > total / 2 ) {
            var diff = max - total / 2;
            partSizes = partSizes.map( x => Math.min( x, total / 2 ) );
            total -= diff;
         }
         var angles = partSizes.map( x => x * 2 * Math.PI / total );
         var cumsums = [ 0 ];
         for ( var i = 0 ; i < angles.length ; i++ )
            cumsums.push( cumsums[i] + angles[i] );
      } else { // handle degenerate case
         var cumsums = [ 0, Math.PI ];
      }
      // Log.debug( 'cumsums', cumsums );

      // rotate things so that the largest partition is hanging
      // straight downwards
      var maxPartLength = 0;
      var maxPartIndex = -1;
      partition.forEach( ( part, idx ) => {
         if ( part.length > maxPartLength ) {
            maxPartLength = part.length;
            maxPartIndex = idx;
         }
      } );
      var maxPartCenter =
         ( cumsums[maxPartIndex] + cumsums[maxPartIndex+1] ) / 2;
      var diff = -1 / 2 * Math.PI - maxPartCenter;
      cumsums = cumsums.map( angle => angle + diff );
      // Log.debug( 'angle-ified', cumsums );

      // assign locations in the plane to each element,
      // plus create paths to be drawn to connect them
      this.positions = Array( this.group.order ).fill( null );  // marker to show we haven't computed them yet
      this.positions = [ { x: 0, y: 0 } ]; // identity at origin
      this.rings = Array( this.group.order ).fill( 0 );
      this.cyclePaths = [ ];
      this.partIndices = [ ];
      partition.forEach( ( part, partIndex ) => {
         // compute the peak of each part's "flower petal" curve
         var r = part.length / maxPartLength;
         var R = Math.sqrt( Math.max( r, 0.25 ) );
         part.forEach( ( cycle, cycleIndex ) => {
            var f = ( ringNum, idx, t ) => {
               var theta = 2 * Math.PI
                         * ( ( idx + t ) / ( cycle.length + 1 ) - 0.25 );
               return CycleGraph.mutate(
                  -R * Math.cos( theta ),
                  R * ( 1 + Math.sin( theta ) ),
                  cumsums[partIndex], cumsums[partIndex+1],
                  ringNum / part.length
               );
            };
            for ( i = 0 ; i <= cycle.length ; i++ ) {
               var prev = ( i == 0 ) ? 0 : cycle[i-1];
               var curr = ( i == cycle.length ) ? 0 : cycle[i];
               if ( !this.positions[curr] ) {
                   this.partIndices[curr] = partIndex;
                   this.rings[curr] = cycleIndex;
                   // Log.debug( `rings[${curr}] := ${cycleIndex}` );
                   this.positions[curr] = f( this.rings[curr], i, 1 );
               }
               var path /*: Path */ = {pts: []};
               const step = 0.02;
               // Log.debug( `connecting ${this.rings[prev]} to ${this.rings[curr]}` );
               // if ( prev && curr && this.partIndices[prev] != this.partIndices[curr] )
               //    Log.err( `index[${prev}]=${this.partIndices[prev]}!=${this.partIndices[curr]}=index[${curr}]` );
               for ( var t = 0 ; t <= 1+step/2 ; t += step ) {
                  var ring1 = f( this.rings[prev], i, t );
                  var ring2 = f( this.rings[curr], i, t );
                  var et = CycleGraph.easeUp( t );
                  path.pts.push( {
                     x: CycleGraph.interp( ring1.x, ring2.x, et ),
                     y: CycleGraph.interp( ring1.y, ring2.y, et )
                  } );
               }
               path.partIndex = partIndex;
               path.part = part;
               path.cycleIndex = cycleIndex;
               path.cycle = cycle;
               path.pathIndex = i;
               this.cyclePaths.push( path );
            }
         } );
      } );

      // enable rescaling to a bounding box of [-1,1]^2
      this.bbox = { left: 0, right: 0, top: 0, bottom: 0 };
      this.cyclePaths.forEach( points => {
         points.pts.forEach( pos => {
            this.bbox.top = Math.max( this.bbox.top, pos.y );
            this.bbox.bottom = Math.min( this.bbox.bottom, pos.y );
            this.bbox.left = Math.min( this.bbox.left, pos.x );
            this.bbox.right = Math.max( this.bbox.right, pos.x );
         } );
      } );
   }

   // convenience function used to convert a partition of the group
   // into color data for highlighting, used by all three highlight
   // functions, below.
   _partitionToColorArray(partition /*: Array<Array<groupElement>> */, start /*: groupElement */) /*: Array<color> */ {
      var result = Array(this.group.order);
      if ( typeof( start ) == 'undefined' ) start = 0;
      partition.forEach( ( part, partIndex ) => {
         var colorFraction = Math.round(
            start + 360 * partIndex / partition.length );
         var color = `hsl(${colorFraction},100%,80%)`;
         part.forEach( ( element, eltIndex ) => {
            result[element] = color;
         } );
      } );
      return result;
   }

   // Shortest distance between two vertices in the diagram
   findClosestTwoPositions() {
      this.closestTwoPositions = Infinity;
      const order = this.group.order;
      for (let i = 0; i < order-1; i++) {
         const pos1 = this.positions[i];
         for (let j = i+1; j < order; j++) {
            const pos2 = this.positions[j];
            this.closestTwoPositions = Math.min( this.closestTwoPositions, Math.sqrt(
               ( pos1.x - pos2.x ) * ( pos1.x - pos2.x )
               + ( pos1.y - pos2.y ) * ( pos1.y - pos2.y ) ) );
         }
      }
   }

   highlightByBackground(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.background =
         this._partitionToColorArray( partition, 0 );
   }

   highlightByBorder(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.border =
         this._partitionToColorArray( partition, 120 );
   }

   highlightByTop(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.top =
         this._partitionToColorArray( partition, 240 );
   }

   clearHighlights() {
      this.highlights = { };
   }
}

CycleGraph._init();
