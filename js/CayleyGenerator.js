// @flow

import BitSet from './BitSet.js';
import GEUtils from './GEUtils.js';
import MathML from './MathML.js';
import XMLGroup from './XMLGroup.js';
import {CayleyDiagramView} from './CayleyDiagramView.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import type {Tree} from './GEUtils.js';
import type {XMLCayleyDiagram} from './XMLGroup.js';
import type {NodeData, ArrowData, ChunkData} from './CayleyDiagramView.js';
import {CayleyDiagramGenerator} from './CayleyDiagramView.js';

export type Layout = 'linear' | 'circular' | 'rotated';
type LineDirection = 'X' | 'Y' | 'Z';
type PlaneDirection = 'YZ' | 'XZ' | 'XY';
export type Direction = LineDirection | PlaneDirection;
export type StrategyParameters = {generator: groupElement, layout: Layout, direction: Direction, nestingLevel: number};
*/

export const DIRECTION_INDEX = { X: 0, Y: 1, Z: 2, YZ: 0, XZ: 1, XY: 2 };
export const AXIS_NAME = ['X', 'Y', 'Z'];

export class CayleyGeneratorFromStrategy /*:: implements CayleyDiagramGenerator */ {
/*::
    group: XMLGroup;
    nodes: Array<NodeData>;
    node_tree: Tree<NodeData>;
    arrows: Array<ArrowData>;
    strategies: Array<AbstractLayoutStrategy>;
    sorted_strategies: Array<AbstractLayoutStrategy>;
    _chunk: integer; // subgroup index of chunk
*/
    constructor (group /*: XMLGroup */,
                 strategy_parameters /*: ?Array<StrategyParameters> */)
    {
        this.group = group;

        // initialize nodes, arrows
        this.nodes = createInitialNodes(group);
        this.arrows = [];

        if (strategy_parameters == undefined) {
            strategy_parameters = this.generateStrategy();
        }

        // create strategies from strategy parameters
        this.strategies = strategy_parameters.map(
            ({generator, layout, direction, nestingLevel}) =>
                new STRATEGY_BY_LAYOUT[layout](generator, direction, nestingLevel)
        );

        // nothing to do if this.strategies == [] (e.g., Trivial group) -- just return
        if (this.strategies.length == 0) {
            return;
        }

        // make node tree according to generators
        this.node_tree = this.generateTree();

        // sort node tree, strategies according to nesting
        this.nestTree(this.node_tree);
        this.sorted_strategies = [...this.strategies].sort( (a,b) => a.nesting_level - b.nesting_level );

        // layout nodes
        this.layoutNodes();

        // normalize figure
        this.normalize();

        // mark centers
        this.markCenters();

        // create arrows from strategy generators
        this.arrows = this.createArrows(this.strategies.map( (strategy) => strategy.generator ), true);
    }

    get chunk () /*: integer */ {
        if (this._chunk == undefined) {
            this._chunk = 0;
        }

        return this._chunk;
    }

    set chunk (subgroup_index /*: integer */) {
        this._chunk = subgroup_index;
    }

    get generatesFromStrategy () /*: boolean */ {
        return true;
    }

    get strategy_parameters () /*: Array<StrategyParameters> */ {
        return this.strategies.map( (strategy) => strategy.strategyParameters );
    }

    // Defaults start recursion
    generateTree (strategies /*: Array<AbstractLayoutStrategy> */ = [...this.strategies],
                  elements_used /*: BitSet */ = new BitSet(this.group.order)
                 ) /*: Tree<NodeData> */
    {
        if (strategies.length == 1) {
            elements_used.add(this.group.elementPowers[strategies[0].generator]);
            strategies[0].elements = elements_used.clone();
            return this.group.elementPowerArray(strategies[0].generator).map( (el) => this.nodes[el] );
        } else {
            const nodeTreeMultiply = (g, node_tree) => {
                if (Array.isArray(node_tree)) {
                    return node_tree.map( (el) => nodeTreeMultiply(g, el) );
                } else {
                    const prod = this.group.mult(g, node_tree.element);
                    elements_used.set(prod);
                    return this.nodes[prod];
                }
            }
            const strategies_used = [...strategies];
            const current_strategy = strategies.pop();
            const current_tree = this.generateTree(strategies, elements_used);
            const node_tree = [current_tree];
            const coset_reps = [0];
            // Load generators like this to preferentially generate a <g> X <h> rectangular map
            const generators = this.group.elementPowerArray(current_strategy.generator);
            generators.push(...strategies_used.map( (strategy) => strategy.generator ));
            for (const g of coset_reps) {
                for (const generator of generators) {
                    const h = this.group.mult(generator, g);
                    if (!elements_used.isSet(h)) {
                        coset_reps.push(h);
                        node_tree.push(nodeTreeMultiply(h, current_tree));
                    }
                }
            }
            current_strategy.elements = elements_used.clone();
            return node_tree;
        }
    }

