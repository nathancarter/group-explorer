/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class CayleyDiagram extends Diagram3D {
   constructor(group, diagram_name) {
      super(group);
      this.background = CayleyDiagram.BACKGROUND_COLOR;
      this.strategies = [];

      this.isCayleyDiagram = true;
      this.diagram_name = diagram_name;
      this.isGenerated = (diagram_name === undefined);
      this._update();
   }

   getStrategies() {
      return this.strategies.map( (strategy) => [strategy.generator, strategy.layout, strategy.direction, strategy.nesting_level] );
   }

   setStrategies(strategy_parameter_array) {
      const param_array = strategy_parameter_array
         .map( (params) => { return {generator: params[0], layout: params[1], direction: params[2], nesting_level: params[3]} } );

      // check:  generators, layouts, directions are in range
      if (param_array.find( (params) => params.generator < 1 || params.generator >= this.group.order ) !== undefined)
         console.error('strategy generator out of range');
      if (param_array.find( (params) => params.layout < CayleyDiagram.LINEAR_LAYOUT || params.layout > CayleyDiagram.ROTATED_LAYOUT ) !== undefined)
         console.error('strategy layout out of range');
      if (param_array.find( (params) => params.direction < CayleyDiagram.X_DIRECTION || params.direction > CayleyDiagram.Z_DIRECTION ) !== undefined)
         console.error('strategy direction out of range');

      // check:  generate all the elements in the group
      if (this.group.closure(param_array.map( (params) => params.generator )).popcount() != this.group.order)
         console.error('strategy generators do not generate the entire group');

      // check:  nesting_levels are in range, complete, unique
      if (!Array.from({length: param_array.length}, (_,inx) => inx )
                ._equals(param_array.map( (params) => params.nesting_level ).sort( (a,b) => a - b )))
         console.error('strategy nesting levels are incomplete or redundant');

      // check:  can't use circular or rotary for subgroup of order 2
      if (param_array.find( (params) => this.group.elementOrders[params.generator] == 2 && params.layout != CayleyDiagram.LINEAR_LAYOUT) !== undefined)
         console.error('generator must have order > 2 when using circular or rotated layout');

      // check:  no empty nesting levels (should this really be needed?)


      this.strategies = strategy_parameter_array
         .map( (parameters) => CayleyDiagram.LayoutStrategy._createStrategy(...parameters) );

      this._update();
   }

   _update() {
      this.nodes = [];
      this.lines = [];
      if (this.isGenerated) {
         if (this.strategies.length == 0) {
            this._generateStrategy();
         } else {
            this._generateFromStrategy();
            this.normalize();
         }
      } else {
         this._generateFromGroup();
      }

      this.setNodeColor(CayleyDiagram.NODE_COLOR)
          .setNodeLabels()
          .setLineColors();
      this.emitStateChange();
   }

   _generateFromGroup() {
      const cayleyDiagram = this.group.cayleyDiagrams.find( (cd) => cd.name == this.diagram_name );
      this.nodes = cayleyDiagram.points.map(
         (point, element) => new Diagram3D.Node(element, point, {lineStyle: Diagram3D.STRAIGHT}));
      cayleyDiagram.arrows.forEach( (arrow) => this.addLines(arrow) );
      this.emitStateChange();
   }

   _generateFromStrategy() {
      const node_list = this._generateNodes(this.strategies);
      this.ordered_nodes = this._transposeNodes(node_list);

      this.nodes = this._layout(this.ordered_nodes)
                       .sort( (a,b) => a.element - b.element );

      // makes lines for generators
      this.strategies.forEach( (strategy) => this.addLines(strategy.generator) );
      this.emitStateChange();
   }

   _generateNodes(strategies) {
      const generators = this.strategies.map( (strategy) => strategy.generator );

      const node_list = strategies.reduce( (nodes, strategy, inx) => {
         [nodes, strategies[inx].bitset] = this._extendSubgroup(nodes, generators.slice(0, inx+1));
         return (inx == 0) ? nodes._flatten() : nodes;
      }, [0]);

      this.emitStateChange();
      return node_list;
   }

   _extendSubgroup(H_prev, generators) {
      const deepMultiply = (g, arr) => {
         if (Array.isArray(arr)) {
            return arr.map( (el) => deepMultiply(g, el) );
         } else {
            const prod = this.group.mult(g, arr);
            result_bitset.set(prod);
            return prod;
         }
      }

      const new_generator = generators[generators.length - 1];
      const result = [H_prev];
      const result_bitset = new BitSet(this.group.order, H_prev._flatten());
      Array.from({length: this.group.elementOrders[new_generator]})
           .reduce( (cycle) => (cycle.push(this.group.mult(cycle._last(), new_generator)), cycle), [0])
           .forEach( (el) => {
              if (!result_bitset.isSet(el)) {
                 result.push(deepMultiply(el, H_prev))
              }
           } );

      for (let inx = 1; inx < result.length; inx++) {
         let rep;
         const stmt = `rep = result[${inx}]` + Array(generators.length - 1).fill('[0]').join('');
         eval(stmt);
         for (const generator of generators) {
            const prod = this.group.mult(generator, rep);
            if (!result_bitset.isSet(prod)) {
               const coset = deepMultiply(prod, H_prev);
               result.push(coset);
            }
         }
      }

      return [result, result_bitset];
   }

   _transposeNodes(node_list) {
      const copyPush = (arr, el) => {
         const result = arr.slice();
         result.push(el);
         return result;
      };

      // index transformation
      const gen2nest = this.strategies.map( (_, index) => this.strategies.findIndex( (s) => s.nesting_level == index) );

      // allocate transpose according to space used in node_list
      const transpose_allocations = this.strategies
                                        .map( (_,inx) => eval('node_list' + Array(inx).fill('[0]').join('') + '.length') )
                                        .map( (_,inx,arr) => arr[gen2nest[inx]] );
      const makeEmpty =
         (transpose_index = 0) => (transpose_index == transpose_allocations.length - 1) ? [] :
                                Array(transpose_allocations[transpose_index]).fill().map( (_) => makeEmpty(transpose_index + 1) );

      // traverse node_list, inserting new Diagram3D.Node into transpose
      const traverse = (nodes, indices = []) => {
         if (indices.length == this.strategies.length) {
            const line_style = indices.every(
               (index, strategy_index) => index == 0 || this.strategies[this.strategies.length - strategy_index - 1].layout == CayleyDiagram.LINEAR_LAYOUT
            ) ? Diagram3D.STRAIGHT : Diagram3D.CURVED;
            const stmt = 'result' +
                         indices.map( (_,inx) => `[${indices[gen2nest[inx]]}]` ).join('') +
                         ` = new Diagram3D.Node(${nodes}, undefined, {lineStyle: ${line_style}})`;
            eval(stmt);
         } else {
            nodes.forEach( (el,inx) => { traverse(el, copyPush(indices, inx)) } );
         }
      }

      // now actually do the work
      const result = makeEmpty();
      traverse(node_list);

      return result;
   }

   _layout(nested_nodes,
           nested_strategies = this.strategies.slice().sort( (a,b) => a.nesting_level - b.nesting_level )) {

      if (nested_strategies.length == 0) {
         return [nested_nodes];
      } else {
         const strategy = nested_strategies.pop();
         const child_results = [...nested_nodes.map( (children) => this._layout(children, nested_strategies) )]
         nested_strategies.push(strategy);
         const layout_results = strategy._layout(child_results);
         return layout_results._flatten();
      }
   }

   /* routine to generate default strategy
    *   Special cases:
    *      group is order = 1 => draw a single node
    *      group is order = 2 => linear (just two nodes)
    *
    *   General strategy:
    *      if group is cyclic => circular
    *      if group has two generators, look for a cyclic subgroup that is order |G|/2 and draw this as two connected circles
    *        if |G| = |gen1| * |gen2|, draw this with gen1 rotated in XY plane, gen2 linear in X (e.g., S_3)
    *        if not, draw this with gen1 circular in XY plane, gen2 linear in Z (e.g., Q_4)
    *      if group has two generators but no such cyclic subgroup draw a 2D grid
    *      if group has three generators map each of them to an axis in a 3D grid
    *      if group has four generators, pick the two smallest to display on same axis and map others to the remaining axes
    */
   _generateStrategy() {
      if (this.group.order == 1) {
         this.nodes.push(new Diagram3D.Node(0));  // just draw a single node
         return;
      }
      if (this.group.order == 2) {
         this.setStrategies([[1, 0, 1, 0]]);
         return;
      }

      const element_orders = this.group.elementOrders;
      const generators = this.group.generators[0];
      const ordered_gens = generators.slice().sort( (a,b) => element_orders[b] - element_orders[a] );
      switch (generators.length) {
         case 1:
            this.setStrategies([[generators[0], 1, 2, 0]]);  // cyclic group
            break;
         case 2:
            // does the first ordered_gen (generator with largest element order) have order |G|/2?
            // make sure group is big enough -- can't do a circle with only 2 elements
            if (element_orders[ordered_gens[0]] == this.group.order/2 && this.group.order > 4) {
               if (element_orders[ordered_gens[1]] == 2) {
                  this.setStrategies([[ordered_gens[1], 0, 0, 0],
                                      [ordered_gens[0], 2, 2, 1]]);     // see D_4
               } else {
                  this.setStrategies([[ordered_gens[1], 1, 2, 0],
                                      [ordered_gens[0], 0, 2, 1]]);     // see Q_4
               }
            } else {
               // put greatest # elements in X direction (remember that the 2nd generator will generate
               //   all the elements in the group the first one doesn't)
               const first_gen_order = element_orders[ordered_gens[0]];
               const first_gen_dir = (first_gen_order >= this.group.order/first_gen_order) ? 0 : 1;
               this.setStrategies([[ordered_gens[0], 0, first_gen_dir,   0],
                                   [ordered_gens[1], 0, 1-first_gen_dir, 1]]);       // see S_4
            }
            break;
         case 3:
            this.setStrategies([[generators[0], 0, 0, 0],
                                [generators[1], 0, 1, 1],
                                [generators[2], 0, 2, 2]]);
            break;
         case 4:
            this.setStrategies([[ordered_gens[0], 0, 0, 0],
                                [ordered_gens[1], 0, 0, 1],
                                [ordered_gens[2], 0, 1, 2],
                                [ordered_gens[3], 0, 2, 3]]);
            break;
      }
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
         diagram_name : this.diagram_name,
         arrowheadPlacement : this.arrowheadPlacement
      };
   }

   fromJSON ( json ) {
      this.diagram_name = json.diagram_name;
      this.arrowheadPlacement = json.arrowheadPlacement;
      var that = this;
      Library.getGroupOrDownload( json.groupURL )
             .then( ( group ) => { that.group = group; } );
   }
}


