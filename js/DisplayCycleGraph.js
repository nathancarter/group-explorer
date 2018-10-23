

class DisplayCycleGraph {

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
      this.context = this.canvas.getContext('2d');
      this.options = options;
      if ( options.container !== undefined) {
         options.container.append(this.canvas);
      }
   }

   static _setDefaults() {
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_HEIGHT = 200;
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_WIDTH = 200;
      DisplayCycleGraph.DEFAULT_MIN_RADIUS = 30;
   }

   getImageURL(cycleGraph) {
      this.showSmallGraphic(cycleGraph);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // This function makes a small graphic by doing the exact same thing
   // it would do to create a large graphic, with one exception:
   // It passes an optional second parameter to that routine, so that
   // it hides all element names, thus making the vertices in the graph
   // much smaller, and thus the image itself much smaller as well.
   showSmallGraphic(cycleGraph) {
      this.showLargeGraphic( cycleGraph, true );
   }

   // Draws the visualization at an optimal (large) size.
   // All the data needed about the group and how to lay it out in the
   // plane has been computed at construction time by the cycleGraph
   // object, and we can leverage that here and just do drawing.
   // The second parameter, which defaults to true, says whether to omit
   // the names inside the elements.  (False == normal behavior, true
   // == a smaller graphic in the end, useful for thumbnails.)
   showLargeGraphic(cycleGraph, hideNames) {
      // save the cycle graph for use by other members of this object
      this.cycleGraph = cycleGraph;

      // compute ideal diagram size
      this.radius = this._minimumRadiusForNames();
      if ( hideNames ) this.radius = 6;
      var sideLength = this._bestCanvasSideLength( this.radius );
      if ( !this.options.width && !this.options.height ) {
         this.canvas.height = sideLength;
         this.canvas.width = sideLength;
      } else {
         this.radius *= this.canvas.width / sideLength;
      }

      // clear the background
      this.context.fillStyle = '#C8C8E8';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // set the font size and stuff
      this.context.font = '14pt Arial';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';

      // draw all the paths first, because they're behind the vertices
      cycleGraph.cyclePaths.forEach( points => {
         this.context.beginPath();
         points.forEach( ( point, index ) => {
            var x = this._canvasX( point );
            var y = this._canvasY( point );
            this.context[index == 0 ? 'moveTo' : 'lineTo']( x, y );
         } );
         this.context.lineWidth = 1;
         this.context.strokeStyle = '#000';
         this.context.stroke();
      } );

      // select the representation we will use to represent all elements
      var rep = cycleGraph.group.representations[
         cycleGraph.group.representationIndex];

      // draw all elements as vertices, on top of the paths we just drew
      cycleGraph.positions.forEach( ( pos, elt ) => {
         // draw the circle
         var x = this._canvasX( pos );
         var y = this._canvasY( pos );
         this.context.beginPath();
         this.context.arc( x, y, this.radius, 0, 2 * Math.PI );
         this.context.strokeStyle = '#000';
         this.context.stroke();
         this.context.fillStyle = '#fff';
         this.context.fill();
         // write the element name inside it
         var label = hideNames ? ' ' : mathml2text( rep[elt] );
         this.context.fillStyle = '#000';
         this.context.fillText( label, x, y );
      } );
   }

   // How big a margin should the image have?
   // Let's use, by default, the diameter of a node in the graph.
   // You can provide the node radius, or omit it and the currently
   // active radius for this diagram will be assumed.
   _margin( radius ) { return ( radius || this.radius ) * 2; }

   // Given a position (an object with x and y fields), return a
   // similar object, but with the values normalized to sit within
   // [0,1]^2.  They are normalized by using the bounding box for all
   // nodes and paths in the diagram, with the bottom left as (0,0)
   // and the top right as (1,1).
   _normalized( pos ) {
      var bbox = this.cycleGraph.bbox;
      return {
         x : ( bbox.right > bbox.left ) ?
             ( pos.x - bbox.left ) / ( bbox.right - bbox.left ) : 0,
         y : ( bbox.top > bbox.bottom ) ?
             ( pos.y - bbox.bottom ) / ( bbox.top - bbox.bottom ) : 0
      };
   }

   // Convert a position in the diagram into a position on the canvas.
   // These two routines handle the x and y components separately.
   // They first normalize the position as documented above the
   // _normalize() function, above, then they convert to pixel
   // dimensions, applying the margin given by _margin(), also
   // documented above.
   _canvasX( pos ) {
      return this._margin() + this._normalized( pos ).x *
         ( this.canvas.width - 2 * this._margin() );
   }
   _canvasY( pos ) {
      return this._margin() + ( 1 - this._normalized( pos ).y ) *
         ( this.canvas.height - 2 * this._margin() );
   }

   // Find the shortest distance between two vertices in the diagram,
   // expressed in the normalized coordinate system ([0,1]^2, as output
   // by the _normalize() function documented above).  This will help
   // us suggest the best size for the graph, as in the function that
   // follows this one, so as not to have overlapping vertices.
   _closestTwoPositions() {
      var dist = Infinity;
      this.cycleGraph.group.elements.forEach( ( g, i ) => {
         var pos1 = this._normalized( this.cycleGraph.positions[g] );
         this.cycleGraph.group.elements.forEach( ( h, j ) => {
            if ( g == h ) return;
            var pos2 = this._normalized( this.cycleGraph.positions[h] );
            dist = Math.min( dist, Math.sqrt(
                ( pos1.x - pos2.x ) * ( pos1.x - pos2.x )
              + ( pos1.y - pos2.y ) * ( pos1.y - pos2.y ) ) );
         } );
      } );
      return dist;
   }

   // Compute the best size for this diagram, assuming it will be
   // square, and thus we can yield a single number: its side length
   // (in pixels).  This is the smallest number that will let us write
   // the element names inside the vertices and still draw the vertices
   // non-overlapping.
   _bestCanvasSideLength( forThisRadius ) {
      var plusMar = ( x ) => x + 4 * this._margin( forThisRadius );
      var result = 2.5 * forThisRadius / this._closestTwoPositions();
      return Math.max( plusMar( result ),
                       plusMar( 2 * forThisRadius ),
                       DisplayCycleGraph.DEFAULT_MIN_CANVAS_WIDTH,
                       DisplayCycleGraph.DEFAULT_MIN_CANVAS_HEIGHT );
   }

   // Compute the smallest vertex radius that can be used in the graph
   // and still allow us to fit all the group elements' names inside
   // vertices of that radius.
   _minimumRadiusForNames() {
      var rep = this.cycleGraph.group.representations[
         this.cycleGraph.group.representationIndex];
      var biggest = 0;
      this.cycleGraph.group.elements.forEach( g => {
         biggest = Math.max( biggest,
            this.context.measureText( mathml2text( rep[g] ) ).width );
      } );
      return Math.max( DisplayCycleGraph.DEFAULT_MIN_RADIUS,
                       biggest + 10 );
   }
}