    nestTree (node_tree /*: Tree<NodeData> */) {
        const nesting_order = this.strategies.map( ({nesting_level}) => nesting_level );
        const swap = (arr, levels_left) => {
            if (levels_left == 0) {
                const tmp = arr.splice(0, arr.length);
                tmp[0].forEach( () => arr.push([]) );
                for (let i = 0; i < tmp.length; i++) {
                    for (let j = 0; j < tmp[0].length; j++) {
                        arr[j][i] = tmp[i][j];
                    }
                }
            } else {
                arr.forEach( (el) => swap(el, levels_left - 1) );
            };
        }

        for (let changed = true; changed; ) {
            changed = false;
            for (let i = 0; i < nesting_order.length-1; i++) {
                if (i != nesting_order[i]) {
                    swap(node_tree, i);
                    // $FlowFixMe -- flow doesn't support array element assignment in destructuring
                    [nesting_order[i], nesting_order[i+1]] = [nesting_order[i+1], nesting_order[i]];
                    changed = true;
                }
            }
        }
    }

    // Defaults start recursion
    layoutNodes (nested_nodes /*: NodeData | Tree<NodeData> */ = this.node_tree,
                 to_go /*:: ?: integer */ = this.sorted_strategies.length - 1
                ) /*: Array<NodeData> */
    {
        let result;
        if (Array.isArray(nested_nodes)) {
            const strategy = this.sorted_strategies[to_go];
            const child_results = nested_nodes.map( (child_node) => this.layoutNodes(child_node, to_go - 1) );
            const layout_results = strategy.layoutNodes(child_results);
            result = GEUtils.flatten(((layout_results /*: any */) /*: Tree<NodeData> */));
        } else {
            result = [nested_nodes];  // we've drilled down to a single node at this point
        }

        return result;
    }

    createArrows (generators /*: Array<groupElement> */, right_multiply /*: boolean */) {
        const multiply = (a, b) => right_multiply ? this.group.mult(a, b) : this.group.mult(b, a);
        
        const new_arrows = generators.reduce( (arrows_by_generator, generator, inx) => {
            const color = '#' + new THREE.Color(GEUtils.fromRainbow(inx/generators.length, 1.0, 0.2)).getHexString();
            return this.group.elements.reduce( (arrows, element) => {
                const product = multiply(element, generator);
                const bidirectional = (multiply(product, generator) == element);
                if (!bidirectional || element < product) {  // test element < product so we only draw an undirected line once
                    const generated_curved = this.isCurved(this.nodes[element], this.nodes[product]);
                    const new_arrow = {
                        start_node: this.nodes[element],
                        end_node: this.nodes[product],
                        generator: generator,
                        bidirectional: bidirectional,
                        thirdPoint: this.getThirdPoint(this.nodes[element], this.nodes[product]),
                        keepCurved: generated_curved,
                        offset: generated_curved ? 0.15 : undefined,  // Heuristic value
                        color: color,
                    };
                    arrows.push(new_arrow);
                };
                return arrows;
            }, arrows_by_generator );
        }, [] );

        return new_arrows;
    }

    isCurved (start_node /*: NodeData */, end_node /*: NodeData */) /*: boolean */ {
        for (let level = 0; level < start_node.centers.length; level++) {
            if (start_node.centers[level] == end_node.centers[level]) {
                return this.sorted_strategies[level] instanceof CurvedLayoutStrategy;
            }
        }
        return false;
    }

