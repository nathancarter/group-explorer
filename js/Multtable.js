
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
      this.emitStateChange();
   }

   organizeBySubgroup(subgroup) {
      this.elements = [];
      const cosets = this.group.getCosets(subgroup.members);
      cosets.forEach( (coset) => this.elements.push(...coset.toArray()) );
      this.stride = subgroup.order;
      this.emitStateChange();
      return this;
   }

   setSeparation ( sep ) {
       this.separation = sep;
       this.emitStateChange();
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
      this.emitStateChange();
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
      this.emitStateChange();
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
      this.emitStateChange();
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
      this.emitStateChange();
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
      this.emitStateChange();
   }

   emitStateChange () {
      const myURL = window.location.href;
      const thirdSlash = myURL.indexOf( '/', 8 );
      const myDomain = myURL.substring( 0, thirdSlash > -1 ? thirdSlash : myURL.length );
      window.postMessage( this.toJSON(), myDomain );
   }

   toJSON () {
      return {
         groupURL : this.group.URL,
         separation : this.separation,
         colors : this._colors,
         stride : this.stride,
         elements : this.elements,
         backgrounds : this.backgrounds,
         borders : this.borders,
         corners : this.corners
      };
   }

   fromJSON ( json ) {
      this.separation = json.separation;
      this._colors = json.colors;
      this.stride = json.stride;
      this.elements = json.elements;
      this.backgrounds = json.backgrounds;
      this.borders = json.borders;
      this.corners = json.corners;
      var that = this;
      Library.getGroupFromURL( json.groupURL )
             .then( ( group ) => { that.group = group; } );
   }
}

Multtable._init();
