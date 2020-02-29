// @flow

import {broadcastChange} from '../CycleGraph.js';
import Log from './Log.js';
import XMLGroup from './XMLGroup.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import {VizDisplay} from './SheetModel.js';

type Highlights = {
    background: Array<css_color>,
    border: Array<css_color>,
    top: Array<css_color>,
};
export type CycleGraphJSON = {
    groupURL: string,
    highlights?: Highlights,
};

type CycleGraphOptions = {
    width?: number,
    height?: number,
    container?: JQuery
};

type Coordinate = {x: float, y: float};
type Path = {
    pts: Array<Coordinate>,
    partIndex?: number,
    part?: Array<Array<groupElement>>,
    cycleIndex?: number,
    cycle?: Array<groupElement>,
    pathIndex?: number,
};
*/

const DEFAULT_MIN_CANVAS_HEIGHT = 200;
const DEFAULT_MIN_CANVAS_WIDTH = 200;
const DEFAULT_MIN_RADIUS = 30; 
const DEFAULT_ZOOM_STEP = 0.1;
const DEFAULT_CANVAS_WIDTH = 50;
const DEFAULT_CANVAS_HEIGHT = 50;

const SOME_SETTING_NAME = 'its default value';

export class CycleGraphView /*:: implements VizDisplay<CycleGraphJSON> */ {
/*::
    displays_labels: boolean;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    options: CycleGraphOptions;
    zoomFactor: number;
    translate: {dx: number, dy: number};
    transform: THREE.Matrix3;
    radius: number;

    _group: XMLGroup;
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

    show_request: boolean;
*/
    constructor(options /*: CycleGraphOptions */ = {}) {
        this.canvas = (($(`<canvas/>`)[0] /*: any */) /*: HTMLCanvasElement */);
        let width = (options.width === undefined) ? DEFAULT_CANVAS_WIDTH : options.width;
        let height = (options.height === undefined) ? DEFAULT_CANVAS_HEIGHT : options.height;
        const container = options.container;
        if (container != undefined) {
            // take canvas dimensions from container (if specified), option, or default
            width = container.width();
            height = container.height();
            container.append(this.canvas);
        }
        this.setSize( width, height );
        this.context = this.canvas.getContext('2d');
        this.options = options;
        this.zoomFactor = 1;  // user-supplied scale factor multiplier
        this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
        this.transform = new THREE.Matrix3();  // current cycleGraph -> screen transformation

        this.show_request = false;
    }

    get size () /*: {w: number, h: number} */ {
        return {w: this.canvas.width, h: this.canvas.height};
    }

    set size ({w, h} /*: {w: number, h: number} */) {
        if (this.canvas.width != w || this.canvas.height != h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.showGraphic();
        }
    }
    
    getSize () /*: {w: number, h: number} */ {
        return this.size;
    }

    setSize (w /*: number */, h /*: number */) {
        this.size = {w, h};
    }

    resize () {
        if (this.canvas.parentElement != undefined) {
            const $container = $(this.canvas.parentElement);
            this.size = {w: $container.width(), h: $container.height()};
        }
    }

    getImage () /*: Image */ {
        this.showGraphic();
        const img = new Image();
        img.src = this.canvas.toDataURL();
        return img;
    }

    queueShowGraphic () {
        if (!this.show_request) {
            this.show_request = true;
            setTimeout( () => this.showGraphic(), 0 );
        }
    }

    showGraphic () {
        this.show_request = false;

        if (this.group != undefined) {
            this.drawGraphic();
            broadcastChange();
        }
    }
        