    /* Find a third point that establishes the plane of the start-end arrow
     *   If...						Then use...
     *      center of first level at which both nodes     common center
     *        exist isn't colinear with them
     *      different center of later level at which      new center
     *        both nodes exist isn't colinear with them
     *      origin, start, and end aren't colinear        (0,0,0)
     *      all nodes lie in one plane (XY, YZ, XZ)	  plane normal X (end - start)
     *      (1,0,0), start, and end aren't colinear	  (1,0,0)
     *      (0,1,0), start, and end can't be colinear	  (0,1,0)
     */
    getThirdPoint (start_node /*: NodeData */, end_node /*: NodeData */) /*: THREE.Vector3 */ {
        const start = start_node.position;
        const end = end_node.position;

        let first, second;
        for (let level = 0; level < start_node.centers.length; level++) {
            if (start_node.centers[level] == end_node.centers[level]) {
                if (first == undefined) {
                    first = start_node.centers[level];
                    if (start.clone().sub(first).cross(end.clone().sub(first)).lengthSq() > 1.0e-6) {
                        return first;
                    }
                } else if (second == undefined) {
                    second = start_node.centers[level];
                    if (start.clone().sub(second).cross(end.clone().sub(second)).lengthSq() > 1.0e-6) {
                        return second;
                    }
                    break;
                }
            }
        }

        let center;
        if (new THREE.Vector3().crossVectors(start, end).lengthSq() > 1.0e-6) {
            center = new THREE.Vector3(0, 0, 0);
        } else if (this.nodes.every( (node) => node.position.x == 0 )) {
            center = new THREE.Vector3(1, 0, 0).cross(end.clone().sub(start));
        } else if (this.nodes.every( (node) => node.position.y == 0 )) {
            center = new THREE.Vector3(0, 1, 0).cross(end.clone().sub(start));
        } else if (this.nodes.every( (node) => node.position.z == 0 )) {
            center = new THREE.Vector3(0, 0, 1).cross(end.clone().sub(start));
        } else if (new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0).sub(start),
                                                    new THREE.Vector3(1, 0, 0).sub(end)).lengthSq() > 1.0e-6) {
            center = new THREE.Vector3(1, 0, 0);
        } else {
            center = new THREE.Vector3(0, 1, 0);
        }
        return center;
    }

    // Normalize scene: translate to centroid, radius = 1
    normalize () {
        const transform = this.normalizationTransform(this.nodes.map( (node) => node.position ));

        this.nodes.forEach( (node) => node.position.applyMatrix4(transform) );
    }

    normalizationTransform (positions /*: Array<THREE.Vector3> */) /*: THREE.Matrix4 */ {
        const centroid = positions
              .reduce( (centroid, position) => centroid.add(position), new THREE.Vector3(0,0,0) )
              .multiplyScalar(1/positions.length);
        const squaredRadius = positions
              .reduce( (sqrad, position) => Math.max(sqrad, position.distanceToSquared(centroid)), 0 );
        const scale = (squaredRadius == 0) ? 1 : 1/Math.sqrt(squaredRadius);  // in case there's only one element
        const translation_transform = (new THREE.Matrix4()).makeTranslation(...centroid.multiplyScalar(-1).toArray());
        const transform = (new THREE.Matrix4()).makeScale(scale, scale, scale).multiply(translation_transform);

        return transform;
    }

    markCenters (nodes /*: NodeData | Tree<NodeData> */ = this.node_tree) /*: THREE.Vector3 */ {
        let center;
        if (Array.isArray(nodes)) {
            const [sum, count] =
                  nodes.reduce( ([sum, count], children) => [sum.add(this.markCenters(children)), count+1], [new THREE.Vector3(), 0]);
            center = sum.multiplyScalar(1/count);
            GEUtils.flatten(nodes).forEach( (node) => node.centers.push(center) );
        } else {
            nodes.centers = [];
            center = nodes.position;
        }
        return center;
    }

    /* Generate default strategy
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
    generateStrategy () {
        let strategies = [];
        if (this.group.order == 1) {
            // this.nodes.push(new Diagram3D.Node(0));  // just draw a single node
            return strategies;
        }
        if (this.group.order == 2) {
            strategies.push({generator: 1, layout: 'linear', direction: 'Y', nestingLevel: 0});
            return strategies;
        }

        const element_orders = this.group.elementOrders;
        const generators /*: Array<groupElement> */ = this.group.generators[0];
        const ordered_gens = generators.slice().sort( (a,b) => element_orders[b] - element_orders[a] );
        switch (generators.length) {
        case 1:
            strategies.push({generator: generators[0], layout: 'circular', direction: 'XY', nestingLevel: 0});  // cyclic group
            break;
        case 2:
            // does the first ordered_gen (generator with largest element order) have order |G|/2?
            // make sure group is big enough -- can't do a circle with only 2 elements
            if (element_orders[ordered_gens[0]] == this.group.order/2 && this.group.order > 4) {
                if (element_orders[ordered_gens[1]] == 2) {
                    strategies.push({generator: ordered_gens[1], layout: 'linear', direction: 'X', nestingLevel: 0},
                                    {generator: ordered_gens[0], layout: 'rotated', direction: 'XY', nestingLevel: 1});  // see D_4
                } else {
                    strategies.push({generator: ordered_gens[1], layout: 'circular', direction: 'XY', nestingLevel: 0},
                                    {generator: ordered_gens[0], layout: 'linear', direction: 'Z', nestingLevel: 1});    // see Q_4
                }
            } else {
                // put greatest # elements in X direction (remember that the 2nd generator will generate
                //   all the elements in the group the first one doesn't)
                const first_gen_order = element_orders[ordered_gens[0]];
                const first_gen_dir = (first_gen_order >= this.group.order/first_gen_order) ? 'X' : 'Y';
                const second_gen_dir = (first_gen_dir == 'X') ? 'Y' : 'X';
                strategies.push({generator: ordered_gens[0], layout: 'linear', direction: first_gen_dir, nestingLevel: 0},
                                {generator: ordered_gens[1], layout: 'linear', direction: second_gen_dir, nestingLevel: 1});  // see S_4
            }
            break;
        case 3:
            strategies.push({generator: generators[0], layout: 'linear', direction: 'X', nestingLevel: 0},
                            {generator: generators[1], layout: 'linear', direction: 'Y', nestingLevel: 1},
                            {generator: generators[2], layout: 'linear', direction: 'Z', nestingLevel: 2});
            break;
        case 4:
            strategies.push({generator: ordered_gens[0], layout: 'linear', direction: 'X', nestingLevel: 0},
                            {generator: ordered_gens[1], layout: 'linear', direction: 'X', nestingLevel: 1},
                            {generator: ordered_gens[2], layout: 'linear', direction: 'Y', nestingLevel: 2},
                            {generator: ordered_gens[3], layout: 'linear', direction: 'Z', nestingLevel: 3});
            break;
        }
        return strategies;
    }

    /* Create chunks
     *   create a local copy of the node_tree (we may revisit this)
     *   using the same layout routines and the same recursion as the regular node layout
     *     visit the nodes in nesting order
     *     and when you reach the level that starts from the chunk subgroup, add a 'chunk' data structure
     *     that has ...
     */
    createChunks () /*: [Array<ChunkData>, float] */ {
        if (this.chunk == 0)
            return [[], 0];

        // copy node_tree, with just empty points
        const copy_tree = (tree) /*: NodeData | Tree<NodeData> */ => {
            if (Array.isArray(tree)) {
                return tree.reduce( (new_tree, limb) => {
                    new_tree.push(copy_tree(limb));
                    return new_tree;
                }, []);
            } else {
                return Object.assign({}, tree, {position: new THREE.Vector3()});
            }
        };

        const ghost_tree = copy_tree(this.node_tree);

        // go through layoutNodes process up to spec'd level
        // add chunk x,y,z vectors according to max dimentions
        // continue layoutNodes process to top
        const strategies_by_nesting_level = [...this.sorted_strategies].reverse();
        const chunking_strategy = strategies_by_nesting_level.findIndex(
            (strategy) => strategy.elements.equals(this.group.subgroups[this.chunk].members)
        );
        const layout = (tree /*: NodeData | Tree<NodeData> */, nesting_level) /*: Array<NodeData> */ => {
            if (Array.isArray(tree)) {
                const strategy = strategies_by_nesting_level[nesting_level]
                const child_results = tree.map( (limb) => layout(limb, nesting_level + 1) );
                const layout_results = strategy.layoutNodes(child_results);
                const results = GEUtils.flatten( ((layout_results /*: any */) /*: Tree<NodeData> */) );
                if (nesting_level == chunking_strategy) {
                    const centroid = results.reduce( (centroid, node) => centroid.add(node.position), new THREE.Vector3() )
                                            .multiplyScalar(1/results.length);
                    let x_width = strategy.width(results, 'X');
                    let y_width = strategy.width(results, 'Y');
                    let z_width = strategy.width(results, 'Z');
                    if (strategy instanceof CurvedLayoutStrategy) {
                        switch (strategy.direction) {
                        case 'YZ': y_width = z_width = Math.max(y_width, z_width); break;
                        case 'XZ': x_width = z_width = Math.max(x_width, z_width); break;
                        case 'XY': x_width = y_width = Math.max(x_width, y_width); break;
                        }
                    }
                    results[0].chunk = {
                        name: results[0].label + MathML.sub('H', this.chunk),
                        o: centroid,
                        x: new THREE.Vector3(1, 0, 0).add(centroid),
                        y: new THREE.Vector3(0, 1, 0).add(centroid),
                        z: new THREE.Vector3(0, 0, 1).add(centroid),
                        xWidth: x_width,
                        yWidth: y_width,
                        zWidth: z_width,
                    };
                }
                return results;
            } else {
                return [tree];  // we've drilled down to a single node at this point
            }
        }

        const new_layout = layout(ghost_tree, 0);
        
        const normalization = this.normalizationTransform( new_layout.map( (node) => node.position ) );
        const chunks = new_layout.reduce( (chunks, node) => {
            const chunk = node.chunk;
            if (chunk != undefined) {
                chunk.o.applyMatrix4(normalization);
                chunk.x.applyMatrix4(normalization);
                chunk.y.applyMatrix4(normalization);
                chunk.z.applyMatrix4(normalization);
                chunks.push(chunk);
            }
            return chunks;
        }, [] );

        // for every node not in this subgroup
        //   for every node in this subgroup
        //      find closest two nodes
        const chunk_elements = this.group.subgroups[this.chunk].members.toArray();
        const other_elements = this.group.subgroups[this.chunk].members.clone().complement().toArray();
        const separation_squared = other_elements.reduce( (separation_squared, other_element) => {
            return chunk_elements.reduce( (separation_squared, subgroup_element) => {
                return Math.min( separation_squared, 
                                 this.nodes[subgroup_element].position.distanceToSquared(this.nodes[other_element].position) );
            }, separation_squared);
        }, Number.MAX_VALUE);

        return [chunks, Math.sqrt(separation_squared)];
    }
}

