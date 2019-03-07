
/*
 * Structure used to describe Cayley diagram, symmetry object to DrawDiagram
 */

class Diagram3D {
   constructor(group, nodes = [], lines = [], options) {
      this.group = group;
      this.nodes = nodes;
      this.lines = lines;
      this.chunk = undefined;   // subgroup index for chunking
      this._right_multiplication = true;
      this.node_labels = group.representation;
      this.background = undefined;
      this.zoomLevel = 1;
      this.lineWidth = 10;
      this.nodeScale = 1;
      this.fogLevel = 0;
      this.labelSize = 1;
      this.arrowheadPlacement = 1;
      this.isGenerated = false;

      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }

   setNodeColor(color) {
      this._setNodeField('color', this.nodes.map( (node) => node.element ), color);
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setNodeLabels(labels = this.node_labels) {
      this.node_labels = labels;
      if (this.node_labels !== undefined) {
         this.nodes.forEach( (nd) => nd.label = this.node_labels[nd.element] );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   arrowMult(a,b) {
      return this._right_multiplication ? this.group.mult(a,b) : this.group.mult(b,a);
   }

   // set multiplication direction; change lines when changing direction
   set right_multiplication(right_multiplication) {
      if (this._right_multiplication != right_multiplication) {
         this._right_multiplication = right_multiplication;
         this.lines.forEach( (line) => {
            if (line.vertices.length == 2) {
               const product =   this.arrowMult(line.vertices[0].element, line.arrow);
               line.vertices[1] = this.nodes[product];
            }
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   // add a line from each element to arrow*element; set arrow in line
   // if arrow is Array, add all lines
   addLines(arrow) {
      this.group.elements.forEach( (el) => {
         const product = this.arrowMult(el, arrow);
         if (el == this.arrowMult(product, arrow)) {  // no arrows if bi-directional
            if (el < product) {  // don't add 2nd line if bi-directional
               this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]],
                                                  {arrow: arrow, arrowhead: false, style: this.nodes[arrow].lineStyle}))
            }
         } else {
            this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]],
                                               {arrow: arrow, arrowhead: true, style: this.nodes[arrow].lineStyle}))
         }
      } )
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   // remove all lines with indicated arrow; if arrow is undefined, remove all lines
   removeLines(arrow) {
      this.lines = (arrow === undefined) ? [] : this.lines.filter( (line) => line.arrow != arrow );
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setLineColors() {
      const arrows = Object.values(
         this.lines.reduce( (arrow_set, line) => (arrow_set[line.arrow] = line.arrow, arrow_set),
                            new Array(this.lines.length) ));
      const colors = Array.from({length: arrows.length},
                                (_, inx) => '#' + new THREE.Color(`hsl(${360*inx/arrows.length}, 100%, 20%)`).getHexString());
      this.lines.forEach( (line) => { line.color = colors[arrows.findIndex( (arrow) => arrow == line.arrow )] } );
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   deDupAndSetArrows() {
      const hash = (point) => (((10 + point.x)*10 + point.y)*10 + point.z)*10;
      const linesByEndpoints = new Map();
      this.lines.forEach( (line) => {
         const start = hash(line.vertices[0].point);
         const end = hash(line.vertices[1].point);
         const forwardHash = 100000*start + end;
         const reverseHash = 100000*end + start;
         if (linesByEndpoints.has(reverseHash)) {
            linesByEndpoints.get(reverseHash).arrowhead = false;
         } else {
            line.arrowhead = true;
            linesByEndpoints.set(forwardHash, line);
         }
      } );
      this.lines = Array.from(linesByEndpoints.values());
      if ( this.emitStateChange ) this.emitStateChange();
   }

   // Normalize scene: translate to centroid, radius = 1
   normalize() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      const scale = (squaredRadius == 0) ? 1 : 1/Math.sqrt(squaredRadius);  // in case there's only one element
      const translation_transform = (new THREE.Matrix4()).makeTranslation(...centroid.multiplyScalar(-1).toArray());
      const xForm = (new THREE.Matrix4()).makeScale(scale, scale, scale).multiply(translation_transform);

      this.nodes.forEach( (node) => node.point.applyMatrix4(xForm) );
      this.lines.forEach( (line) => line.vertices
                                        .forEach( (vertex) => {
                                           if (vertex.element === undefined) {
                                              vertex.point.applyMatrix4(xForm)
                                           }
                                        } ) );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   get radius() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      return (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
   }

   _setNodeField(field, nodes, value) {
      nodes.forEach( (node) => this.nodes[node][field] = value );
   }

   highlightByNodeColor(elements) {
      this._setNodeField('colorHighlight', group.elements, undefined);
      elements.forEach( (els, colorIndex) => {
         const hue = 360 * colorIndex / elements.length;
         const color = `hsl(${hue}, 53%, 30%)`;
         this._setNodeField('colorHighlight', els, color);
      } );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   highlightByRingAroundNode(elements) {
      this._setNodeField('ringHighlight', group.elements, undefined);
      if (elements.length == 1) {
         this._setNodeField('ringHighlight', elements[0], 'hsl(120, 53%, 30%)');
      } else {
         elements.forEach( (els, colorIndex) => {
            const hue = 360 * colorIndex / elements.length;
            const color = `hsl(${hue}, 53%, 30%)`;
            this._setNodeField('ringHighlight', els, color);
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
   }

   highlightBySquareAroundNode(elements) {
      this._setNodeField('squareHighlight', group.elements, undefined);
      if (elements.length == 1) {
         this._setNodeField('squareHighlight', elements[0], 'hsl(240, 53%, 30%)');
      } else {
         elements.forEach( (els, colorIndex) => {
            const hue = 360 * colorIndex / elements.length;
            const color = `hsl(${hue}, 53%, 30%)`;
            this._setNodeField('squareHighlight', els, color);
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
   }

   clearHighlights() {
      this._setNodeField('colorHighlight', group.elements, undefined);
      this._setNodeField('ringHighlight', group.elements, undefined);
      this._setNodeField('squareHighlight', group.elements, undefined);
      if ( this.emitStateChange ) this.emitStateChange();
   }
}


Diagram3D.STRAIGHT = 0;
Diagram3D.CURVED = 1;

Diagram3D.Point = class Point {
   constructor(point) {
      if (point === undefined) {
         this.point = new THREE.Vector3(0, 0, 0);
      } else if (Array.isArray(point)) {
         this.point = new THREE.Vector3(...point);
      } else {
         this.point = point;
      }
   }
}

Diagram3D.Node = class Node extends Diagram3D.Point {
   constructor(element, point, options) {
      super(point);
      this.element = element;
      this.color = 0xDDDDDD;
      this.label = '';
      this.radius = undefined;
      this.lineStyle = Diagram3D.STRAIGHT;
      this.colorHighlight = undefined;
      this.ringHighlight = undefined;
      this.squareHighlight = undefined;
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
      this.color = undefined;
      this.arrowhead = true;
      this.arrow = undefined;
      this.offset = undefined;
      this.style = Diagram3D.STRAIGHT;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }

   get length() {
      const [length, _] = this.vertices.reduce( ([length, prev], vertex) => {
         if (prev === undefined) {
            return [length, vertex];
         } else {
            return [length + prev.point.distanceTo(vertex.point), vertex];
         }
      }, [0, undefined] );
      return length;
   }
}
