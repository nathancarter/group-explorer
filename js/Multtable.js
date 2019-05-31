// @flow
/*::
import DisplayMulttable from './DisplayMulttable.js';
import GEUtils from './GEUtils.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

type Coloration = 'Rainbow' | 'Grayscale' | 'None';

export default
 */
class Multtable {
/*::
   static COLORATIONS: {[key: string]: Coloration};

   group: XMLGroup;
   elements: Array<groupElement>;
   separation: number;
   _coloration: Coloration;
   _colors: void | Array<string>;
   stride: number;
   backgrounds: void | Array<color>;
   borders: void | Array<color | void>;
   corners: void | Array<color | void>;
 */   
   constructor(group /*: XMLGroup */) {
      this.group = group;
      this.reset();
   }

   reset() {
      this.elements = GEUtils.flatten_el(
         this.group.cosetsArray(GEUtils.flatten_el(this.group.closureArray(this.group.generators[0])), false));
      this.separation = 0;
      this.coloration = Multtable.COLORATIONS.RAINBOW;
      this.stride = this.group.order;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroup /*: Subgroup */) /*: Multtable */ {
      this.elements = GEUtils.flatten_el(
         this.group.cosetsArray(GEUtils.flatten_el(this.group.closureArray(subgroup.generators)), false) );
      this.stride = subgroup.order;
      return this;
   }

   setSeparation (sep /*: number */) {
       this.separation = sep;
   }

   get coloration() /*: Coloration */ {
      return this._coloration;
   }

   set coloration(coloration /*: Coloration */) {
      this._coloration = coloration;
      this._colors = undefined;
   }

   get colors() /*: Array<color> */ {
      let result;
      if (this.backgrounds !== undefined) {
         result = this.backgrounds;
      } else {
         if (this._colors === undefined) {
            const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);

            let fn;
            switch (this.coloration) {
               case Multtable.COLORATIONS.RAINBOW:
                  fn = (inx) => `hsl(${frac(inx, 360, 0)}, 100%, 80%)`;
                  break;
               case Multtable.COLORATIONS.GRAYSCALE:
                  fn = (inx) => {
                     const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
                     return `rgb(${lev}, ${lev}, ${lev})`;
                  };
                  break;
               case Multtable.COLORATIONS.NONE:
                  fn = (inx) => DisplayMulttable.BACKGROUND;
                  break;
            }

            this._colors = this.elements
                               .map( (el,inx) => [inx, el] )
                               .sort( ([_a, x], [_b, y]) => x - y )
                               .map( ([inx,_]) => fn(inx) );
         }
         result = this._colors;
      }

      return result;
   }

   get size() /*: number */ {
      return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
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
         const colorFraction = Math.round(360 * colorIndex / elements.length);
         const color = `hsl(${colorFraction}, 100%, 80%)`;
         els.forEach( (el) => backgrounds[el] = color );
      } );
   }

   highlightByBorder(elements /*: Array<Array<groupElement>> */) {
      const borders = this.borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => borders[el] = color );
         } );
      }
   }

   highlightByCorner(elements /*: Array<Array<groupElement>> */) {
      const corners = this.corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => corners[el] = color );
         } );
      }
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
   }
}

Multtable.COLORATIONS = {RAINBOW: 'Rainbow', GRAYSCALE: 'Grayscale', NONE: 'None'};
