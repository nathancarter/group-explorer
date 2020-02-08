// @flow

/*
Flavors:
    is_minimal_view -- no labels, separation, highlights, pov

Controller interface:
    group (suppress drawing during construction?)
    separation
    organizeBySubgroup
    swap rows/columns
    coloration Rainbow/Grayscale/None
    highlight by Background/Border/Corner; clear
    pov -- zoom in/out, translate, recenter
    tooltip

Sheet functions:
    unitSquarePosition
    toJSON/fromJSON (putToJSON/setFromJSON)
*/

import GEUtils from './GEUtils.js';
import Log from './Log.js';
import {broadcastChange} from '../Multtable.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import type {Tree} from './GEUtils.js';
import {VizDisplay} from './SheetModel.js';

export type Coloration = 'rainbow' | 'grayscale' | 'none';

export type MulttableJSON = {
   groupURL: string,
   elements: Array<groupElement>,
   separation: number,
   organizingSubgroup: number,
   coloration: Coloration,
   highlights: {
      background: void | Array<color>,
      border: void | Array<color | void>,
      corner: void | Array<color | void>
   }
}

type MulttableViewOptions = {
   container?: JQuery,
   width?: number,
   height?: number,
};
*/

const DEFAULT_CANVAS_HEIGHT = 100;
const DEFAULT_CANVAS_WIDTH = 100;
const ZOOM_STEP = 0.1;
const MINIMUM_FONT = 2;
const DEFAULT_BACKGROUND = '#F0F0F0';

export class MulttableView /*:: implements VizDisplay<MulttableView, MulttableJSON> */ {
/*::
    is_minimal_view: boolean;

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    zoomFactor: number;
    translate: {dx: number, dy: number};
    transform: THREE.Matrix3;
    permutationLabels: void | Array<void | Array<string>>;

    _group: XMLGroup;
    elements: Array<groupElement>;
    _separation: number;
    organizingSubgroup: number;
    _coloration: Coloration;
    _colors: ?Array<color>;
    backgrounds: void | Array<color>;
    borders: void | Array<color | void>;
    corners: void | Array<color | void>;

    show_request: boolean;
 */
    constructor (options /*: MulttableViewOptions */ = {}) {
        // take canvas dimensions from container (if specified), option, or default
        let width, height;
        const container = options.container;
        if (container !== undefined) {
            width = container.width();
            height = container.height();
        } else {
            width = (options.width === undefined) ? DEFAULT_CANVAS_WIDTH : options.width;
            height = (options.height === undefined) ? DEFAULT_CANVAS_HEIGHT : options.height;
        }

        this.canvas = (($(`<canvas/>`)[0] /*: any */) /*: HTMLCanvasElement */);  // Narrowing for Flow
        this.setSize( width, height );
        this.context = this.canvas.getContext('2d');

        if (container != undefined) {
            container.append(this.canvas);
        }
        this.zoomFactor = 1;  // user-supplied scale factor multiplier
        this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
        this.transform = new THREE.Matrix3();  // current multtable -> screen transformation

        this.show_request = false;
    }

    get size () /*: {w: number, h: number} */ {
        return {w: this.canvas.width, h: this.canvas.height};
    }

    set size ({w, h} /*: {w: number, h: number} */) {
        if (this.canvas.width != w || this.canvas.height != h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.queueShowGraphic();
        }
    }

    getSize () /*: {w: number, h: number} */ {
        return this.size;
    }

    setSize (w /*: number */, h /*: number */){
        this.size = {w, h};
    }

    resize () {
        if (this.canvas.parentElement != undefined) {
            const $container = $(this.canvas.parentElement);
            this.size = {w: $container.width(), h: $container.height()};
        }
    }

    getImage () /*: Image */ {
        const image = new Image();
        image.src = this.canvas.toDataURL();
        return image;
    }

    showGraphic () {
        this.show_request = false;

        if (this.group == undefined)
            return;

        if (this.is_minimal_view) {
            this.drawSimpleView();
        } else {
            this.drawFullView();
        }

        broadcastChange();
    }