class AbstractLayoutStrategy {
    /*::
      +layoutNodes: (children: Array<Array<NodeData>> ) => Array<Array<NodeData>>;
      generator: groupElement;
      +layout: Layout;
      direction: Direction;
      nesting_level: number;
      elements: BitSet;
    */
    constructor (generator /*: groupElement */, direction /*: Direction */, nesting_level /*: number */) {
        this.generator = generator;          // element# (not 0)
        this.direction = direction;          // X/Y/Z for linear, YZ/XZ/XY for curved
        this.nesting_level = nesting_level;  // 0 for innermost, increasing to outermost
    }
        
    get strategyParameters () /*: StrategyParameters */ {
        return { generator: this.generator,
                 layout: this.layout,
                 direction: this.direction,
                 nestingLevel: this.nesting_level,
               };
    }

    width (nodes /*: Array<NodeData> */, direction /*: Direction */) /*: number */ {
        return nodes.reduce(
            (max /*: number */, node /*: NodeData */) =>
                Math.max(max, Math.abs(node.position.getComponent(DIRECTION_INDEX[direction]))),
            0 );
    }

    transformNodes (nodes /*: Array<NodeData> */, transform /*: THREE.Matrix4 */) {
        nodes.forEach( (node) => {
            node.position = node.position.applyMatrix4(transform);
            const chunk = node.chunk;
            if (chunk != undefined) {
                chunk.o.applyMatrix4(transform);
                chunk.x.applyMatrix4(transform);
                chunk.y.applyMatrix4(transform);
                chunk.z.applyMatrix4(transform);
            }
        } );
    }
}

