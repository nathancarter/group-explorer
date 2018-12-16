
class Multtable {
   constructor(group) {
      this.group = group;
      this.reset();
   }

   static _init() {
      Multtable.COLORATION_RAINBOW = 'Rainbow';
      Multtable.COLORATION_GRAYSCALE = 'Grayscale';
      Multtable.COLORATION_NONE = 'None';
   }

   reset() {
      this.elements = this.group.elements.slice();
      this.separation = 0;
      this.colors = Multtable.COLORATION_RAINBOW;
      this.stride = this.group.order;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroup) {
      this.elements = [];
      const cosets = this.group.getCosets(subgroup.members);
      cosets.forEach( (coset) => this.elements.push(...coset.toArray()) );
      this.stride = subgroup.order;
      return this;
   }

   get colors() {
      return this.backgrounds || this._colors;
   }

   set colors(coloration) {
      const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);
      let fn;
      switch (coloration) {
         case Multtable.COLORATION_RAINBOW:
            fn = (inx) => `hsl(${frac(inx, 360, 0)}, 100%, 80%)`;
            break;
         case Multtable.COLORATION_GRAYSCALE:
            fn = (inx) => {
               const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
               return `rgb(${lev}, ${lev}, ${lev})`;
            };
            break;
         case Multtable.COLORATION_NONE:
            fn = (inx) => DisplayMulttable.BACKGROUND;
            break;
      }
      this._colors = this.group.elements.map( (_, inx) => fn(inx) );
   }

   get size() {
      return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
   }

   position(index) {
      return (index < 0 || index > this.group.order) ? undefined : index + this.separation * Math.floor(index/this.stride);
   }

   index(position) {
      const inx = Math.floor(position - this.separation * Math.floor(position / (this.stride + this.separation)));
      return (inx < 0 || inx > this.group.order - 1) ? undefined : inx;
   }

   /*
    * Highlight routines
    *   if only one color is needed (a common case) make each highlight color different
    *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
    */
   highlightByBackground(elements) {
      this.backgrounds = new Array(this.group.order).fill(DisplayMulttable.BACKGROUND);
      elements.forEach( (els, colorIndex) => {
         const colorFraction = Math.round(360 * colorIndex / elements.length);
         const color = `hsl(${colorFraction}, 100%, 80%)`;
         els.forEach( (el) => this.backgrounds[el] = color );
      } );
   }

   highlightByBorder(elements) {
      this.borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this.borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this.borders[el] = color );
         } );
      }
   }

   highlightByCorner(elements) {
      this.corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this.corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         this.corners = new Array(this.group.order).fill(undefined);
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this.corners[el] = color );
         } );
      }
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
   }
}

Multtable._init();
