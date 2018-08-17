
/*
 * Structure used to describe Cayley diagram, symmetry object to DrawDiagram
 */

class Diagram3D {
   constructor(nodes = [], lines = [], options) {
      this.nodes = nodes;
      this.lines = lines;
      this.background = 0xDDDDDD;
      this.zoomLevel = 1;
      this.lineWidth = 1;
      this.nodeScale = 1;
      this.fogLevel = 0;
      this.labelSize = 1;
      this.arrowheadPlacement = 1;

      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }

   setNodeColor(color) {
      this.nodes.forEach( (nd) => nd.color = color );
      return this;
   }

   setNodeLabels(labels) {
      this.nodes.forEach( (nd) => nd.label = labels[nd.element] );
      return this;
   }

   // assigns line color from colorArray based on userData value
   //   (i.e., ln1.userData == ln2.userData <=> ln1.color == ln2.color)
   setLineColorByUserData(colors) {
      const uniqueUserDataValues = Array.from(new Set(this.lines.map( (line) => line.userData )));
      uniqueUserDataValues.forEach( (uniqueValue, index) =>
         this.lines.forEach( (line) => { if (line.userData == uniqueValue) { line.color = colors[index] } } )
      )
      return this;
   }

   // Normalize scene: translate to centroid, radius = 1
   normalize() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      const radius = (squaredRadius == 0) ? 1 : 1/Math.sqrt(squaredRadius);  // in case there's only one element
      const xForm = (new THREE.Matrix4()).set(radius, 0,      0,      -centroid.x,
                                              0,      radius, 0,      -centroid.y,
                                              0,      0,      radius, -centroid.z,
                                              0,      0,      0,      1);
      this.nodes.forEach( (node) => node.point.applyMatrix4(xForm) );
      this.lines.forEach( (line) => line.vertices
                                        .forEach( (vertex) => {
                                           if (vertex.element === undefined) {
                                              vertex.point.applyMatrix4(xForm)
                                           }
                                        } ) );
   }
}

Diagram3D.Point = class Point {
   constructor(point) {
      this.point = (Array.isArray(point)) ? new THREE.Vector3(...point) : point;
   }
}

Diagram3D.Node = class Node extends Diagram3D.Point {
   constructor(element, point, options) {
      super(point);
      this.element = element;
      this.color = 0xDDDDDD;
      this.label = '';
      this.radius = undefined;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }
}

Diagram3D.Line = class Line {
   constructor(vertices, options) {
      this.vertices = vertices;
      this.color = 0xDDDDDD;
      this.arrow = true;
      this.userData = undefined;
      this.normal = undefined;
      this.arcOffset = undefined;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }
}
