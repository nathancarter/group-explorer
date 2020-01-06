// @flow

/*::
import BitSet from './BitSet.js';
import Diagram3D from './Diagram3D.js';
import GEUtils from './GEUtils.js';
import type {Tree} from './GEUtils.js';
import Library from './Library.js';
import XMLGroup from './XMLGroup.js';

export type layout = 0 | 1 | 2;
export type direction = 0 | 1 | 2;
export type StrategyArray = Array<[groupElement, layout, direction, number]>;

type MinCayleyDiagramJSON = {
   groupURL: string,
   diagram_name: ?string,
   arrowheadPlacement: number
}
*/

/*
 * To create a javascript approximation to nested classes we create a class definition
 *   with an 'internal use' name, and later assign it to CayleyDiagram.xxx
 */

class _CayleyDiagram_AbstractLayoutStrategy {
/*::
  +doLayout: (children: Array<Array<Diagram3D.Node>> ) => Array<Array<Diagram3D.Node>>;
   generator: groupElement;
  +layout: layout;
   direction: direction;
   nesting_level: number;
   bitset: BitSet;
*/
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      this.generator = generator;          // element# (not 0)
      this.direction = direction;          // 0/1/2 => X/Y/Z for linear, YZ/XZ/XY for curved
      this.nesting_level = nesting_level;  // 0 for innermost, increasing to outermost
   }

   width(nodes /*: Array<Diagram3D.Node> */, direction /*: direction */) /*: number */ {
      return nodes.reduce(
         (max /*: number */, node /*: Diagram3D.Node */) => Math.max(Math.abs(node.point.getComponent(direction)), max),
         0 );
   }
}

// Scale and translate children to distribute them from 0 to 1 along the <direction> line
class _CayleyDiagram_LinearLayout extends _CayleyDiagram_AbstractLayoutStrategy {
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      super(generator, direction, nesting_level);
   }

   get layout() /*: layout */ {
      return CayleyDiagram.LAYOUT.LINEAR;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
      const direction_vector = new THREE.Vector3(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? 1 : 0));

      // number of children
      const num_children = children.length;

      // find a child diameter in <direction>, scale so all fit in [0,1] box
      const target_width = 1.4/(3*num_children - 1);  // heuristic
      const child_width = this.width(GEUtils.flatten( ((children /*: any */) /*: Tree<Diagram3D.Node> */)), this.direction);
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

class _CayleyDiagram_CurvedLayout extends _CayleyDiagram_AbstractLayoutStrategy {
/*::
   position: (r: number, theta: number) => THREE.Vector3;
 */
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
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
class _CayleyDiagram_CircularLayout extends _CayleyDiagram_CurvedLayout {
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.LAYOUT.CIRCULAR;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
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
class _CayleyDiagram_RotatedLayout extends _CayleyDiagram_CurvedLayout {
/*::
   rotation: (theta: number) => THREE.Matrix4;
 */
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
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
      return CayleyDiagram.LAYOUT.ROTATED;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
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

/*:: export default */
class CayleyDiagram extends Diagram3D {
/*::
   static BACKGROUND_COLOR: color;
   static NODE_COLOR: color;
   static LAYOUT: {[key: string]: layout};
   static DIRECTION: {[key: string]: direction};
   static AbstractLayoutStrategy: Class<_CayleyDiagram_AbstractLayoutStrategy>;
   static LinearLayout: Class<_CayleyDiagram_LinearLayout>;
   static CurvedLayout: Class<_CayleyDiagram_CurvedLayout>;
   static CircularLayout: Class<_CayleyDiagram_CircularLayout>;
   static RotatedLayout: Class<_CayleyDiagram_RotatedLayout>;

   strategies: Array<CayleyDiagram.AbstractLayoutStrategy>;
   diagram_name: ?string;
   ordered_nodes: Tree<Diagram3D.Node>;
   chunk: number;  // chunking group.subgroups index; 0 (trivial subgroup) => no chunking

   // fields unused in GE, added for compatibility with JSON methods in DisplayDiagram.js
   elements: any;
   arrowColors: any;
 */
   constructor(group /*: XMLGroup */, diagram_name /*: ?string */) {
      super(group);
      this.background = CayleyDiagram.BACKGROUND_COLOR;
      this.strategies = [];

      this.chunk = 0;
      this.isCayleyDiagram = true;
      this.diagram_name = diagram_name;
      this.isGenerated = (diagram_name === undefined);
      this._update();
   }