// Scale and translate children to distribute them from 0 to 1 along the <direction> line
class LinearLayoutStrategy extends AbstractLayoutStrategy {
    constructor (generator /*: groupElement */, direction /*: Direction */, nesting_level /*: number */) {
        super(generator, direction, nesting_level);
    }

    get layout () /*: Layout */ {
        return 'linear';
    }

    layoutNodes (children /*: Array<Array<NodeData>> */) /*: Array<Array<NodeData>> */ {
        const direction_index = DIRECTION_INDEX[this.direction];
        const direction_vector = new THREE.Vector3(
            ...Array.from({length: 3}, (_, inx) => (direction_index == inx) ? 1 : 0));

        // number of children
        const num_children = children.length;

        // find a child diameter in <direction>, scale so all fit in [0,1] box
        const target_width = 1.4/(3*num_children - 1);  // heuristic
        const child_width = this.width(GEUtils.flatten( ((children /*: any */) /*: Tree<NodeData> */) ), this.direction);
        const scale = child_width < target_width ? 1 : target_width / child_width;

        // create scale transform
        let transform = (new THREE.Matrix4()).makeScale(
            ...Array.from({length: 3}, (_, inx) => (direction_index == inx) ? scale : 1));

        const scaled_width = scale*child_width;
        const step = (1 - scaled_width) / (num_children - 1);
        let translation = 0;  // initial value
        for (const child of children) {
            transform = transform.setPosition(direction_vector.clone().multiplyScalar(translation));
            this.transformNodes(child, transform);
            translation += step;
        }

        return children;
    }
}