    queueShowGraphic () {
        if (!this.show_request) {
            this.show_request = true;
            setTimeout( () => this.showGraphic(), 0 );
        }
    }

    // Simple graphic has no grouping, no labels, fits canvas exactly
    drawSimpleView () {
        const frac = (inx, max) => Math.round(max * inx / this.group.order);
        const colors = this.colors;

        const width = this.canvas.width;
        const height = this.canvas.height;
        this.elements.forEach( (i,inx) => {
            this.elements.forEach( (j,jnx) => {
                this.context.fillStyle = (colors[this.group.mult(j,i)] || DEFAULT_BACKGROUND).toString();
                this.context.fillRect(frac(inx, width), frac(jnx, height), frac(inx+1, width), frac(jnx+1, height));
            } )
        } )
    }

    // Write order X order matrix to canvas
    //   Resize canvas make labels readable
    //     Find longest label; find length of longest label as drawn
    //     Estimate the maximum number of rows that can occur (if a permutation is continued over multiple rows)
    //       if longest row is a permutation, expect that it can be formatted into a roughly square box
    //     Size the box so that it is
    //       at least 3 times the height of all the rows
    //       at least 25% longer than the longest row divided by the maximum number of rows expected
    //   Draw each box
    //     Color according to row/column product
    //     Write label in center, breaking permutation cycle text if necessary
    //
    // Separation slider maps [0,full scale] => [0, multtable.size]
    drawFullView () {
        // note that background shows through in separations between cosets
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = DEFAULT_BACKGROUND;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // set up scaling, translation from multtable units to screen pixels
        const scale = this.zoomFactor * Math.min(this.canvas.width / this.table_size, this.canvas.height / this.table_size, 200);

        // translate center of scaled multtable to center of canvas
        let x_translate = (this.canvas.width - scale*this.table_size)/2;
        let y_translate = (this.canvas.height - scale*this.table_size)/2;
        this.context.setTransform(scale, 0, 0, scale, x_translate + this.translate.dx, y_translate + this.translate.dy);

        // find pre-image of screen so we don't iterate over elements that aren't displayed
        this.transform.set(scale, 0,     x_translate + this.translate.dx,
                           0,     scale, y_translate + this.translate.dy,
                           0,     0,     1);
        const UL = new THREE.Vector2(0, 0).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const LR = new THREE.Vector2(this.canvas.width, this.canvas.height).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const minX = this.index(UL.x) || 0;
        const minY = this.index(UL.y) || 0;
        const maxX = (this.index(LR.x) + 1) || this.group.order;
        const maxY = (this.index(LR.y) + 1) || this.group.order;

        for (let inx = minX; inx < maxX; inx++) {
            for (let jnx = minY; jnx < maxY; jnx++) {
                const x /*: number */ = this.position(inx) || 0;
                const y /*: number */ = this.position(jnx) || 0;

                const product = this.group.mult(this.elements[jnx], this.elements[inx]);

                // color box according to product
                this.context.fillStyle = (this.colors[product] || DEFAULT_BACKGROUND).toString();
                this.context.fillRect(x, y, 1, 1);

                // draw borders if cell has border highlighting
                if (this.borders != undefined && this.borders[product] != undefined) {
                    this._drawBorder(x, y, scale, this.borders[product]);
                }

                // draw corner if cell has corner highlighting
                if (this.corners !== undefined && this.corners[product] != undefined) {
                    this._drawCorner(x, y, scale, this.corners[product]);
                }
            }
        }

        // calculate font size to fit longest label
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.font = '14pt Arial';
        const longestLabelWidth =  this.context.measureText(this.group.longestLabel).width;
        const labelBoxWidth = (this.permutationLabels === undefined) ? longestLabelWidth : Math.sqrt(50*longestLabelWidth);
        const fontScale = Math.min(50, 11 * scale/labelBoxWidth, scale / 3);

        // don't render labels if font is too small
        if (fontScale < MINIMUM_FONT) {
            return;
        }

        this.context.font = `${fontScale.toFixed(6)}pt Arial`;
        this.context.textAlign = (this.permutationLabels === undefined) ? 'center' : 'left';
        this.context.fillStyle = 'black';
        this.context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

        for (let inx = minX; inx < maxX; inx++) {
            for (let jnx = minY; jnx < maxY; jnx++) {
                const x = this.position(inx) || 0;
                const y = this.position(jnx) || 0;
                const product = this.group.mult(this.elements[jnx], this.elements[inx]);
                this._drawLabel(x, y, product, scale, fontScale);
            }
        }
    }