   getStrategies() /*: StrategyArray */ {
      return this.strategies.map( (strategy) => [strategy.generator, strategy.layout, strategy.direction, strategy.nesting_level] );
   }

   setStrategies(strategy_parameter_array /*: StrategyArray */ ) {
      const param_array = strategy_parameter_array
         .map( (params) => { return {generator: params[0], layout: params[1], direction: params[2], nesting_level: params[3]} } );

      this.strategies = strategy_parameter_array
         .map( (parameters) => CayleyDiagram._createStrategy(...parameters) );

      this._update();
   }

    static _createStrategy(generator /*: number */, layout /*: layout */, direction /*: direction */, nesting_level /*: number */
                          ) /*: CayleyDiagram.AbstractLayoutStrategy */ {
      const class_by_layout = [CayleyDiagram.LinearLayout, CayleyDiagram.CircularLayout, CayleyDiagram.RotatedLayout];
      return new class_by_layout[layout](generator, direction, nesting_level);
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
      if (cayleyDiagram !== undefined) {
         this.nodes = cayleyDiagram.points.map(
            (point, element) => new Diagram3D.Node(element, point, {lineStyle: Diagram3D.STRAIGHT}));
         cayleyDiagram.arrows.forEach( (arrow) => this.addLines(arrow) );
         this.emitStateChange();
      }
   }

   _generateFromStrategy() {
      const node_list = this._generateNodes();
      this.ordered_nodes = this._transposeNodes(node_list);

      this.nodes = this._layout(this.ordered_nodes)
                       .sort( (a,b) => a.element - b.element );

      // makes lines for generators
      this.strategies.forEach( (strategy) => this.addLines(strategy.generator) );
      this.emitStateChange();
   }

   _generateNodes() /*: Tree<groupElement> */ {
      const generators = this.strategies.map( (strategy) => strategy.generator );

      const node_list = this.strategies.reduce( (nodes, strategy, inx) => {
         const [newNodes, newBitSet] = this._extendSubgroup(nodes, generators.slice(0, inx+1));
         this.strategies[inx].bitset = newBitSet;
         return (inx == 0) ? ((GEUtils.flatten(newNodes) /*: any */) /*: Tree<groupElement> */) : newNodes;
      }, [0] );

      this.emitStateChange();
      return node_list;
   }

