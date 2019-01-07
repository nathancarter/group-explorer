
class DisplayMulttable {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayMulttable');

      DisplayMulttable._setDefaults();

      if (options === undefined) {
         options = {};
      }
      this.options = options;

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      if (options.container !== undefined) {
         width = options.container.width();
         height = options.container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.canvas = $(`<canvas/>`)[0];
      this.setSize( width, height );
      this.context = this.canvas.getContext('2d');

      if (options.container !== undefined) {
         options.container.append(this.canvas);
      }
      this.zoom = 1;  // user-supplied scale factor multiplier
      this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
      this.transform = new THREE.Matrix3();  // current multtable -> screen transformation
   }

   setSize ( w, h ) {
      this.canvas.width = w;
      this.canvas.height = h;
   }
   getSize () {
      return { w : this.canvas.width, h : this.canvas.height };
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
      DisplayMulttable.ZOOM_STEP = 0.1;
      DisplayMulttable.MINIMUM_FONT = 2;
      DisplayMulttable.BACKGROUND = '#F0F0F0';
   }

   getImage(multtable,large) { // second parameter optional, defaults to small
      if ( large )
         this.showLargeGraphic(multtable);
      else
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
   // Separation slider maps [0,full scale] => [0, multtable.size]
   showLargeGraphic(multtable) {
      if (multtable != this.multtable) {
         this.multtable = multtable;
         this.permutationLabels = (multtable.group.longestLabel[0] == '(') ? Array(multtable.group.order) : undefined;
      }

      // note that background shows through in separations between cosets
      this.context.setTransform([1, 0, 0, 1, 0, 0]);
      this.context.fillStyle = DisplayMulttable.BACKGROUND;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // set up scaling, translation from multtable units to screen pixels
      const scale = this.zoom * Math.min(this.canvas.width / multtable.size, this.canvas.height / multtable.size, 200);

      // translate center of scaled multtable to center of canvas
      let x_translate = (this.canvas.width - scale*multtable.size)/2;
      let y_translate = (this.canvas.height - scale*multtable.size)/2;
      this.context.setTransform(scale, 0, 0, scale, x_translate + this.translate.dx, y_translate + this.translate.dy);

      // find pre-image of screen so we don't iterate over elements that aren't displayed
      this.transform.set(scale, 0,     x_translate + this.translate.dx,
                         0,     scale, y_translate + this.translate.dy,
                         0,     0,     1);
      const UL = new THREE.Vector2(0, 0).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const LR = new THREE.Vector2(this.canvas.width, this.canvas.height).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const minX = multtable.index(UL.x) || 0;
      const minY = multtable.index(UL.y) || 0;
      const maxX = (multtable.index(LR.x) + 1) || multtable.group.order;
      const maxY = (multtable.index(LR.y) + 1) || multtable.group.order;

      for (let inx = minX; inx < maxX; inx++) {
         for (let jnx = minY; jnx < maxY; jnx++) {
            const x = multtable.position(inx);
            const y = multtable.position(jnx);

            const product = multtable.group.mult(multtable.elements[inx], multtable.elements[jnx]);

            // color box according to product
            this.context.fillStyle = multtable.colors[product];
            this.context.fillRect(x, y, 1, 1);

            // draw borders if cell has border highlighting
            if (multtable.borders !== undefined && multtable.borders[product] !== undefined) {
               this._drawBorder(x, y, scale, multtable.borders[product]);
            }

            // draw corner if cell has corner highlighting
            if (multtable.corners !== undefined && multtable.corners[product] !== undefined) {
               this._drawCorner(x, y, scale, multtable.corners[product]);
            }
         }
      }

      // calculate font size to fit longest label
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.font = '14pt Arial';
      const longestLabelWidth =  this.context.measureText(multtable.group.longestLabel).width;
      const labelBoxWidth = (this.permutationLabels === undefined) ? longestLabelWidth : Math.sqrt(50*longestLabelWidth);
      const fontScale = Math.min(50, 11 * scale/labelBoxWidth, scale / 3);

      // don't render labels if font is too small
      if (fontScale < DisplayMulttable.MINIMUM_FONT) {
         return;
      }

      this.context.font = `${fontScale.toFixed(6)}pt Arial`;
      this.context.textAlign = (this.permutationLabels === undefined) ? 'center' : 'left';
      this.context.fillStyle = 'black';
      this.context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

      for (let inx = minX; inx < maxX; inx++) {
         for (let jnx = minY; jnx < maxY; jnx++) {
            const x = multtable.position(inx);
            const y = multtable.position(jnx);
            const product = multtable.group.mult(multtable.elements[inx], multtable.elements[jnx]);
            this._drawLabel(x, y, product, scale, fontScale);
         }
      }
   }

   _drawBorder(x, y, scale, color) {
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

   _drawCorner(x, y, scale, color) {
      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.moveTo(x, y);
      this.context.lineTo(x+0.2, y);
      this.context.lineTo(x, y+0.2);
      this.context.fill();
   }

   _drawLabel(x, y, element, scale, fontScale) {
      const width = (text) => (text === undefined) ? 0 : this.context.measureText(text).width;

      const label = this.multtable.group.labels[element];
      if (this.permutationLabels === undefined) {
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         this.context.fillText(label, labelLocation.x, labelLocation.y);
      } else {    // break permutations into multiple lines
         if (this.permutationLabels[element] === undefined) {   // seen this label before?
            const lines = [];

            // split whole label into multiple lines if needed
            const cycles = label.match(/[(][^)]*[)]/g);
            let last = 0;
            for (const cycle of cycles) {
               if (width(lines[last]) + width(cycle) < 0.8 * scale) {
                  lines[last] = (lines[last] === undefined) ? cycle : lines[last].concat(cycle);
               } else {
                  if (lines[last] !== undefined) {
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
            this.permutationLabels[element] = lines;
         }

         const fontHeight = fontScale * 19 / 14;
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         const permutationLabel = this.permutationLabels[element];
         const maxLineWidth = permutationLabel.reduce( (max, line) => Math.max(max, width(line)), 0 );
         let xStart = labelLocation.x - maxLineWidth/2;
         let yStart = labelLocation.y - fontHeight*(permutationLabel.length - 1)/2;
         for (const line of permutationLabel) {
            this.context.fillText(line, xStart, yStart);
            yStart += fontHeight;
         }
      }
   }

   // interface for zoom-to-fit GUI command
   reset() {
      this.zoom = 1;
      this.translate = {dx: 0, dy: 0};
   }

   // increase magnification proportional to its current value,
   zoomIn() {
      this._centeredZoom((1 + DisplayMulttable.ZOOM_STEP) - 1);
   }

   // decrease magnification in a way that allows you to zoom in and out and return to its original value
   zoomOut() {
      this._centeredZoom(1/(1 + DisplayMulttable.ZOOM_STEP) - 1);
   }

   // changing the translation keeps the center of the model centered in the canvas
   _centeredZoom(dZoom) {
      this.zoom = this.zoom * (1 + dZoom);
      this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
   }

   // deltaX, deltaY are in screen coordinates
   move(deltaX, deltaY) {
      this.translate.dx += deltaX;
      this.translate.dy += deltaY;
   }

   // given screen coordinates, returns element associated with box, or 'undefined'
   select(screenX, screenY) {
      // compute cycleGraph coordinates from screen coordinates by inverting this.transform
      const mult = new THREE.Vector2(screenX, screenY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const x = this.multtable.index(mult.x);
      const y = this.multtable.index(mult.y);
      return (x === undefined || y === undefined) ? undefined : {x: x, y: y};
   }

   // two serialization functions
   toJSON ( multtable ) {
      return {
         groupURL : multtable.group.URL,
         separation : multtable.separation,
         colors : multtable._colors,
         stride : multtable.stride,
         elements : multtable.elements,
         backgrounds : multtable.backgrounds,
         borders : multtable.borders,
         corners : multtable.corners
      };
   }
   fromJSON ( json, multtable ) {
      multtable.separation = json.separation;
      multtable._colors = json.colors;
      multtable.stride = json.stride;
      multtable.elements = json.elements;
      multtable.backgrounds = json.backgrounds;
      multtable.borders = json.borders;
      multtable.corners = json.corners;
      Library.getGroupFromURL( json.groupURL )
             .then( ( group ) => { multtable.group = group; } );
   }
}