// calculate position transform as a function of angle theta for plane directions
const positions = {
    YZ: (r, theta) => new THREE.Vector3(0,                        0.5 - r*Math.cos(theta),  0.5 - r*Math.sin(theta)),
    XZ: (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0,                        0.5 - r*Math.cos(theta)),
    XY: (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0.5 - r*Math.cos(theta),  0),
};

class CurvedLayoutStrategy extends AbstractLayoutStrategy {
    /*::
      position: (r: number, theta: number) => THREE.Vector3;
    */
    constructor(generator /*: groupElement */, direction /*: Direction */, nesting_level /*: number */) {
        super(generator, direction, nesting_level);
        this.position = (r, theta) => positions[((direction /*: any */) /*: PlaneDirection */)](r, theta);
    }
}

// Scale children to fit and translate them so they're distributed
//   around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
class CircularLayoutStrategy extends CurvedLayoutStrategy {
    constructor(generator /*: groupElement */, direction /*: Direction */, nesting_level /*: number */) {
        super(generator, direction, nesting_level);
    }

    get layout() /*: Layout */ {
        return 'circular';
    }

    layoutNodes(children /*: Array<Array<NodeData>> */) /*: Array<Array<NodeData>> */ {
        // make circle radius to fit in [0,1] box
        const r = 0.5;

        // scale two directions, not the third?
        // scale differently in 2 directions (esp rotated -- make old x < 0.25)
        const scale = 0.4;  // heuristic
        const transform = (new THREE.Matrix4()).makeScale(
            ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (DIRECTION_INDEX[this.direction] == inx) ? 1 : scale)).toArray()
        )

        // translate children to [0.5, 0.5] + [r*sin(th), -r*cos(th)]
        children.forEach( (child, inx) => {
            transform.setPosition(this.position(r, 2*inx*Math.PI/children.length));
            this.transformNodes(child, transform);
        } );

        return children;
    }
}

// calculate rotation transform as a function of angle theta for plane directions
const rotations = {
    YZ: (theta) => new THREE.Matrix4().makeRotationX(theta + Math.PI/2),
    XZ: (theta) => new THREE.Matrix4().makeRotationY(theta + Math.PI/2),
    XY: (theta) => new THREE.Matrix4().makeRotationZ(theta + Math.PI/2),
};

// Scale children to fit, rotate them PI/2 + 2*inx*PI/n, and translate them
//   so they're distributed around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
class RotatedLayoutStrategy extends CurvedLayoutStrategy {
    /*::
      rotation: (theta: number) => THREE.Matrix4;
    */
    constructor(generator /*: groupElement */, direction /*: Direction */, nesting_level /*: number */) {
        super(generator, direction, nesting_level);
        this.rotation = (theta) => rotations[((direction /*: any */) /*: PlaneDirection */)](theta);
    }

    get layout() /*: Layout */ {
        return 'rotated';
    }

    layoutNodes(children /*: Array<Array<NodeData>> */) /*: Array<Array<NodeData>> */ {
        // make circle radius to fit in [0,1] box
        const r = 0.5;

        // scale two directions, not the third?
        // scale differently in 2 directions (esp rotated -- make old x < 0.25)

        // make size of transformed child about half the distance between nodes
        const scale = Math.min(0.25, Math.max(0.1, Math.PI/2/children.length));	// heuristic
        const scale_transform = (new THREE.Matrix4()).makeScale(
            ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (DIRECTION_INDEX[this.direction] == inx) ? 1 : scale)).toArray()
        )

        // scale, rotation, and translate each child
        children.forEach( (child, inx) => {
            const theta = 2*inx*Math.PI/children.length;
            const transform = scale_transform.clone()
                  .multiply(this.rotation(theta))
                  .setPosition(this.position(r, theta));
            this.transformNodes(child, transform);
        } );

        return children;
    }
}

