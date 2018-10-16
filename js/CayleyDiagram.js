/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class CayleyDiagram {
   constructor(group) {
      this.group = group;
   }

   static _init() {
      CayleyDiagram.BACKGROUND_COLOR = 0xE8C8C8;
      CayleyDiagram.NODE_COLOR = 0x8c8c8c;
   }

   static generate(group, diagramName) {
      // const [nodes, lines] = (diagramName === undefined) ? gen._generate() : gen._fromGroup(diagramName);
      let nodes, lines;
      if (diagramName === undefined) {
         [nodes, lines] = new CayleyDiagram(group)._generate();
         lines.forEach( (line) => { line.vertices = line.vertices.map( (vertex) => nodes[vertex] ) } );
      } else {
         [nodes, lines] = new CayleyDiagram(group)._fromGroup(diagramName);
      }

      const hashPoint = (point) => (((10 + point.x)*10 + point.y)*10 + point.z)*10;
      const linesByEndpoints = new Map();
      lines.forEach( (line) => {
         const start = hashPoint(line.vertices[0].point);
         const end = hashPoint(line.vertices[1].point);
         const forwardHash = 100000*start + end;
         const reverseHash = 100000*end + start;
         if (linesByEndpoints.has(reverseHash)) {
            linesByEndpoints.get(reverseHash).arrow = false;
         } else {
            linesByEndpoints.set(forwardHash, line);
         }
      } );

      const diagram = new Diagram3D(nodes, [...linesByEndpoints.values()]);
      diagram.background = CayleyDiagram.BACKGROUND_COLOR;
      diagram.setNodeColor(CayleyDiagram.NODE_COLOR)
             .setLineColors();

      return diagram;
   }

   _fromGroup(diagramName) {
      const cayleyDiagram = this.group.cayleyDiagrams.find( (cd) => cd.name == diagramName );
      const nodes = cayleyDiagram.points.map( (point, element) => new Diagram3D.Node(element, point) );
      const lines =
         cayleyDiagram.arrows.reduce(
            (lines, arrow) =>
               this.group.elements.reduce(
                  (lines, element) => {
                     const start = nodes[element];
                     const end = nodes[this.group.mult(element, arrow)];
                     lines.push(new Diagram3D.Line([start, end], {userData: arrow}));
                     return lines;
                  },
                  lines ),
            []);
      return [nodes, lines];
   }

   _generate() {
      let nodes, lines, cosets;
      if (this.group.order == 1) {
         return this._genNull(0);
      }
      let generators = this.group.generators[0];

      const genOrders = generators.map(el => this.group.elementOrders[el]);
      const orderedGenerators = generators
         .slice()
         .sort((el1, el2) => this.group.elementOrders[el1] - this.group.elementOrders[el2])
      if (generators.length == 1) {
         cosets = this._getCosets(generators);
         [nodes, lines] = this._genCircle('xy', generators[0], cosets[0], this._genNull)(0)
      } else if (generators.length == 2) {
         if (   genOrders[0] * genOrders[1] == this.group.order
             && (   (genOrders[0] == 2 && genOrders[1] > 2)
                 || (genOrders[1] == 2 && genOrders[0] > 2) ) )
            {
               cosets = this._getCosets(orderedGenerators);
               [nodes, lines] =
                  this._genRotation('xy', orderedGenerators[1], cosets[1],
                                    this._genLine('x', orderedGenerators[0], cosets[0], this._genNull))(0);
            } else {
               if (genOrders[0] * genOrders[1] < this.group.order) {
                  orderedGenerators.reverse();
               }
               cosets = this._getCosets(orderedGenerators);
               [nodes, lines] =
                  this._genLine('x', orderedGenerators[1], cosets[1],
                                this._genLine('y', orderedGenerators[0], cosets[0], this._genNull))(0);
            }

         // these are flat, so set all normals to 'z' axis
         for (let i = 0; i < lines.length; i++) {
            const zAxis = new THREE.Vector3(0,0,1);
            if (lines[i].normal !== undefined) {
               lines[i].normal = zAxis;
            }
         }
      } else {
         cosets = this._getCosets(orderedGenerators);
         let fn = this._genNull,
             directions = ['z', 'y', 'x'];
         for (let i = 0; i < generators.length; i++) {
            fn = this._genLine(directions[i % 3], orderedGenerators[i], cosets[i], fn);
         }
         [nodes, lines] = fn(0);
      }

      nodes.sort((el1,el2) => el1.element - el2.element);
      return [nodes, lines];
   }

   _getCosets(gens) {
      const subGroups = [],
            cosets = [];

      // get subgroups
      for (let i = 0, curr = new BitSet(this.group.order); i < gens.length - 1; i++) {
         curr.set(gens[i]);
         for (let j = 0; j < this.group.subgroups.length; j++) {
            if (this.group.subgroups[j].members.contains(curr)) {
               curr = this.group.subgroups[j].members.clone();
               subGroups.push(curr);
               break;
            }
         }
      }
      subGroups.push(new BitSet(this.group.order).setAll());

      // get coset partitioning
      cosets.push(this.group.elementPowers[gens[0]].toArray());
      for (let i = 1; i < subGroups.length; i++) {
         const todo = subGroups[i].clone(),
               prev = subGroups[i-1],
               coset = [];
         cosets.push(coset);
         while (! todo.isEmpty()) {
            for (let j = 0; j < todo.len; j++) {
               // get first element of todo and put it in partition
               if (todo.isSet(j)) {
                  coset.push(j);
                  // for each product in element*prev clear setting in todo
                  for (let k = 0; k < prev.len; k++) {
                     if (prev.isSet(k)) {
                        todo.clear(this.group.multtable[j][k])
                     }
                  }
                  break;
               }
            }
         }
      }

      return cosets;
   }

   // just returns element at (0,0,0) so containing step can move to where it wants
   _genNull(startElement) {
      return [ [new Diagram3D.Node(startElement, new THREE.Vector3(0,0,0))], [] ];
   }

   // distributes elements along the line [-1,1]
   _genLine(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction, generator, coset, innerLoop) {
         return function(startElement) {
            Log.log('genLine');
            const directionVectors = {x: [1,0,0], y: [0,1,0], z: [0,0,1]},
                  normalVectors = {x: [0,1,0], y: [1,0,0], z: [1,0,0]},
                  directionVector = new THREE.Vector3(...directionVectors[direction]),
                  normalVector = new THREE.Vector3(...normalVectors[direction]),
                  numNodes = coset.length,
                  scale = 2/(3*numNodes - 1),
                  xScale = (new THREE.Matrix4()).makeScale(
                     ...(new THREE.Vector3(1,1,1)).add(
                        directionVector.clone().multiplyScalar(scale-1)).toArray()),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  lines = [],
                  nodes = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*i/numNodes - 3*(numNodes - 1)/(3*numNodes - 1),
                     xLate = (new THREE.Matrix4()).makeTranslation(
                        ...directionVector.clone().multiplyScalar(trans).toArray()),
                     xForm = xLate.multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop lines
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {             // for each group
               for (let j = 0; j < nodeGroupLength; j++) {  // for each element in a group
                  let currNode = nodeGroups[i][j].element,
                      nextNode = group.multtable[currNode][generator];
                  if (   numNodes > 2
                      && i == numNodes - 1
                      && nextNode == nodeGroups[0][j].element)
                     {
                        lines.push(new Diagram3D.Line([currNode, nextNode],
                                                      {userData: generator, normal: new THREE.Vector3(1,0,0)}));
                     } else {
                        lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                     }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }

   // distributes elements around a circle of radius 1 centered at [0,0]
   _genCircle(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction,  generator, coset, innerLoop) {
         return function (startElement) {
            Log.log('genCircle');
            const normalVectors = {xy: [0,0,1], yz: [1,0,0], xz: [0,1,0]},
                  normalVectorCoordinates = normalVectors[direction],
                  axis = normalVectorCoordinates[0] == 1 ? [0, 1, 0] :
                         (normalVectorCoordinates[1] == 1 ? [0, 0, 1] : [1, 0, 0]),
                  numNodes = coset.length,
                  normalVector = new THREE.Vector3(...normalVectorCoordinates),
                  plane = (new THREE.Vector3(1,1,1)).sub(normalVector),
                  scale = Math.sqrt(1 - Math.cos(2*Math.PI/numNodes))/2,
                  xScale = (new THREE.Matrix4()).scale(
                     plane.clone().multiplyScalar(scale/(scale+1)).add(normalVector.clone())),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  lines = [],
                  nodes = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*Math.PI*(1/4 - i/numNodes),
                     xLate = (new THREE.Matrix4()).makeTranslation(
                        ...(new THREE.Vector3(...axis))
                        .applyAxisAngle(normalVector, trans)
                        .multiplyScalar(1/(scale+1))
                        .toArray()),
                     xForm = xLate.multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop arcs
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {          // for each group
               for (let j = 0; j < nodeGroupLength; j++) {   // for each element in a group
                  const currNode = nodeGroups[i][j].element,
                        nextNode = group.multtable[currNode][generator];
                  if (group.elementOrders[generator] > 2) {
                     lines.push(new Diagram3D.Line([currNode, nextNode],
                                                   {userData: generator, normal: normalVector}));
                  } else {
                     lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                  }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }

   // distributes elements around a circle of radius 1 centered at [0,0]
   //   and rotates innerLoop product around center
   _genRotation(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction, generator, coset, innerLoop) {
         return function (startElement) {
            Log.log('genRotation');
            const normalVectors = {xy: [0,0,1], yz: [1,0,0], xz: [0,1,0]},
                  normalVectorCoordinates = normalVectors[direction],
                  axis = normalVectorCoordinates[0] == 1 ? [0, 1, 0] :
                         (normalVectorCoordinates[1] == 1 ? [0, 0, 1] : [1, 0, 0]),
                  numNodes = coset.length,
                  normalVector = new THREE.Vector3(...normalVectorCoordinates),
                  scale = Math.sqrt(1 - Math.cos(2*Math.PI/numNodes))/2,
                  xLate = (new THREE.Matrix4()).makeTranslation(
                     ...(new THREE.Vector3(...axis)).multiplyScalar(-1/(scale+1)).toArray()),
                  xScale = (new THREE.Matrix4()).makeScale(
                     ...(new THREE.Vector3(1, 1, 1)).multiplyScalar(scale/(scale+1))
                     .sub(normalVector.clone().multiplyScalar(-1/(scale+1))).toArray()),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  nodes = [],
                  lines = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*Math.PI*(-1/4 - i/numNodes),
                     xRot = (new THREE.Matrix4()).makeRotationAxis(normalVector, trans),
                     xForm = xRot.multiply(xLate).multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop arcs
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {          // for each group
               for (let j = 0; j < nodeGroupLength; j++) {   // for each element in a group
                  const currNode = nodeGroups[i][j].element,
                        nextNode = group.multtable[currNode][generator];
                  if (group.elementOrders[generator] > 2) {
                     lines.push(new Diagram3D.Line([currNode, nextNode],
                                                   {userData: generator, normal: normalVector}));
                  } else {
                     lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                  }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }
}

// initialize static variables
CayleyDiagram._init();