    // This routine draws the cycle graph from the data generated
    // by the layoutElementsAndPaths method.
    // Displaying labels within the cycle graph nodes is controlled by
    // the value of 'this.display_labels', set in the factory methods.
    // Not displaying the element names allows the nodes in the
    // graph to be much smaller and so better suited for thumbnails.
    drawGraphic () {
        const bbox = this.bbox;

        // paint the background
        this.context.setTransform(1, 0, 0, 1, 0, 0);  // reset the transform, so repeated calls paint entire background
        this.context.fillStyle = '#C8C8E8';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // calculate node radius in cycleGraph units
        const max_cg_dimension = Math.max(bbox.right - bbox.left, bbox.top - bbox.bottom);
        const pixels2cg = (val) => val * Math.min((bbox.right-bbox.left)/this.canvas.width, (bbox.top-bbox.bottom)/this.canvas.height);
        const bestSize = (r) => r*Math.max(10, 8 + 2.5*max_cg_dimension/this.closestTwoPositions, 200/r); // min size = 200
        if (this.displays_labels) {
            this.radius = Math.min(this.closestTwoPositions/2.5, max_cg_dimension/10);
        } else {
            this.radius = pixels2cg(6 * this.canvas.width / bestSize(6));  // size for nodes in thumbnails
        }

        // set up scaling, translation from cycleGraph units to screen pixels
        // leave room around bbox for node radius + space (which we set to another node radius)
        const margin = 2 * this.radius;
        // canvas / bbox ratio
        const raw_scale = Math.min(this.canvas.width / (bbox.right - bbox.left + 2 * margin),
                                   this.canvas.height / (bbox.top - bbox.bottom + 2 * margin) );
        // scale with zoom
        let scale = this.zoomFactor * raw_scale;

        // translate center of scaled bbox to center of canvas
        let x_translate = (this.canvas.width - scale*(bbox.right + bbox.left))/2;
        let y_translate = (this.canvas.height - scale*(bbox.top + bbox.bottom))/2;

        // algorithm doesn't cover trivial group, treat it specially
        if (this.group.order == 1) {
            const sideLength = Math.min(this.canvas.width, this.canvas.height);
            this.radius = sideLength / 10;
            scale = this.zoomFactor * sideLength / (sideLength + 4 * this.radius);
            x_translate = this.canvas.width / 2;
            y_translate = this.canvas.height / 2;
        }

        // set transform to include translation generated by user drag-and-drop
        this.context.setTransform(scale, 0, 0, scale, x_translate + this.translate.dx, y_translate + this.translate.dy);

        // transform used to position the labels in screen space
        //   calculated even if we don't render labels because they're too small,
        //   since select method also uses this to determine element from node click
        this.transform.set(scale, 0,     x_translate + this.translate.dx,
                           0,     scale, y_translate + this.translate.dy,
                           0,     0,     1);
        // calculate the pre_image of the screen, in order to skip drawing labels on nodes not in view
        const upper_left = new THREE.Vector2(0, 0).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const lower_right = new THREE.Vector2(this.canvas.width, this.canvas.height).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const pre_image = {minX: upper_left.x, minY: upper_left.y, maxX: lower_right.x, maxY: lower_right.y};

        // draw all the paths first, because they're behind the vertices
        this.context.lineWidth = 1/scale;
        this.context.strokeStyle = '#000';
        this.cyclePaths.forEach( points => {
            var isDrawing = true; // was the last
            this.context.beginPath();
            points.pts.forEach( ( point, index ) => {
                // is the current point in the view?
                var pointVisible = point.x > pre_image.minX && point.x < pre_image.maxX
                    && point.y > pre_image.minY && point.y < pre_image.maxY;
                if ( index == 0 ) {
                    // always move to the start of the path
                    this.context.moveTo( point.x, point.y );
                } else if ( isDrawing ) {
                    // the entire line segment from index-1 to index is visible; draw it,
                    // and you can assume that we already did lineTo() the last point.
                    this.context.lineTo( point.x, point.y );
                } else if ( pointVisible ) {
                    // the previous point was out of view but this one is in view; draw it,
                    // but you can't assume that we already did lineTo() the last point.
                    var prev = points.pts[index-1];
                    this.context.moveTo( prev.x, prev.y );
                    this.context.lineTo( point.x, point.y );
                }
                // update isDrawing to reflect whether the last drawn point was in the view
                isDrawing = pointVisible;
            } );
            this.context.stroke();
        } );

        // draw all elements as vertices, on top of the paths we just drew
        this.positions.forEach( ( pos, elt ) => {
            // skip nodes that are off screen
            if ( pos.x + this.radius < pre_image.minX || pos.x - this.radius > pre_image.maxX
                 || pos.y + this.radius < pre_image.minY || pos.y - this.radius > pre_image.maxY )
                return;
            // draw the background, defaulting to white, but using whatever
            // highlighting information for backgrounds is in the cycleGraph
            this.context.beginPath();
            this.context.arc( pos.x, pos.y, this.radius, 0, 2 * Math.PI );
            if ( this.highlights && this.highlights.background
                 && this.highlights.background[elt] ) {
                this.context.fillStyle = this.highlights.background[elt].toString();
            } else {
                this.context.fillStyle = '#fff';
            }
            this.context.fill();

            // over the background, only if there is "top"-style highlighting,
            // draw a little cap on the top of the vertex's circle
            if ( this.highlights && this.highlights.top
                 && this.highlights.top[elt] ) {
                this.context.beginPath();
                this.context.arc( pos.x, pos.y, this.radius, -3*Math.PI/4, -Math.PI/4 );
                this.context.fillStyle = this.highlights.top[elt].toString();
                this.context.fill();
            }

            // draw the border around the node, defaulting to thin black,
            // but using whatever highlighting information for borders is
            // in the cycleGraph, and if it's there, making it thick
            this.context.beginPath();
            this.context.arc( pos.x, pos.y, this.radius, 0, 2 * Math.PI );
            if ( this.highlights && this.highlights.border
                 && this.highlights.border[elt] ) {
                this.context.strokeStyle = this.highlights.border[elt].toString();
                this.context.lineWidth = 5/scale;
            } else {
                this.context.strokeStyle = '#000';
                this.context.lineWidth = 1/scale;
            }
            this.context.stroke();
        } );

        // all done except for labels
        if (!this.displays_labels) {
            return;
        }

        // pick sensible font size and style for node labels
        // find longest rep, find it's size in 14pt font, and choose a font size that lets rep fit within the default node
        // (this is done in screen coordinates because scaling text from cycleGraph coordinates had too many gotchas -- rwe)
        this.context.setTransform(1,0,0,1,0,0);
        this.context.font = '14pt Arial';
        const longest_label_length = this.context.measureText(this.group.longestLabel).width;

        // "1" is to make short, tall names (like g^2) fit heightwise
        // "22" is a magic number that combines diameter/radius, effect of curved edges, point/pixel ratio, etc.
        //   -- but don't make font bigger than 50pt in any case
        const fontScale = Math.min(50, scale * this.radius * Math.min(1, 22 / longest_label_length));

        // skip out if this font would be too small to see anyhow
        if (fontScale < 1.5) {
            return;
        }

        // now draw all the labels, skipping nodes outside of the pre_image
        this.context.font = `${fontScale.toFixed(6)}pt Arial`;
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillStyle = '#000';

        const pos_vector = new THREE.Vector2();
        this.positions.forEach( ( pos, elt ) => {
            // skip nodes that are off the screen
            if (   pos.x < pre_image.minX || pos.x > pre_image.maxX
                   || pos.y < pre_image.minY || pos.y > pre_image.maxY) {
                return;
            }

            // write the element name inside it
            const loc = pos_vector.set(pos.x, pos.y).applyMatrix3(this.transform);
            this.context.fillText( this.group.labels[elt], loc.x, loc.y );
        } );
    }