/* Initialize CayleyDiagram static variables */

CayleyDiagram.BACKGROUND_COLOR = 0xE8C8C8;
CayleyDiagram.NODE_COLOR = 0x8c8c8c;

CayleyDiagram.LINEAR_LAYOUT = 0;
CayleyDiagram.CIRCULAR_LAYOUT = 1;
CayleyDiagram.ROTATED_LAYOUT = 2;

CayleyDiagram.X_DIRECTION = 0;
CayleyDiagram.Y_DIRECTION = 1;
CayleyDiagram.Z_DIRECTION = 2;

CayleyDiagram.YZ_DIRECTION = 0;
CayleyDiagram.XZ_DIRECTION = 1;
CayleyDiagram.XY_DIRECTION = 2;

CayleyDiagram.LayoutStrategy = class {
   constructor(generator, direction, nesting_level) {
      this.generator = generator;          // element# (not 0)
      this.direction = direction;          // 0/1/2 => X/Y/Z for linear, YZ/XZ/XY for curved
      this.nesting_level = nesting_level;  // 0 for innermost, increasing to outermost
      this.elements = undefined;
   }

   static _createStrategy(generator, layout, direction, nesting_level) {
      if (CayleyDiagram.LayoutStrategy.class_by_layout === undefined) {
         CayleyDiagram.LayoutStrategy.class_by_layout = [
            CayleyDiagram.LinearLayout,
            CayleyDiagram.CircularLayout,
            CayleyDiagram.RotatedLayout,
         ];
      }
      return new CayleyDiagram.LayoutStrategy
                              .class_by_layout[layout](generator, direction, nesting_level);
   }

   _getWidth(nodes, direction) {
      return nodes.reduce(
         (max, node) => Math.max(Math.abs(node.point.getComponent(direction)), max),
         0 );
   }
}