    _drawBorder (x /*: number */, y /*: number */, scale /*: number */, color /*: color */) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = 2 / scale;
        this.context.moveTo(x, y+1-1/scale);
        this.context.lineTo(x, y);
        this.context.lineTo(x+1-1/scale, y);
        this.context.stroke();

        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 1 / scale;
        this.context.moveTo(x+2.5/scale, y+1-2.5/scale);
        this.context.lineTo(x+2.5/scale, y+2.5/scale);
        this.context.lineTo(x+1-2.5/scale, y+2.5/scale);
        this.context.lineTo(x+1-2.5/scale, y+1-2./scale);
        this.context.closePath();
        this.context.stroke();
    }

    _drawCorner (x /*: number */, y /*: number */, scale /*: number */, color /*: color */) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.moveTo(x, y);
        this.context.lineTo(x+0.2, y);
        this.context.lineTo(x, y+0.2);
        this.context.fill();
    }

    _drawLabel (x /*: number */, y /*: number */, element /*: number */, scale /*: number */, fontScale /*: number */) {
        const width = (text /*: string */) => (text === undefined) ? 0 : this.context.measureText(text).width;

        const label = this.group.labels[element];
        const permutationLabels = this.permutationLabels;
        if (permutationLabels === undefined) {
            const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
            this.context.fillText(label, labelLocation.x, labelLocation.y);
        } else {    // break permutations into multiple lines
            let permutationLabel = permutationLabels[element];
            if (permutationLabel === undefined) {   // seen this label before?
                // split whole label into multiple lines if needed
                const cycles = ((label.match(/[(][^)]*[)]/g) /*: any */) /*: RegExp$matchResult */);
                const lines /*: Array<string> */ = [];
                let last = 0;
                for (const cycle of cycles) {
                    if (width(lines[last]) + width(cycle) < 0.8 * scale) {
                        lines[last] = (lines[last] == undefined) ? cycle : lines[last].concat(cycle);
                    } else {
                        if (lines[last] != undefined) {
                            last++;
                        }
                        if (width(cycle) < 0.8 * scale) {
                            lines[last] = cycle;
                        } else {
                            // cut cycle up into row-sized pieces
                            const widthPerCharacter = width(cycle) / cycle.length;
                            const charactersPerLine = Math.ceil(0.8 * scale / widthPerCharacter);
                            for (let c = cycle;;) {
                                if (width(c) < 0.8 * scale) {
                                    lines[last++] = c;
                                    break;
                                } else {
                                    lines[last++] = c.slice(0, c.lastIndexOf(' ', charactersPerLine));
                                    c = c.slice(c.lastIndexOf(' ', charactersPerLine)).trim();
                                }
                            }
                        }
                    }
                }

                // store multi-line permutation label so it doesn't have to be calculated again
                permutationLabels[element] = permutationLabel = lines;
            }

            const fontHeight = fontScale * 19 / 14;
            const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
            const maxLineWidth = permutationLabel.reduce( (max, line /*: string */) => Math.max(max, width(line)), 0 );
            let xStart = labelLocation.x - maxLineWidth/2;
            let yStart = labelLocation.y - fontHeight*(permutationLabel.length - 1)/2;
            for (const line /*: string */ of permutationLabel) {
                this.context.fillText(line, xStart, yStart);
                yStart += fontHeight;
            }
        }
    }

    // interface for zoom-to-fit GUI command
    resetZoom () {
        this.queueShowGraphic();
        this.zoomFactor = 1;
        this.translate = {dx: 0, dy: 0};
    }

    // increase magnification proportional to its current value,
    zoomIn () {
        this.queueShowGraphic();
        this._centeredZoom((1 + ZOOM_STEP) - 1);
    }

    // decrease magnification in a way that allows you to zoom in and out and return to its original value
    zoomOut () {
        this.queueShowGraphic();
        this._centeredZoom(1/(1 + ZOOM_STEP) - 1);
    }

    zoom (factor /*: number */) {
        this.queueShowGraphic();
        this._centeredZoom(factor -  1);
        return this;
    }

    // changing the translation keeps the center of the model centered in the canvas
    _centeredZoom (dZoom /*: number */) {
        this.zoomFactor = this.zoomFactor * (1 + dZoom);
        this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
    }

    // deltaX, deltaY are in screen coordinates
    move (deltaX /*: number */, deltaY /*: number */) {
        this.queueShowGraphic();
        this.translate.dx += deltaX;
        this.translate.dy += deltaY;
        return this;
    }

    // Compute Multtable 0-based row, column from canvas-relative screen coordinates by inverting this.transform
    //   returns null if point is outside Multtable
    xy2rowXcol (canvasX /*: number */, canvasY /*: number */) /*: ?{row: number, col: number} */ {
        const mult = new THREE.Vector2(canvasX, canvasY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
        const x = this.index(mult.x);
        const y = this.index(mult.y);
        return (x == undefined || y == undefined) ? null : {col: x, row: y};
    }

    // Be able to answer the question of where in the diagram any given element is drawn.
    // We answer in normalized coordinates, [0,1]x[0,1].
    unitSquarePosition (element /*: number */) {
        const max = this.position( this.group.order - 1 ) + 1;
        const index = this.elements.indexOf( element );
        return { x: 0.5 / max, y: ( this.position( index ) + 0.5 ) / max };
    }

    ////////////////////////////////////////////////////////////////////////////////

    get group () {
        return this._group;
    }
    
    set group (group /*: XMLGroup */) {
        if (this._group != group) {
            this._group = group;
            this.reset();
            this.showGraphic();
        }
    }

    reset() {
        this.permutationLabels = (this.group.longestLabel[0] == '(') ? Array(this.group.order) : undefined;
        this.separation = 0;
        this.organizeBySubgroup(this.group.subgroups.length - 1);
        this.coloration = 'rainbow';
        this.clearHighlights();
    }

    organizeBySubgroup (subgroupIndex /*: number */) {
        this.queueShowGraphic();
        const subgroup = this.group.subgroups[subgroupIndex];
        this.elements = GEUtils.flatten(
            this.group.cosetsArray(GEUtils.flatten(this.group.closureArray(subgroup.generators)), false) );
        this.organizingSubgroup = subgroupIndex;
        this._colors = null;
    }

    get separation () {
        if (this._separation == undefined) {
            this._separation = 0;
        }
        return this._separation;
    }

    set separation (separation /*: number */) {
        this.queueShowGraphic();
        this._separation = separation;
    }

    get colors () /*: Array<color> */ {
        let result;
        if (this.backgrounds != undefined) {
            result = this.backgrounds;
        } else if (this._colors != undefined) {
            result = this._colors;
        } else {
            const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);

            let fn;
            switch (this.coloration) {
            case 'rainbow':
                fn = (inx) => GEUtils.fromRainbow(frac(inx, 100, 0)/100);
                break;
            case 'grayscale':
                fn = (inx) => {
                    const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
                    return `rgb(${lev}, ${lev}, ${lev})`;
                };
                break;
            case 'none':
                fn = (inx) => DEFAULT_BACKGROUND;
                break;
            }
            
            this._colors = result = (this.elements.map( (el,inx) => [inx, el] ) /*: Array<[number, groupElement]> */)
                .sort( ([_a, x], [_b, y]) => x - y )
                .map( ([inx,_]) => fn(inx) );
        }

        return result;
    }

    get coloration () /*: Coloration */ {
        return this._coloration;
    }
    
    set coloration (coloration /*: Coloration */) {
        this.queueShowGraphic();
        this._coloration = coloration;
        this._colors = null;
    }

    get stride () /*: number */ {
        return (this.organizingSubgroup == undefined) ? this.group.order : this.group.subgroups[this.organizingSubgroup].order;
    }

    get table_size () /*: number */ {
        return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
    }

    swap (i /*: number */, j /*: number */) {
        this.queueShowGraphic();
        // $FlowFixMe: Flow doesn't understand this sort of deconstructing
        [this.elements[i], this.elements[j]] = [this.elements[j], this.elements[i]];
        this._colors = null;
    }

    position (index /*: number */) /*: void | number */ {
        return (index < 0 || index > this.group.order) ? undefined : index + this.separation * Math.floor(index/this.stride);
    }

    index (position /*: number */) /*: void | number */ {
        const inx = Math.floor(position - this.separation * Math.floor(position / (this.stride + this.separation)));
        return (inx < 0 || inx > this.group.order - 1) ? undefined : inx;
    }

    /*
     * Highlight routines
     *   if only one color is needed (a common case) make each highlight color different
     *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
     */
    highlightByBackground (elements /*: Array<Array<groupElement>> */) {
        this.queueShowGraphic();
        const backgrounds = this.backgrounds = new Array(this.group.order).fill(DEFAULT_BACKGROUND);
        elements.forEach( (els, colorIndex) => {
            els.forEach( (el) => backgrounds[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
        } );
    }

    highlightByBorder (elements /*: Array<Array<groupElement>> */) {
        this.queueShowGraphic();
        const borders = this.borders = new Array(this.group.order).fill(undefined);
        if (elements.length == 1) {
            elements[0].forEach( (el) => borders[el] = 'hsl(120, 100%, 80%)' );
        } else {
            elements.forEach( (els, colorIndex) => {
                els.forEach( (el) => borders[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
            } );
        }
    }

    highlightByCorner (elements /*: Array<Array<groupElement>> */) {
        this.queueShowGraphic();
        const corners = this.corners = new Array(this.group.order).fill(undefined);
        if (elements.length == 1) {
            elements[0].forEach( (el) => corners[el] = 'hsl(240, 100%, 80%)' );
        } else {
            elements.forEach( (els, colorIndex) => {
                els.forEach( (el) => corners[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
            } );
        }
    }

    clearHighlights () {
        this.queueShowGraphic();
        this.backgrounds = undefined;
        this.borders = undefined;
        this.corners = undefined;
    }


    //////////////////////////////   JSON routines   //////////////////////////////

    // two serialization functions
    toJSON () /*: MulttableJSON */ {
        const tmp = {
            groupURL: this.group.URL,
            elements: Array.from(this.elements),
            separation: this.separation,
            organizingSubgroup: this.organizingSubgroup,
            coloration: this.coloration,
            highlights: {
                background: this.backgrounds,
                border: this.borders,
                corner: this.corners
            }
        };

        return tmp;
    }

    fromJSON (json /*: MulttableJSON */) {
        Object.keys(json).forEach( (name) => {
            switch (name) {
            case 'elements':		this.elements = json.elements;				break;
            case 'separation':		this.separation = json.separation;			break;
            case 'organizingSubgroup':	this.organizingSubgroup = json.organizingSubgroup;	break;
            case 'coloration':		this.coloration = json.coloration;			break;
            case 'highlights':		this.backgrounds = json.highlights.background;
					this.borders = json.highlights.border;
					this.corners = json.highlights.corner;			break;
            default:										break;
            }
        } );

        this.queueShowGraphic();
    }
}


// no labels, no separation, no zoom, no translate, no highlights
export function createMinimalMulttableView (options /*: MulttableViewOptions */) /*: MulttableView */ {
    const view = new MulttableView(options);
    view.is_minimal_view = true;
    return view;
}

export function createFullMulttableView (options /*: MulttableViewOptions */)  /*: MulttableView */ {
    const view = new MulttableView(options);
    view.is_minimal_view = false;
    return view;
}
