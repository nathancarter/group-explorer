

class DisplayCycleGraph {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayCycleGraph');

      DisplayCycleGraph._setDefaults();
      
      if (options === undefined) {
         options = {};
      }

      let width = (options.width === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_WIDTH : options.width;
      let height = (options.height === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_HEIGHT : options.height;
      if (options.container !== undefined) {
         // take canvas dimensions from container (if specified), option, or default
         width = options.container.width();
         height = options.container.height();
      }
      this.canvas = $(`<canvas width="${width}" height="${height}">`)[0];
      options.container.append(this.canvas);
   }

   static _setDefaults() {
      DisplayCycleGraph.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayCycleGraph.DEFAULT_CANVAS_WIDTH = 100;
   }

   getImageURL(cycleGraph) {
      this.showSmallGraphic(cycleGraph);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   showSmallGraphic(cycleGraph) {
   }

   showLargeGraphic(cycleGraph) {
      const context = this.canvas.getContext('2d');
      context.fillStyle = 'rgba(0, 0, 0, 1.0)';
      context.font = '120pt Arial';
      context.fillText(cycleGraph, 200, 200);
   }
}
