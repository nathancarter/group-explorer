

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
      this.context = this.canvas.getContext('2d');

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
      const frac = (inx, max) => Math.round(max * inx / multtable.group.order);
      const colors = multtable._colors;

      const width = this.canvas.width;
      const height = this.canvas.height;
      multtable.elements.forEach( (i,inx) => {
         multtable.elements.forEach( (j,jnx) => {
            this.context.fillStyle = colors[multtable.group.mult(i,j)];
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
   // Separation slider maps [0,1] => [0,boxSize]
   showLargeGraphic(multtable) {
      this.context = this.canvas.getContext('2d');
      this.context.font = DisplayMulttable.DEFAULT_FONT;
      const fontHeight = DisplayMulttable.DEFAULT_FONT_HEIGHT;

      const labels = multtable.group.elements.map( (el) => mathml2text(multtable.group.representation[el]) );
      const longestLabel = labels.reduce( (longest, label) => (label.length > longest.length) ? label : longest, '' );
      const longestLabelWidth =  this._measuredWidth(longestLabel);
      const rowEstimate = this._isPermutation(longestLabel) ? Math.ceil(Math.sqrt(longestLabelWidth/fontHeight)/2) : 1;
      const boxSize = Math.floor(Math.max(3*fontHeight*rowEstimate, 1.25*longestLabelWidth/rowEstimate));

      const order = multtable.group.order;
      const stride = multtable.stride;

      const separation = multtable.separation*boxSize;
      const canvasSize = order*boxSize + (order/stride - 1)*separation;
      this.canvas.height = canvasSize;
      this.canvas.width = canvasSize;

      // note that background shows through in separations between cosets
      this.context.fillStyle = DisplayMulttable.BACKGROUND;
      this.context.fillRect(0, 0, canvasSize, canvasSize);

      this.context.font = DisplayMulttable.DEFAULT_FONT;
      this.context.textAlign = 'left';       // fillText x coordinate is left-most end of string
      this.context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

      for (let inx = 0; inx < group.order; inx++) {
         for (let jnx = 0; jnx < group.order; jnx++) {
            // be sure to skip the separation between cosets as needed
            const x = boxSize*inx + separation*Math.floor(inx/stride);
            const y = boxSize*jnx + separation*Math.floor(jnx/stride);

            const product = multtable.group.mult(multtable.elements[inx], multtable.elements[jnx]);

            // color box according to product
            this.context.fillStyle = multtable.colors[product];
            this.context.fillRect(x, y, boxSize, boxSize);

            // draw borders if cell has border highlighting
            if (multtable.borders !== undefined && multtable.borders[product] !== undefined) {
               this._drawBorder(x, y, boxSize, boxSize, multtable.borders[product]);
            }

            // draw corner if cell has corner highlighting
            if (multtable.corners !== undefined && multtable.corners[product] !== undefined) {
               this._drawCorner(x, y, boxSize, boxSize, multtable.corners[product]);
            }

            this._drawLabel(x, y, boxSize, boxSize, labels[product], fontHeight);
         }
      }
   }

   _drawBorder(x, y, width, height, color) {
      this.context.beginPath();
      this.context.strokeStyle = color;
      this.context.lineWidth = 2;
      this.context.moveTo(x, y+height-1);
      this.context.lineTo(x, y);
      this.context.lineTo(x+width-1, y);
      this.context.stroke();

      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 1;
      this.context.moveTo(x+2.5, y+height-2.5);
      this.context.lineTo(x+2.5, y+2.5);
      this.context.lineTo(x+width-2.5, y+2.5);
      this.context.lineTo(x+width-2.5, y+height-2.5);
      this.context.closePath();
      this.context.stroke();
   }

   _drawCorner(x, y, width, height, color) {
      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.moveTo(x, y);
      this.context.lineTo(x+0.2*width, y);
      this.context.lineTo(x, y+0.2*height);
      this.context.fill();
   }

   _drawLabel(x, y, width, height, label, fontHeight) {
      this.context.fillStyle = 'black';
      const rows = [];
      if (this._isPermutation(label)) {
         // this looks like a permutation --
         //    they can be long, so split it into multiple lines if needed
         const cycles = label.match(/[(][^)]*[)]/g);
         let last = 0;
         for (const cycle of cycles) {
            if (this._measuredWidth(rows[last]) + this._measuredWidth(cycle) < 0.75*width) {
               rows[last] = (rows[last] === undefined) ? cycle : rows[last].concat(cycle);
            } else {
               if (rows[last] !== undefined) {
                  last++;
               }
               if (this._measuredWidth(cycle) < 0.75*width) {
                  rows[last] = cycle;
               } else {
                  // cut cycle up into row-sized pieces
                  const widthPerCharacter = this._measuredWidth(cycle) / cycle.length;
                  const charactersPerRow = Math.ceil(0.75*width / widthPerCharacter);
                  for (let c = cycle;;) {
                     if (this._measuredWidth(c) < 0.75*width) {
                        rows[last++] = c;
                        break;
                     } else {
                        rows[last++] = c.slice(0, c.lastIndexOf(' ', charactersPerRow));
                        c = c.slice(c.lastIndexOf(' ', charactersPerRow)).trim();
                     }
                  }
               }
            }
         }
      } else {
         rows[0] = label;
      }

      const maxRowWidth = rows.reduce( (max, row) => (max > this._measuredWidth(row)) ? max : this._measuredWidth(row), 0 );
      let xStart = x + width/2 - maxRowWidth/2;
      let yStart = y + height/2 - fontHeight*(rows.length - 1)/2;
      for (const row of rows) {
         this.context.fillText(row, xStart, yStart);
         yStart += fontHeight;
      }
   }

   _measuredWidth(str) {
      return (str === undefined) ? 0 : this.context.measureText(str).width;
   }

   _isPermutation(str) {
      return str[0] == '(';
   }
}