// Scale and translate children to distribute them from 0 to 1 along the <direction> line
CayleyDiagram.LinearLayout = class extends CayleyDiagram.LayoutStrategy {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.LINEAR_LAYOUT;
   }

   _layout(children) {
      const direction_vector = new THREE.Vector3(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? 1 : 0));

      // number of children
      const num_children = children.length;

      // find a child diameter in <direction>, scale so all fit in [0,1] box
      const target_width = 1.4/(3*num_children - 1);  // heuristic
      const child_width = this._getWidth(children._flatten(), this.direction);
      const scale = child_width < target_width ? 1 : target_width / child_width;

      // create scale transform
      let transform = (new THREE.Matrix4()).makeScale(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? scale : 1));

      const scaled_width = scale*child_width;
      const step = (1 - scaled_width) / (num_children - 1);
      let translation = 0;  // initial value
      for (const child of children) {
         transform = transform.setPosition(direction_vector.clone().multiplyScalar(translation));
         child.forEach( (node) => node.point = node.point.applyMatrix4(transform) );
         translation += step;
      }

      return children;
   }
}

CayleyDiagram.CurvedLayout = class extends CayleyDiagram.LayoutStrategy {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);

      // calculate position transform as a function of angle theta for every direction
      const positions = [
         (r, theta) => new THREE.Vector3(0,                        0.5 - r*Math.cos(theta),  0.5 - r*Math.sin(theta)),  // YZ
         (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0,                        0.5 - r*Math.cos(theta)),  // XZ
         (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0.5 - r*Math.cos(theta),  0),                        // XY
      ];
      this.position = (r, theta) => positions[direction](r, theta);
   }
}

