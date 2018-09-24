

class DisplayMulttable {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayMulttable');

      DisplayMulttable._setDefaults();
      
      if (options === undefined) {
         options = {};
      }

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      if (options.container !== undefined) {
         width = options.container.width();
         height = options.container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.canvas = $(`<canvas width="${width}" height="${height}">`)[0];

      if (options.container !== undefined) {
         options.container.append(this.canvas);
      }
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
      DisplayMulttable.BACKGROUND = '#F0F0F0';
      DisplayMulttable.DEFAULT_FONT = '14pt Arial';
      DisplayMulttable.DEFAULT_FONT_HEIGHT = 19;
   }

   getImageURL(multtable) {
      this.showSmallGraphic(multtable);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // Small graphic has no grouping, no labels, doesn't change canvas size
   showSmallGraphic(multtable) {
      const frac = (inx, max) => Math.floor(0.5 + inx * max / multtable.group.order);
      const colors = this._colors(multtable);

      const context = this.canvas.getContext('2d');
      const width = this.canvas.width;
      const height = this.canvas.height;
      multtable.elements.forEach( (i,inx) => {
         multtable.elements.forEach( (j,jnx) => {
            context.fillStyle = colors[multtable.group.mult(i,j)];
            context.fillRect(frac(inx, width), frac(jnx, height), frac(inx+1, width), frac(jnx+1, height));
         } )
      } )
   }

   _colors(multtable) {
      const frac = (inx, max, min) => {
         const _min = (min === undefined) ? 0 : min;
         return Math.floor(0.5 + _min + inx * (max - _min) / multtable.group.order);
      }
      switch(multtable.coloration) {
         case Multtable.COLORATION_RAINBOW:
            return multtable.group.elements.map( (el, inx) => `hsl(${frac(inx, 360)}, 100%, 80%)` )
         case Multtable.COLORATION_GRAYSCALE:
            // start from 40, not 0 (too dark and you can't see the label)
            return multtable.group.elements.map( (el, inx) => {
               const lev = frac(inx, 255, 40);
               return `rgb(${lev}, ${lev}, ${lev})`
            } )
         case Multtable.COLORATION_NONE:
         default:
            return new Array(multtable.group.order).fill('#ECECEC');
      }
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
   // Separation slider maps [0,1] => [0,boxSize]

   showLargeGraphic(multtable) {
      const font = DisplayMulttable.DEFAULT_FONT;
      const fontHeight = DisplayMulttable.DEFAULT_FONT_HEIGHT;

      const colors = this._colors(multtable);

      const context = this.canvas.getContext('2d');
      const measuredWidth = (str) => { context.font = font; return context.measureText(str).width };
      const isPermutation = (str) => str[0] == '(';

      const labels = multtable.group.elements.map( (el) => mathml2text(multtable.group.representation[el]) );
      const longestLabel = labels.reduce( (longest, label) => (label.length > longest.length) ? label : longest, '' );
      const longestLabelWidth = measuredWidth(longestLabel);
      const rowEstimate = isPermutation(longestLabel) ? Math.ceil(Math.sqrt(longestLabelWidth/fontHeight)/2) : 1;
      const boxSize = Math.floor(Math.max(3*fontHeight*rowEstimate, 1.25*longestLabelWidth/rowEstimate));

      const order = multtable.group.order;
      const stride = multtable.stride;

      const separation = multtable.separation*boxSize;
      const canvasSize = order*boxSize + (order/stride - 1)*separation;
      this.canvas.height = canvasSize;
      this.canvas.width = canvasSize;

      context.font = font;
      context.textAlign = 'left';       // fillText x coordinate is left-most end of string
      context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

      context.fillStyle = DisplayMulttable.BACKGROUND;  // background shows through in separations between cosets
      context.fillRect(0, 0, canvasSize, canvasSize);

      for (let inx = 0; inx < group.order; inx++) {
         for (let jnx = 0; jnx < group.order; jnx++) {
            const x = boxSize*inx + separation*Math.floor(inx/stride);  // skip separation between cosets as needed
            const y = boxSize*jnx + separation*Math.floor(jnx/stride);
            
            const product = multtable.group.mult(multtable.elements[inx], multtable.elements[jnx]);

            // color box according to product
            context.fillStyle = colors[product];
            context.fillRect(x, y, boxSize, boxSize);

            // write labels
            context.fillStyle = 'black';
            const label = labels[product];
            const rows = [];
            if (isPermutation(label)) {
               // this looks like a permutation -- they can be long, so split it into multiple lines if needed
               const cycles = label.match(/[(][^)]*[)]/g);
               let last = 0;
               for (const cycle of cycles) {
                  if (measuredWidth(rows[last]) == 0) {
                     rows.push(cycle);
                  } else if (measuredWidth(rows[last]) + measuredWidth(cycle) < 0.75*boxSize) {
                     rows[last] = rows[last].concat(cycle);
                  } else {
                     rows.push(cycle);
                     last++;
                  }
               }
            } else {
               rows[0] = label;
            }

            const maxRowWidth = rows.reduce( (max, row) => (max > measuredWidth(row)) ? max : measuredWidth(row), 0 );
            let xStart = x + boxSize/2 - maxRowWidth/2;
            let yStart = y + boxSize/2 - fontHeight*(rows.length - 1)/2;
            for (const row of rows) {
               context.fillText(row, xStart, yStart);
               yStart += fontHeight;
            }
         }
      }
   }
}