const STRATEGY_BY_LAYOUT = {
    linear: LinearLayoutStrategy,
    circular: CircularLayoutStrategy,
    rotated: RotatedLayoutStrategy
};




function createInitialNodes (group /*: XMLGroup */) /*: Array<NodeData> */ {
    const nodes = group.elements.map( (element) => {
        return {
            position: new THREE.Vector3(),
            element: element,
            label: group.representation[element],
            centers: [],
        };
    } );
    return nodes;
}


export class CayleyGeneratorFromSpec /*:: implements CayleyDiagramGenerator */ {
    /*::
      group: XMLGroup;
      diagram_name: string;
      nodes: Array<NodeData>;
      arrows: Array<ArrowData>;
    */
    constructor (group /*: XMLGroup */, diagram_name /*: string */) {
        this.group = group;
        this.diagram_name = diagram_name;
        const cayley_diagram =
              ((this.group.cayleyDiagrams.find( (cd) => cd.name == diagram_name ) /*: any */) /*: XMLCayleyDiagram */);
        this.nodes = createInitialNodes(group);
        cayley_diagram.points.forEach( (point, inx) => this.nodes[inx].position.set(...point) );
        this.arrows = this.createArrows(cayley_diagram.arrows, true);
    }

    get generatesFromStrategy () /*: boolean */ {
        return false;
    }

    createArrows (generators /*: Array<groupElement> */, right_multiply /*: boolean */) {
        const multiply = (a, b) => right_multiply ? this.group.mult(a, b) : this.group.mult(b, a);
              
        const new_arrows = generators.reduce( (arrows_by_generator, generator, inx) => {
            const color = '#' + new THREE.Color(GEUtils.fromRainbow(inx/generators.length, 1.0, 0.2)).getHexString();
            return this.group.elements.reduce( (arrows, element) => {
                const product = multiply(element, generator);
                const bidirectional = (multiply(product, generator) == element);
                if (!bidirectional || element < product) {  // test element < product so we only draw an undirected line once
                    const new_arrow = {
                        start_node: this.nodes[element],
                        end_node: this.nodes[product],
                        generator: generator,
                        bidirectional: bidirectional,
                        thirdPoint: this.getThirdPoint(this.nodes[element], this.nodes[product]),
                        keepCurved: false,
                        color: color,
                    };
                    arrows.push(new_arrow);
                };
                return arrows;
            }, arrows_by_generator );
        }, [] );

        return new_arrows;
    }

    /* Find center, a third point that establishes the plane of the start-end arrow
     *   If...						Then use...
     *      origin, start, and end aren't colinear	  (0,0,0)
     *      all nodes lie in one plane (XY, YZ, XZ)	  plane normal X (end - start)
     *      (1,0,0), start, and end aren't colinear	  (1,0,0)
     *      (0,1,0), start, and end can't be colinear	  (0,1,0)
     */
    getThirdPoint (start_node /*: NodeData */, end_node /*: NodeData */) /*: THREE.Vector3 */ {
        const start = start_node.position;
        const end = end_node.position;
        let center;
        if (new THREE.Vector3().crossVectors(start, end).lengthSq() > 1.0e-6) {
            center = new THREE.Vector3(0, 0, 0);
        } else if (this.nodes.every( (node) => node.position.x == 0 )) {
            center = new THREE.Vector3(1, 0, 0).cross(end.clone().sub(start));
        } else if (this.nodes.every( (node) => node.position.y == 0 )) {
            center = new THREE.Vector3(0, 1, 0).cross(end.clone().sub(start));
        } else if (this.nodes.every( (node) => node.position.z == 0 )) {
            center = new THREE.Vector3(0, 0, 1).cross(end.clone().sub(start));
        } else if (new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0).sub(start),
                                                    new THREE.Vector3(1, 0, 0).sub(end)).lengthSq() > 1.0e-6) {
            center = new THREE.Vector3(1, 0, 0);
        } else {
            center = new THREE.Vector3(0, 1, 0);
        }
        return center;
    }
}