    // interface for zoom-to-fit GUI command
    reset() {
        this.queueShowGraphic();
        this.zoomFactor = 1;
        this.translate = {dx: 0, dy: 0};
    }

    // increase magnification proportional to its current value,
    zoomIn() {
        this._centeredZoom((1 + DEFAULT_ZOOM_STEP) - 1);
    }

    // decrease magnification in a way that allows you to zoom in and out and return to its original value
    zoomOut() {
        this._centeredZoom(1/(1 + DEFAULT_ZOOM_STEP) - 1);
    }

    zoom(factor /*: number */) {
        this._centeredZoom(factor -  1);
        return this;
    }

    // changing the translation keeps the center of the model centered in the canvas
    _centeredZoom(dZoom /*: float */) {
        this.queueShowGraphic();
        this.zoomFactor = this.zoomFactor * (1 + dZoom);
        this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
    }

    // deltaX, deltaY are in screen coordinates
    move(deltaX /*: float */, deltaY /*: float */) {
        this.queueShowGraphic();
        this.translate.dx += deltaX;
        this.translate.dy += deltaY;
        return this;
    }

    // given screen coordinates, returns element associated with node,
    //   or 'undefined' if not within one radius
    select(screenX /*: number */, screenY /*: number */) /*: void | groupElement */ {
        // compute cycleGraph coordinates from screen coordinates by inverting this.transform
        const cg_coords = new THREE.Vector2(screenX, screenY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const index = this.positions.findIndex( (pos) => {
            return Math.sqrt( Math.pow( pos.x - cg_coords.x, 2 ) + Math.pow( pos.y - cg_coords.y, 2 ) ) < this.radius
        } );
        return (index == -1) ? undefined : index;
    }

    // Be able to answer the question of where in the diagram any given element is drawn.
    // We answer in normalized coordinates, [0,1]x[0,1].
    unitSquarePosition(element /*: groupElement */) /*: {x: float, y: float} */ {
        const virtualCoords = new THREE.Vector3( this.positions[element].x,
                                                 this.positions[element].y, 0 ),
              // multiplying a transform by a vector does not translate it, unfortunately:
              untranslatedCanvasCoords = virtualCoords.applyMatrix3( this.transform ),
              // so we do the translation manually:
              translatedCanvasCoords = {
                  x: this.transform.elements[6] + untranslatedCanvasCoords.x,
                  y: this.transform.elements[7] + untranslatedCanvasCoords.y
              };
        return { x: translatedCanvasCoords.x / this.canvas.width,
                 y: translatedCanvasCoords.y / this.canvas.height };
    }

    // two serialization functions
    toJSON() /*: CycleGraphJSON */ {
        return {
            groupURL: this.group.URL,
            highlights: this.highlights,
        };
    }
    fromJSON(json /*: CycleGraphJSON */) {
        if (json.highlights != undefined)
            this.highlights = json.highlights;
    }

    
    get group () {
        return this._group;
    }

    set group (group /*: XMLGroup */) {
        this._group = group;
        this.layoutElementsAndPaths();
        this.findClosestTwoPositions();
        this.SOME_SETTING_NAME = SOME_SETTING_NAME;
        this.showGraphic();
    }

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
            if ( gcd( t, this.group.elementOrders[h] ) == 1 ) {
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

    layoutElementsAndPaths() {
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
                    return mutate(
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
                        var et = easeUp( t );
                        path.pts.push( {
                            x: interp( ring1.x, ring2.x, et ),
                            y: interp( ring1.y, ring2.y, et )
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
        this.queueShowGraphic();
        if ( !this.highlights ) this.highlights = { };
        this.highlights.background =
            this._partitionToColorArray( partition, 0 );
    }

    highlightByBorder(partition /*: Array<Array<groupElement>> */) {
        this.queueShowGraphic();
        if ( !this.highlights ) this.highlights = { };
        this.highlights.border =
            this._partitionToColorArray( partition, 120 );
    }

    highlightByTop(partition /*: Array<Array<groupElement>> */) {
        this.queueShowGraphic();
        if ( !this.highlights ) this.highlights = { };
        this.highlights.top =
            this._partitionToColorArray( partition, 240 );
    }

    clearHighlights() {
        this.queueShowGraphic();
        this.highlights = { };
    }
}


// gcd of two natural numbers
function gcd(n /*: number */, m /*: number */) /*: number */ { return m ? gcd( m, n % m ) : n; }

// ease-in-out curves, one going uphill from (0,0) to (1,1)
function easeUp(t /*: float */) /*: float */ {
    return ( Math.cos( ( 1 - t ) * Math.PI ) + 1 ) / 2;
}

// and another going downhill, from (0,1) to (1,0)
function easeDown(t /*: float */) /*: float */ { return 1 - easeUp( 1 - t ); }

// generic linear interpolation function
function interp(A /*: float */, B /*: float */, t /*: float */) /*: float */ { return ( 1 - t ) * A + t * B; }

// mutating a point in the upper half plane to sit within the arc
// defined by two given angles alpha and beta, pulled toward the
// center of that arc with a specific level of gravity, 0<=g<=1.
function mutate(x /*: float */, y /*: float */, alpha /*: float */, beta /*: float */, g /*: float */) /*: Coordinate */ {
    const r = Math.sqrt( x*x + y*y );
    const theta = Math.atan2( y, x );
    const theta2 = interp( alpha, beta, theta/Math.PI );
    const x2 = r * Math.cos( theta2 );
    const y2 = r * Math.sin( theta2 );
    const cx = Math.cos( ( alpha + beta ) / 2 ) / 2;
    const cy = Math.sin( ( alpha + beta ) / 2 ) / 2;
    return {
        x: interp( x2, cx, g ),
        y: interp( y2, cy, g )
    };
}


export function createUnlabelledCycleGraphView (options /*: CycleGraphOptions */) {
    const view = new CycleGraphView(options);
    view.displays_labels = false;
    return view;
}

export function createLabelledCycleGraphView (options /*: CycleGraphOptions */) {
    const view = new CycleGraphView(options);
    view.displays_labels = true;
    return view;
}
