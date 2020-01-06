// @flow
/*::
import DisplayMulttable from './DisplayMulttable.js';
import GEUtils from './GEUtils.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

import type {Tree} from './GEUtils.js';

export type Coloration = 'Rainbow' | 'Grayscale' | 'None';

export default
 */
class Multtable {
/*::
   static COLORATION: {[key: string]: Coloration};

   group: XMLGroup;
   elements: Array<groupElement>;
   separation: number;
   organizingSubgroup: number;
   _coloration: Coloration;
   _colors: ?Array<color>;
   backgrounds: void | Array<color>;
   borders: void | Array<color | void>;
   corners: void | Array<color | void>;
 */   
   constructor(group /*: XMLGroup */) {
      this.group = group;
      this.reset();
   }

   reset() {
      this.separation = 0;
      this.organizeBySubgroup(this.group.subgroups.length - 1);
      this.coloration = Multtable.COLORATION.RAINBOW;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroupIndex /*: number */) /*: Multtable */ {
      const subgroup = this.group.subgroups[subgroupIndex];
      this.elements = GEUtils.flatten(
         this.group.cosetsArray(GEUtils.flatten(this.group.closureArray(subgroup.generators)), false) );
      this.organizingSubgroup = subgroupIndex;
      this._colors = null;
      return this;
   }

   setSeparation (separation /*: number */) {
       this.separation = separation;
   }

   get colors() /*: Array<color> */ {
      let result;
      if (this.backgrounds != undefined) {
         result = this.backgrounds;
      } else if (this._colors != undefined) {
         result = this._colors;
      } else {
         const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);

         let fn;
         switch (this.coloration) {
         case Multtable.COLORATION.RAINBOW:
            fn = (inx) => GEUtils.fromRainbow(frac(inx, 100, 0)/100);
            break;
         case Multtable.COLORATION.GRAYSCALE:
            fn = (inx) => {
               const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
               return `rgb(${lev}, ${lev}, ${lev})`;
            };
            break;
         case Multtable.COLORATION.NONE:
            fn = (inx) => DisplayMulttable.BACKGROUND;
            break;
         }
      
         this._colors = result = (this.elements.map( (el,inx) => [inx, el] ) /*: Array<[number, groupElement]> */)
                                               .sort( ([_a, x], [_b, y]) => x - y )
                                               .map( ([inx,_]) => fn(inx) );
      }

      return result;
   }

   get coloration() /*: Coloration */ {
      return this._coloration;
   }
      
   set coloration(coloration /*: Coloration */) {
      this._coloration = coloration;
      this._colors = null;
   }

   get stride() /*: number */ {
      return (this.organizingSubgroup == undefined) ? this.group.order : this.group.subgroups[this.organizingSubgroup].order;
   }

   get size() /*: number */ {
      return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
   }

   swap(i /*: number */, j /*: number */) {
      // $FlowFixMe: Flow doesn't seem to understand this sort of deconstructing
      [this.elements[i], this.elements[j]] = [this.elements[j], this.elements[i]];
      this._colors = null;
   }

   position(index /*: number */) /*: void | number */ {
      return (index < 0 || index > this.group.order) ? undefined : index + this.separation * Math.floor(index/this.stride);
   }

   index(position /*: number */) /*: void | number */ {
      const inx = Math.floor(position - this.separation * Math.floor(position / (this.stride + this.separation)));
      return (inx < 0 || inx > this.group.order - 1) ? undefined : inx;
   }

   /*
    * Highlight routines
    *   if only one color is needed (a common case) make each highlight color different
    *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
    */
   highlightByBackground(elements /*: Array<Array<groupElement>> */) {
      const backgrounds = this.backgrounds = new Array(this.group.order).fill(DisplayMulttable.BACKGROUND);
      elements.forEach( (els, colorIndex) => {
         els.forEach( (el) => backgrounds[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
      } );
   }

   highlightByBorder(elements /*: Array<Array<groupElement>> */) {
      const borders = this.borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            els.forEach( (el) => borders[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
         } );
      }
   }

   highlightByCorner(elements /*: Array<Array<groupElement>> */) {
      const corners = this.corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            els.forEach( (el) => corners[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
         } );
      }
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
   }
}

Multtable.COLORATION = {RAINBOW: 'Rainbow', GRAYSCALE: 'Grayscale', NONE: 'None'};
