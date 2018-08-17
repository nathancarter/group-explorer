

// can we change size of canvas?


class DisplayMulttable {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayMulttable');

      DisplayMulttable._setDefaults();
      
      if (options === undefined) {
         options = {};
      }

      if (options.container === undefined) {
         // take canvas dimensions from container (if specified), option, or default
         const width = (options.width === undefined) ? DisplayMulttable.DEFAULT_CANVAS_WIDTH : options.width;
         const height = (options.height === undefined) ? DisplayMulttable.DEFAULT_CANVAS_HEIGHT : options.height;
         this.canvas = $(`<canvas width="${width}" height="${height}">`)[0];
      } else {         
         this.container = options.container;
      }
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
   }

   getImageURL(multtable) {
      this.showSmallGraphic(multtable);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // use original size of canvas
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

   // Make order X order table
   //   Find largest representation, calculate #rows, chars/row, and row length * 1.5 to set box dimension
   //
   // Make table within table to organize by subgroup
   //
   // Slider 0-1 => 0-box width

   // Note width/height for Arial font:
   // from https://www.math.utah.edu/~beebe/fonts/afm-widths.html:
   // Font height is 1000 font design size in TeX big points:
   // FontName   Chars	Letters	    All	 Digits	  Upper	  Lower
   //   Arial     472  3 583.44	 537.37	 556.00	 677.42	 489.46
   
   // Or: draw directly on context
   // Or: draw to SVG

   showLargeGraphic(multtable) {
      const colors = this._colors(multtable);

      const labels = multtable.group.elements.map( (el) => mathml2html(multtable.group.representation[el]) );
      const maxLength = labels.reduce( (len,rep) => (rep.textContent.length > len) ? rep.textContent.length : len, 0 );
      let rows = 0;
      if (maxLength <= 10) {
         rows = 1;
      } else if (maxLength > 10 && maxLength <= 30) {
         rows = 2;
      } else if (maxLength > 30 && maxLength <= 50) {
         rows = 3;
      } else {
         rows = 4;
      }
//      const rows = Math.ceil(Math.sqrt(maxLength)/2);
      const font = 18;  // ~14pt
      const dim = Math.floor(font*Math.max(3*rows, 0.75*maxLength/rows));
      const order = multtable.group.order;
      const stride = multtable.stride;

      $('.bar, .outerTable').remove();
      $(`<style class="bar" type="text/css">
          .outerTable { 
             font: italic 16pt arial;
             width: ${dim*order + 2*multtable.separation*dim*order/stride};
             height: ${dim*order};
             border-collapse: collapse;
          }
         </style>`)
         .appendTo('head');
      $(`<style class="bar" type="text/css">
          .outerCell {
             padding: ${multtable.separation*dim};
             border-collapse: collapse;
          }
         </style>`)
         .appendTo('head');
      $(`<style class="bar" type="text/css">
          .innerTable {
             border-collapse: collapse;
          }
         </style>`)
         .appendTo('head'); 
      $(`<style class="bar" type="text/css">
          .innerCell {
              text-align: center;
              padding: 0;
              width: ${dim};
              height: ${dim};
          }
         </style>`)
         .appendTo('head');
      $(`<style class="bar" type="text/css">
          .txt {
              display: inline-block;
              text-align: left;
              padding: ${dim*0.16};
          }
         </style>`)
         .appendTo('head');

      const $outerTable = $('<table class="outerTable">');
      for (let ii = 0; ii < order/stride; ii++) { // for each coset
         const $outerRow = $('<tr>').appendTo($outerTable);
         for (let jj = 0; jj < order/stride; jj++) {
            const $outerCell = $('<td class="outerCell">').appendTo($outerRow);
            const $innerTable = $('<table class="innerTable">').appendTo($outerCell);
            for (let i = 0; i < stride; i++) {
               const $innerRow = $('<tr>').appendTo($innerTable);
               for (let j = 0; j < stride; j++) {
                  const r = multtable.elements[ii*stride + i],
                        c = multtable.elements[jj*stride + j];
                  const product = multtable.group.mult(r,c);
                  const color = colors[product];
                  const $div = $('<div class="txt">').append($(labels[product]).clone());
                  $(`<td id="${r}_${c}" class="innerCell" style="background-color: ${color}">`)
                     .append($div)
                     .appendTo($innerRow);
               }
            }
         }
      }
      $outerTable.appendTo(this.container);

         /*
         const $table = $('<table class="outerTable">');
      for (const r of multtable.elements) {
         const $row = $('<tr>').appendTo($table)
         for (const c of multtable.elements) {
            const product = multtable.group.mult(r,c);
            const color = colors[product];
            const $div = $('<div class="txt">').append($(labels[product]).clone());
            $(`<td id="${r}_${c}" class="cell" style="background-color: ${color}">`).append($div).appendTo($row);
         }
      }
      $table.appendTo(this.container);
      */
   }
}

/*

   mm = [];
   for (const group of Library.groups) {
   group.representations.forEach( (rep,inx) => {
   const mx = rep.reduce( (len, r) => Math.max(len, mathml2text(r).length), 0);
   mm.push([group.shortName, mx]);
   } );
   }
   mm.sort( ([_na,la],[_nb,lb]) => lb - la )

 */