// Scale children to fit and translate them so they're distributed
//   around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
CayleyDiagram.CircularLayout = class extends CayleyDiagram.CurvedLayout {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.CIRCULAR_LAYOUT;
   }

   _layout(children) {
      // make circle radius to fit in [0,1] box
      const r = 0.5;

      // scale two directions, not the third?
      // scale differently in 2 directions (esp rotated -- make old x < 0.25)
      const scale = 0.4;  // heuristic
      const transform = (new THREE.Matrix4()).makeScale(
         ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (this.direction == inx) ? 1 : scale)).toArray()
      )

      const curvedGroup = [];

      // translate children to [0.5, 0.5] + [r*sin(th), -r*cos(th)]
      children.forEach( (child, inx) => {
         transform.setPosition(this.position(r, 2*inx*Math.PI/children.length));
         child.forEach( (node) => {
            node.point = node.point.applyMatrix4(transform);
            if (node.curvedGroup === undefined) {
               node.curvedGroup = curvedGroup;
               curvedGroup.push(node);
            }
         } );
      } );

      return children;
   }
}

// Scale children to fit, rotate them PI/2 + 2*inx*PI/n, and translate them
//   so they're distributed around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
CayleyDiagram.RotatedLayout = class extends CayleyDiagram.CurvedLayout {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);

      // calculate rotation transform as a function of angle theta for every direction
      const rotations = [
         (theta) => new THREE.Matrix4().makeRotationX(theta + Math.PI/2),   // YZ
         (theta) => new THREE.Matrix4().makeRotationY(theta + Math.PI/2),   // XZ
         (theta) => new THREE.Matrix4().makeRotationZ(theta + Math.PI/2),   // XY
      ];
      this.rotation = (theta) => rotations[direction](theta);
   }

   get layout() {
      return CayleyDiagram.ROTATED_LAYOUT;
   }

   _layout(children) {
      // make circle radius to fit in [0,1] box
      const r = 0.5;

      // scale two directions, not the third?
      // scale differently in 2 directions (esp rotated -- make old x < 0.25)

      // make size of transformed child about half the distance between nodes
      const scale = Math.min(0.25, Math.max(0.1, Math.PI/2/children.length));	// heuristic
      const scale_transform = (new THREE.Matrix4()).makeScale(
         ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (this.direction == inx) ? 1 : scale)).toArray()
      )

      const curvedGroup = [];
      
      // scale, rotation, and translate each child
      children.forEach( (child, inx) => {
         const theta = 2*inx*Math.PI/children.length;
         const transform = scale_transform.clone()
                                          .multiply(this.rotation(theta))
                                          .setPosition(this.position(r, theta));
         child.forEach( (node) => {
            node.point = node.point.applyMatrix4(transform);
            if (node.curvedGroup === undefined) {
               node.curvedGroup = curvedGroup;
               curvedGroup.push(node);
            }
         } );
      } );

      return children;
   }
}