   _extendSubgroup(H_prev /*: Tree<groupElement> */, generators /*: Array<groupElement> */) /*: [Tree<groupElement>, BitSet] */ {
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
      const result_bitset = new BitSet(this.group.order, GEUtils.flatten(H_prev));
      Array.from({length: this.group.elementOrders[new_generator]})
           .reduce( (cycle) => (cycle.push(this.group.mult(GEUtils.last(cycle), new_generator)), cycle), [0])
           .forEach( (el) => {
              if (!result_bitset.isSet(el)) {
                 result.push(deepMultiply(el, H_prev))
              }
           } );

      for (let inx = 1; inx < result.length; inx++) {
         let rep = -1;
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

   _transposeNodes(node_list /*: Tree<groupElement> */) /*: Tree<Diagram3D.Node> */ {
      const copyPush = (arr /*: Array<groupElement> */, el /*: groupElement */) /*: Array<groupElement> */ => {
         const result = arr.slice();
         result.push(el);
         return result;
      };

      // index transformation
      const gen2nest /*: Array<number> */ = this.strategies.map( (_, index) => this.strategies.findIndex( (s) => s.nesting_level == index) );

      // allocate transpose according to space used in node_list
      const tmp /*: Array<number> */ = this.strategies.map( (_, inx) => eval('node_list' + Array(inx).fill('[0]').join('') + '.length') );
      const transpose_allocations /*: Array<number> */ = tmp.map( (_, inx, arr) => arr[gen2nest[inx]] );
      const makeEmpty = (transpose_index /*:: ?: number */ = 0) =>
            (transpose_index == transpose_allocations.length - 1) ? [] :
            Array(transpose_allocations[transpose_index]).fill().map( (_) => makeEmpty(transpose_index + 1) );

      // traverse node_list, inserting new Diagram3D.Node into transpose
      const traverse = (nodes /*: groupElement | Tree<groupElement> */, indices /*: Array<groupElement> */ = []) => {
         if (Array.isArray(nodes)) {
            nodes.forEach( (el,inx) => { traverse(el, copyPush(indices, inx)) } );
         } else {
            const line_style = indices.every(
               (index, strategy_index) => index == 0 || this.strategies[this.strategies.length - strategy_index - 1].layout == CayleyDiagram.LAYOUT.LINEAR
            ) ? Diagram3D.STRAIGHT : Diagram3D.CURVED;
            let walk /*: any */ = result;	// FIXME -- explain all this
            for ( let i = 0 ; i < indices.length - 1 ; i++ )
               walk = walk[indices[gen2nest[i]]];
            walk[indices[gen2nest[indices.length-1]]] = new Diagram3D.Node(nodes, undefined, {lineStyle: line_style});
         }
      }

      // now actually do the work
      const result /*: Tree<Diagram3D.Node> */ = makeEmpty();
      traverse(node_list);

      return result;
   }

   _layout(nested_nodes /*: Diagram3D.Node | Tree<Diagram3D.Node> */,
           nested_strategies /*: Array<CayleyDiagram.AbstractLayoutStrategy> */ = this.strategies.slice().sort( (a,b) => a.nesting_level - b.nesting_level )
           ) /*: Array<Diagram3D.Node> */ {

      if (Array.isArray(nested_nodes)) {
         const strategy = nested_strategies.pop();
         const child_results = [...nested_nodes.map( (children) => this._layout(children, nested_strategies) )]
         nested_strategies.push(strategy);
         const layout_results = strategy.doLayout(child_results);
         return GEUtils.flatten( ((layout_results /*: any */) /*: Tree<Diagram3D.Node> */) );
      } else {
         return [nested_nodes];
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
      const generators /*: Array<groupElement> */ = this.group.generators[0];
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
                                   [ordered_gens[1], 0, ((1-first_gen_dir /*: any */) /*: direction */), 1]]);       // see S_4
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

   emitStateChange() {
      const myURL /*: string */ = window.location.href;
      const thirdSlash /*: number */ = myURL.indexOf( '/', 8 );
      const myDomain /*: string */ = myURL.substring( 0, thirdSlash > -1 ? thirdSlash : myURL.length );
      window.postMessage( this.toJSON(), myDomain );
   }

   toJSON() /*: MinCayleyDiagramJSON */ {
      return {
         groupURL: this.group.URL,
         diagram_name: this.diagram_name,
         arrowheadPlacement: this.arrowheadPlacement
      };
   }

   fromJSON(json /*: MinCayleyDiagramJSON */) {
      this.diagram_name = json.diagram_name;
      this.arrowheadPlacement = json.arrowheadPlacement;
      var that = this;
      Library.getGroupOrDownload( json.groupURL )
             .then( ( group ) => { that.group = group; } );
   }
}


/* Initialize CayleyDiagram static variables */

CayleyDiagram.BACKGROUND_COLOR = '#E8C8C8';
CayleyDiagram.NODE_COLOR = '#8c8c8c';

CayleyDiagram.LAYOUT = {LINEAR: 0, CIRCULAR: 1, ROTATED: 2};
CayleyDiagram.DIRECTION = {X: 0, Y: 1, Z: 2, YZ: 0, XZ: 1, XY: 2};

CayleyDiagram.AbstractLayoutStrategy = _CayleyDiagram_AbstractLayoutStrategy;
CayleyDiagram.LinearLayout = _CayleyDiagram_LinearLayout;
CayleyDiagram.CircularLayout = _CayleyDiagram_CircularLayout;
CayleyDiagram.RotatedLayout = _CayleyDiagram_RotatedLayout;
