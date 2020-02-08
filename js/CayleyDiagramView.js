// @flow

import BitSet from './BitSet.js';
import {AbstractDiagramDisplay} from './AbstractDiagramDisplay.js';
import {DEFAULT_LINE_COLOR, DEFAULT_SPHERE_COLOR as DEFAULT_NODE_COLOR} from './AbstractDiagramDisplay.js';
import {CayleyGeneratorFromStrategy, CayleyGeneratorFromSpec} from './CayleyGenerator.js';
import GEUtils from './GEUtils.js';
import Library from './Library.js';
import MathML from './MathML.js';
import XMLGroup from './XMLGroup.js';

export {DEFAULT_SPHERE_COLOR as DEFAULT_NODE_COLOR} from './AbstractDiagramDisplay.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import type {AbstractDiagramDisplayOptions} from './AbstractDiagramDisplay.js';
import type {Tree} from './GEUtils.js';
import type {XMLCayleyDiagram} from './XMLGroup.js';
import {VizDisplay} from './SheetModel.js';
import type {Layout, Direction, StrategyParameters} from './CayleyGenerator.js';

export type {Layout, Direction, StrategyParameters} from './CayleyGenerator.js';

export type NodeData = {
    position: THREE.Vector3,
    color?: css_color,
    element: groupElement,
    label: mathml,
    centers: Array<THREE.Vector3>,
    chunk?: ChunkData,
} & Obj;

export type NodeUserData = {
    node: NodeData,
};

export type ArrowData = {
   start_node: NodeData,
   end_node: NodeData,
   generator: groupElement,
   bidirectional: boolean,
   thirdPoint: THREE.Vector3,
   keepCurved: boolean,  // true => use specified offset
   offset?: float,  // undefined => straight line
   color: css_color,
} & Obj;

export type ArrowUserData = {
   arrow: ArrowData,
   meshLine?: MeshLine,  // undefined => webgl native line
};

export type ChunkData = {
   name: mathml,
   o: THREE.Vector3,
   x: THREE.Vector3,
   y: THREE.Vector3,
   z: THREE.Vector3,
   xWidth: float,
   yWidth: float,
   zWidth: float,
};

export interface CayleyDiagramGenerator {
   +generatesFromStrategy: boolean;
    nodes: Array<NodeData>;
    arrows: Array<ArrowData>;
    createArrows(generator: Array<groupElement>, right_multiply: boolean): Array<ArrowData>;
};

type NodeDataJSON = {
    position: {x: float, y: float, z: float},
    element: groupElement,
    label: mathml,
};

type ArrowDataJSON = {
    start_element: groupElement,
    end_element: groupElement,
    generator: groupElement,
    thirdPoint: {x: float, y: float, z: float},
    offset: ?float,
    color: css_color,
};

export type CayleyDiagramJSON = {
    background: css_color,
    camera_matrix: Array<number>,
    fog_level: float,
    line_width: number,
    sphere_base_radius: float,
    sphere_scale_factor: float,
    zoom_level: number,
 
    arrows?: Array<ArrowDataJSON>, 
    arrow_generators?: Array<{|generator: groupElement, color: css_color|}>,
    arrowhead_placement: float,
    chunk?: integer, 
    diagram_name?: string, 
    groupURL: string,
    label_scale_factor: float,
    nodes?: Array<NodeDataJSON>,
    right_multiply?: boolean, 
    strategy_parameters?: Array<StrategyParameters>,
    highlights?: {
        background?: Array<css_color>,
        ring?: Array<?css_color>,
        square?: Array<?css_color>,
    }
};

export type CayleyDiagramViewOptions = {
} & AbstractDiagramDisplayOptions;
*/

const CAYLEY_DIAGRAM_BACKGROUND_COLOR = '#E8C8C8';
const CAYLEY_DIAGRAM_DISPLAY_GROUP_NAMES = ['labels', 'arrowheads', 'highlights', 'chunks'];

const DEFAULT_ARC_OFFSET = 0.2;

export class CayleyDiagramView extends AbstractDiagramDisplay  /*:: implements VizDisplay<CayleyDiagramView, CayleyDiagramJSON> */ {
/*::
    displays_labels: boolean;
    _label_scale_factor: float;
    _arrowhead_placement: float;

    group: XMLGroup;
    generator: CayleyDiagramGenerator;
    _right_multiply: boolean;
    color_highlights: Array<css_color> | void;
    ring_highlights: Array<?css_color> | void;
    square_highlights: Array<?css_color> | void;
*/
    constructor (options /*: CayleyDiagramViewOptions */ = {}) {
        super(options);
        
        // Add new Groups to Scene
        CAYLEY_DIAGRAM_DISPLAY_GROUP_NAMES.forEach( (name) => {
            const group = new THREE.Group();
            group.name = name;
            this.scene.add(group);
        } );

        // Set background
        this.background = CAYLEY_DIAGRAM_BACKGROUND_COLOR;
    }

    // get objects at point x,y using raycasting
    getObjectsAtPoint (x /*: number */, y /*: number */) /*: Array<THREE.Object3D> */ {
        const point = new THREE.Vector2(x, y);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(point, this.camera);

        const spheres = this.getGroup('spheres').children;
        let intersects = raycaster.intersectObjects(spheres, false);
        if (intersects.length == 0) {
            const chunks = this.getGroup('chunks').children;
            intersects = raycaster.intersectObjects(chunks, false);
        }

        return intersects.map( (intersect) => intersect.object );
    }

    drawFromModel () {
        this.sphere_base_radius = 0.3 / Math.sqrt(this.group.order);
        this.setCamera();
        this.deleteAllObjects();
        this.createSpheres(this.nodes);
        this.drawAllHighlights();
        if (this.displays_labels)
            this.createLabels();
        this.createLines(this.arrows);
    }

    deleteAllObjects () {
        super.deleteAllObjects();
        this.deleteAllHighlights();
        this.deleteAllLabels();
        this.deleteAllLines();
        this.deleteAllChunks();
    }
    
    ////////////////////////////   Camera   /////////////////////////////////////////

    /*
     * Position the camera and point it at the center of the scene
     *
     * Camera positioned to match point of view in GE2:
     *   If diagram is generated by GE:
     *     If diagram lies entirely in y-z plane (all x == 0)
     *       place camera on z-axis, x-axis to the right, y-axis down
     *     If diagram lies entirely in the x-z plane
     *       place camera on negative y-axis, x-axis to the right, z-axis up
     *     If diagram lies entirely in the x-y plane
     *       place camera on negative z-axis, x-axis to the right, y-axis down
     *     Otherwise place camera with y-axis down, offset a bit from
     *       the (1,-1,-1) vector so that opposite corners don't line up
     *       and make cubes look flat
     *   Else (diagram is specified in .group file)
     *     Use AbstractDiagramDisplay.setCamera (shared with SymmetryObjectDisplay)
     */
    setCamera () {
        const sphere_data = this.nodes;
        if (this.isGenerated) {
            let location, up;            
            if (sphere_data.every( (sphere) => sphere.position.x == 0.0 )) {
                location = new THREE.Vector3(3, 0, 0);
                up = new THREE.Vector3(0, -1, 0);
            } else if (sphere_data.every( (sphere) => sphere.position.y == 0.0 )) {
                location = new THREE.Vector3(0, -3, 0);
                up = new THREE.Vector3(0, 0, 1);
            } else if (sphere_data.every( (sphere) => sphere.position.z == 0.0 )) {
                location = new THREE.Vector3(0, 0, -3);
                up = new THREE.Vector3(0, -1, 0);
            } else {
                location = new THREE.Vector3(1.7, -1.6, -1.9);
                up = new THREE.Vector3(0, -1, 0);
            }

            const radius = Math.sqrt(Math.max(1, ...sphere_data.map( (sphere) => sphere.position.lengthSq() )));
            location.multiplyScalar(radius);
            
            this.camera.position.copy(location);
            this.camera.up.copy(up);
            this.camera.lookAt(new THREE.Vector3());
        } else {
            super.setCameraFromNodes(sphere_data);
        }
    }

    ////////////////////////////   Sphere routines   ////////////////////////////////

    get sphere_scale_factor () {
        return super.sphere_scale_factor;
    }

    set sphere_scale_factor (new_scale_factor /*: float */) {
        const old_sphere_radius = this.sphere_base_radius * this.sphere_scale_factor;
        super.sphere_scale_factor = new_scale_factor;
        const new_sphere_radius = this.sphere_base_radius * this.sphere_scale_factor;

        this.updateHighlightRadius();
        this.redrawAllLines();
        this.updateLabelRadius(old_sphere_radius, new_sphere_radius);
    }

    createSpheres (sphere_data /*: Array<NodeData> */) {
        super.createSpheres(sphere_data);
        this.getGroup('spheres').children.forEach( (sphere) => sphere.name = sphere.userData.node.label );
    }

    moveSphere (sphere /*: THREE.Mesh */, position /*: THREE.Vector3*/) {
        // update sphere position in scene and userData
        sphere.position.copy(position);
        const node = sphere.userData.node;
        node.position.copy(position);

        // update highlight positions
        this.getGroup('highlights').children.forEach( (highlight) => {
            if (highlight.userData.node == node) {
                highlight.position.copy(position);
            }
        } );
        
        // update label position
        const label = this.getGroup('labels').children.find( (label) => label.userData.node == node );
        if (label != undefined) {
            label.position.copy(position);
        }
        
        // redraw connected lines (lines with this node as start or end)
        const affected_lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */)
              .filter( (line) => line.userData.arrow.start_node == node || line.userData.arrow.end_node == node )
              .map( (line) => line.userData.arrow );
        this.redrawLines(affected_lines);
    }

    unitSquarePosition (element /*: groupElement */) /* x: float, y: float */ {
        const point = this.nodes[element].position.clone().project(this.camera)
        return {x: point.x/2 + 1/2, y: -point.y/2 + 1/2};
    }

    ////////////////////////////   Highlight routines   ///////////////////////////

    drawAllHighlights () {
        this.drawColorHighlights();
        this.drawShapedHighlights('ring');
        this.drawShapedHighlights('square');
    }

    drawColorHighlights (elements /*: ?Array<Array<groupElement>> */) {
        if (elements != undefined) {
            const color_highlights = this.color_highlights = Array(this.group.order);
            elements.forEach( (subset, subset_index) => {
                const color = '#' + new THREE.Color(GEUtils.fromRainbow(subset_index/elements.length, 0.53, 0.30)).getHexString();
                subset.forEach( (element) => color_highlights[element] = color );
            } );
        }

        const color_highlights = this.color_highlights;
        if (color_highlights != undefined) {
            const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
            spheres.forEach( (sphere, inx) => {
                const color = (color_highlights[inx] == undefined) ? sphere.userData.node.color : color_highlights[inx];
                sphere.material.color.set(color);
            } );
        }
    }

    drawRingHighlights(elements /*: Array<Array<groupElement>> */) {
        this.drawShapedHighlights('ring', elements);
    }

    drawSquareHighlights(elements /*: Array<Array<groupElement>> */) {
        this.drawShapedHighlights('square', elements);
    }

    drawShapedHighlights (shape /*: 'ring' | 'square' */, elements /*: ?Array<Array<groupElement>> */) {
        if (elements != undefined) {
            const highlights = Array(this.group.order);
            elements.forEach( (subset, subset_index) => {
                const color = '#' + new THREE.Color(GEUtils.fromRainbow(subset_index/elements.length, 0.53, 0.30)).getHexString();
                subset.forEach( (element) => highlights[element] = color );
            } );
            if (shape == 'ring') {
                this.ring_highlights = highlights;
            } else {
                this.square_highlights = highlights;
            }
        }

        this.deleteHighlights(shape);
        const highlights = (shape == 'ring') ? this.ring_highlights : this.square_highlights;
        if (highlights != undefined) {
            const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
            highlights.forEach( (color, element) => {
                if (color)
                    this.drawHighlight(spheres[element], shape, color);
            } )
        }
    }

    drawHighlight (sphere /*: THREE.Mesh */, shape /*: 'ring' | 'square' */, highlight_color /*: css_color */) {
        const scale = (shape == 'ring' ? 2.5 : 2.65) * this.sphere_radius;  // must clear underlying sphere
        const line_width = (shape == 'ring' ? 0.66 : 1.2) / scale;  // scales to webGl lineWidth = 10

        const node = sphere.userData.node;

        // create new canvas with enough pixels to get smooth figure
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;

        // get context, draw figure
        const context = canvas.getContext('2d');
        context.lineWidth = line_width;
        context.strokeStyle = highlight_color;
        context.beginPath();
        if (shape == 'ring') {
            context.arc(canvas.width/2, canvas.height/2, canvas.width/2-6, 0, 2*Math.PI);
        } else {
            context.rect(0, 0, canvas.width, canvas.height);
        }
        context.stroke();

        // create texture, material, sprite
        const material = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(canvas)});
        const highlight = new THREE.Sprite(material);

        // scale, position middle of highlight
        highlight.name = shape == 'ring' ? 'ring' : 'square';
        highlight.scale.set(scale, scale, 1);
        highlight.center = new THREE.Vector2(0.5, 0.5);
        highlight.position.copy(node.position);
        highlight.userData = sphere.userData;

        this.getGroup('highlights').add(highlight);
    }

    updateHighlightRadius () {
        const sphere_radius = this.sphere_radius;
        this.getGroup('highlights').children.forEach( (highlight) => {
            const scale = (highlight.name == 'ring') ? 2.5*sphere_radius : 2.65*sphere_radius;
            highlight.scale.set(scale, scale, 1);
        } )
    }

    clearHighlightDefinitions () {
        this.color_highlights = this.ring_highlights = this.square_highlights = undefined;
    }

    clearHighlights () {
        this.clearHighlightDefinitions();
        this.deleteAllHighlights();
    }

    deleteAllHighlights () {
        this.deleteHighlights();
    }

    deleteHighlights (type /*: ?('ring' | 'square' | 'color') */) {
        if (type == undefined || type == 'color') {
            const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
            spheres.forEach( (sphere, inx) => sphere.material.color.set(sphere.userData.node.color) );
        }

        if (type == undefined || type != 'color') {
            const highlight_group = this.getGroup('highlights');
            let highlights = ((highlight_group.children /*: any */) /*: Array<THREE.Sprite> */);
            if (type != undefined)
                highlights = highlights.filter( (sprite) => sprite.name == type );
            highlights.forEach( (sprite) => {
                sprite.geometry.dispose();
                sprite.material.map.dispose();
                sprite.material.dispose();
            } );
            highlight_group.remove(...highlights);
        }
    }

    ////////////////////////////   Label routines   ///////////////////////////////

    get label_scale_factor () {
        if (this._label_scale_factor == undefined) {
            this._label_scale_factor = 1;
        }

        return this._label_scale_factor;
    }

    set label_scale_factor (label_scale_factor /*: float */) {
        const labels = ((this.getGroup('labels').children /*: any */) /*: Array<THREE.Sprite> */);
        if (label_scale_factor != this.label_scale_factor && labels.length != 0) {
            if (label_scale_factor == 0) {
                labels.forEach( (label) => label.material.visible = false );
            } else {
                const sphere_radius = this.sphere_base_radius * this.sphere_scale_factor;
                const old_label_scale_factor = labels[0].scale.x / (sphere_radius * 8.197 * 2);
                labels.forEach( (label) => {
                    label.material.visible = true;
                    label.scale.multiplyScalar(label_scale_factor / old_label_scale_factor);
                    label.center.set(-0.045/label_scale_factor, 0.30 - 0.72/label_scale_factor);
                } );
            }
        }

        this._label_scale_factor = label_scale_factor;
    }

    createLabels () {
        if (this.label_scale_factor == 0) {
            return;
        }

        const label_scale_factor = this.label_scale_factor;
        const label_group = this.getGroup('labels');
        const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
        const radius = spheres[0].scale.x;
        const big_node_limit = 0.1, small_node_limit = 0.05;
        const {canvas_width, canvas_height, label_font} =
              (radius >= big_node_limit)   ? {canvas_width: 4096, canvas_height: 256, label_font: '120pt Arial'} :
              (radius <= small_node_limit) ? {canvas_width: 1024, canvas_height: 64,  label_font: '32pt Arial'} :
                                             {canvas_width: 2048, canvas_height: 128, label_font: '64pt Arial'};
        const scale = label_scale_factor * radius * 8.197 * 2;  // factor to make label size ~ radius

        spheres.forEach( (sphere) => {
            const node = ((sphere.userData /*: any */) /*: NodeUserData */).node;
            if (node.label === undefined || node.label == '') {
                return;
            };

            // make canvas big enough for any label and offset it to clear the node while still being close
            const canvas = document.createElement('canvas');
            canvas.id = `label_${node.element}`;
            const context = canvas.getContext('2d');

            const text_label = MathML.toUnicode(node.label);
            canvas.width =  canvas_width;
            canvas.height = canvas_height;
            // debug -- paint label background
            //   context.fillStyle = 'rgba(0, 0, 100, 0.5)';
            //   context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = label_font;
            context.fillStyle = 'rgba(0, 0, 0, 1)';
            context.fillText(text_label, 0, 0.7*canvas.height);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            const label_material = new THREE.SpriteMaterial({ map: texture });
            const label = new THREE.Sprite( label_material );
            label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);
            label.center = new THREE.Vector2(-0.045/label_scale_factor, 0.30 - 0.72/label_scale_factor);
            label.position.copy(node.position);
            label.userData.node = node;

            label_group.add(label);
        } )
    }

    updateLabelRadius (old_sphere_radius /*: float */, new_sphere_radius /*: float */) {
        const labels = this.getGroup('labels').children;
        if (labels.length != 0) {
            const new_label_scale = labels[0].scale.multiplyScalar(new_sphere_radius / old_sphere_radius);
            labels.forEach( (label) => label.scale.copy(new_label_scale) );
        }
    }

    deleteAllLabels () {
        const label_group = this.getGroup('labels');
        const labels = ((label_group.children /*: any */) /*: Array<THREE.Sprite> */);
        labels.forEach( (label) => {
            label.geometry.dispose();
            label.material.map.dispose();
            label.material.dispose();
        } );
        label_group.remove(...labels);
    }

    ////////////////////////////   Line routines   ////////////////////////////////

    get arrowhead_placement () {
        if (this._arrowhead_placement == undefined) {
            this._arrowhead_placement = 1;
        }

        return this._arrowhead_placement;
    }

    set arrowhead_placement (arrowhead_placement /*: float */) {
        if (this.arrowhead_placement == arrowhead_placement) {
            return;
        }

        this._arrowhead_placement = arrowhead_placement;

        this.redrawAllLines();
    }

    get line_width () /*: number */ {
        return super.line_width;
    }

    set line_width (line_width /*: number */) {
        if (this.line_width == line_width) {
            return;
        }

        const lines = this.getGroup('lines').children;
        if (lines.length == 0) {
            this._line_width = line_width;
        } else {
            const old_width = this._line_width;
            if (this.canUpdateLineWidthInPlace(old_width, line_width)) {
                this.updateLineWidthInPlace(line_width);
                this._line_width = line_width;
            } else {
                const line_data = lines.map( (line) => line.userData.arrow );
                this.deleteAllLines();
                this._line_width = line_width;
                this.createLines(line_data);
            }
        }
    }

    // Create arrows between start and end nodes
    createLines (line_data /*: Array<ArrowData> */) {
        line_data.forEach( (line_datum) => {
            // Curve straight lines to avoid spheres
            if (line_datum.offset == undefined) {
                line_datum.offset = this.offsetAroundSpheres(line_datum);
            }

            if (line_datum.offset == undefined) {
                this.createStraightLine(line_datum);
            } else {
                this.createCurvedLine(line_datum);
            }
        } );
    }

    colorAllLines () {
        const lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */);
        lines.forEach( (line) => line.material.color.set(line.userData.arrow.color) );

        this.getGroup('arrowheads').children.forEach( (arrowhead) => {
            const color = arrowhead.userData.arrow.color;
            ((arrowhead /*: any */) /*: {line: THREE.Mesh} */).line.material.color.set(color);
            ((arrowhead /*: any */) /*: {cone: THREE.Mesh} */).cone.material.color.set(color);
        } );
    }
    
    createStraightLine (line_datum /*: ArrowData */) {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(line_datum.start_node.position, line_datum.end_node.position);
        const new_line = this.createLine(geometry);
        new_line.material.color.set(line_datum.color);
        new_line.userData.arrow = line_datum;
        this.getGroup('lines').add(new_line);

        if (!line_datum.bidirectional) {
            const start = line_datum.start_node.position;
            const end = line_datum.end_node.position;
            const curve = new THREE.LineCurve3(start, end);
            const curve_length = start.distanceTo(end);
            this.addArrowhead(line_datum, curve, curve_length);
        }
    }

    createCurvedLine (line_datum /*: ArrowData */) {
        const start = line_datum.start_node.position;
        const end = line_datum.end_node.position;
        const middle = start.clone().add(end).multiplyScalar(1/2);
        const middle2end = end.clone().sub(middle);
        const thirdPoint = line_datum.thirdPoint;
        const normal = new THREE.Plane().setFromCoplanarPoints(start, thirdPoint, end).normal;
        const offset = ((line_datum.offset /*: any */) /*: float */) * start.distanceTo(end);
        const middle_control =
              new THREE.Vector3().crossVectors(normal, middle2end).normalize().multiplyScalar(2*offset).add(middle);
        const curve = new THREE.QuadraticBezierCurve3(start, middle_control, end);
        const geometry = new THREE.Geometry();
        geometry.vertices = curve.getPoints(10);
        const new_line = this.createLine(geometry);
        new_line.material.color.set(line_datum.color);
        new_line.userData.arrow = line_datum;
        this.getGroup('lines').add(new_line);

        if (!line_datum.bidirectional) {
            const curve_length = curve.getLength();
            this.addArrowhead(line_datum, curve, curve_length);
        }
    }

    addArrowhead (line_datum /*: ArrowData */, curve /*: THREE.Curve */, curve_length /*: float */) {
        const sphere_radius = this.sphere_radius;
        const head_length = Math.min(sphere_radius, (curve_length/2 - sphere_radius));
        const head_width = 0.6 * head_length;
        const arrow_length = 1.1 * head_length;
        const arrowhead_placement = this.arrowhead_placement;
        
        const arrow_place = 0.001 +     // 0.001 offset to make arrowhead stop at node surface
              (sphere_radius - 0.1*head_length + (curve_length - 2*sphere_radius - head_length) * arrowhead_placement) / curve_length;
        const arrow_tip = curve.getPointAt(arrow_place + head_length/curve_length);
        const arrow_start = curve.getPointAt(arrow_place);
        const arrow_direction = arrow_tip.clone().sub(arrow_start).normalize();
        const arrow_color = line_datum.color;
        const arrowhead = new THREE.ArrowHelper(arrow_direction, arrow_start, arrow_length, arrow_color, head_length, head_width);

        arrowhead.line.material.opacity = 0;
        arrowhead.line.material.transparent = true;
        arrowhead.userData.arrow = line_datum;

        this.getGroup('arrowheads').add(arrowhead);
    }

    /* DIY raycasting
     *   (there's probably a better way to do this, but THREE.Raycasting
     *    is slow and gives confusing results with multiple intersects)
     * For every node in scene (except the start and end nodes of the line),
     * see if the node lies on the line between the start and end nodes
     *   "on the line" <=> |(start-node)×(node-end)| ~ 0
     *   "between them" <=> (start-node)⋅(node-end) > 0
     * if so, calculate offset to miss node from node radius
     */
    offsetAroundSpheres (line_datum /*: ArrowData */) /*: ?float */ {
        const start_node = line_datum.start_node;
        const end_node = line_datum.end_node;
        const sphere = this.getGroup('spheres').children.find( (sphere) => {
            const node = sphere.userData.node;
            if (node == start_node || node == end_node) {
                return false;
            }
            const v1 = start_node.position.clone().sub(node.position);
            const v2 = node.position.clone().sub(end_node.position);
            return v1.dot(v2) > 0 && new THREE.Vector3().crossVectors(v1, v2).lengthSq() < 1.0e-6;
        } );
        const offset = (sphere == undefined) ? undefined : 1.4 * sphere.scale.x;  // Heuristic value

        return offset;
    }

    redrawAllLines () {
        const lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */);
        this.redrawLines(lines.map( (line) => line.userData.arrow ));
    }

    redrawLines (line_data /*: Array<ArrowData> */) {
        // clear user data offset  (if !keepCurved)
        line_data.forEach( (arrow) => arrow.offset = arrow.keepCurved ? arrow.offset : undefined );

        // delete old lines and create new ones
        this.deleteLines(line_data);
        this.createLines(line_data);
    }

    deleteAllLines () {
        const lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */);
        this.deleteLines(lines.map( (line) => line.userData.arrow ));
    }

    deleteLines (line_data /*: Array<ArrowData> */) {
        // delete arrowheads associated with lines
        const arrowhead_group = this.getGroup('arrowheads');
        const arrowheads = arrowhead_group.children
              .filter( (arrowhead) => (line_data.findIndex( (line_datum) => line_datum == arrowhead.userData.arrow ) != -1) );
        arrowhead_group.remove(...arrowheads);

        // delete lines, disposing of geometry and material
        const line_group = this.getGroup('lines');
        const lines = ((line_group.children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */)
              .filter( (line) => (line_data.findIndex( (line_datum) => line_datum == line.userData.arrow ) != -1) );
        lines.forEach( (line) => line.geometry.dispose() );
        line_group.remove(...lines);
    }

    ////////////////////////////   Chunking routines   ////////////////////////////

    createChunks (chunk_data /*: Array<ChunkData> */, separation /*: float */) {
        this.deleteAllChunks();

        const chunk_group = this.getGroup('chunks');
        const box_material = new THREE.MeshBasicMaterial( {
            color: '#303030',
            opacity: 0.2,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: false,  // needed to keep from obscuring labels underneath
            depthTest: false,
        } );

        const M0 = new THREE.Matrix4().set(-1, -1, -1,  1,
                                            1,  0,  0,  0,
                                            0,  1,  0,  0,
                                            0,  0,  1,  0);

        // find closest sphere to any sphere in this chunk, to determine padding
        // Find closes sphere to first sphere in this chunk? What spheres (elements?) are in this chunk?

        let box_geometry;  // created first time through, shared by all chunks

        chunk_data.forEach( (chunk_datum, inx) => {
            const {o, x, y, z} = chunk_datum;

            // draw canonical box
            if (inx == 0) {
                const padding = Math.max(2*this.sphere_radius, Math.min(4*this.sphere_radius, 0.8*separation) );
                box_geometry = new THREE.BoxGeometry(
                    chunk_datum.xWidth + padding/x.clone().sub(o).length(),
                    chunk_datum.yWidth + padding/y.clone().sub(o).length(),
                    chunk_datum.zWidth + padding/z.clone().sub(o).length()
                );
            }
            
            // make transformation
            // M = {O, X, Y, Z} . M0
            const M = new THREE.Matrix4().set(o.x, x.x, y.x, z.x,
                                              o.y, x.y, y.y, z.y,
                                              o.z, x.z, y.z, z.z,
                                               1,   1,   1,   1  )
                                         .multiply(M0);

            // create new box and transform to location
            const new_chunk = new THREE.Mesh(box_geometry, box_material);
            new_chunk.applyMatrix(M);
            new_chunk.name = chunk_datum.name;

            chunk_group.add(new_chunk);
        } )
    }

    deleteAllChunks () {
        const chunk_group = this.getGroup('chunks');
        const chunks = ((chunk_group.children /*: any */) /*: Array<THREE.Mesh> */);
        chunks.forEach( (chunk) => chunk.geometry.dispose() );
        chunk_group.remove(...chunks);
    }

    /////////////////////   Cayley diagram routines   /////////////////////////////

    setDiagram (group /*: XMLGroup */, diagram_name /*: ?string */, strategy_parameters /*: ?Array<StrategyParameters> */) {
        if (this.group != group) {
            this.clearHighlightDefinitions();
            this.group = group;
        }

        if (diagram_name != undefined) {
            this.generator = new CayleyGeneratorFromSpec(group, diagram_name);
        } else {
            this.generator = new CayleyGeneratorFromStrategy(group, strategy_parameters);
        }
        this.drawFromModel();
    }

    get isGenerated () /*: boolean */ {
        return this.generator.generatesFromStrategy;
    }

    get chunk () /*: ?integer */ {
        return this.isGenerated ? ((this.generator /*: any */) /*: CayleyGeneratorFromStrategy */).chunk : undefined;
    }

    set chunk (subgroup_index /*: integer */) {
        if (this.isGenerated) {
            const generator = ((this.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
            generator.chunk = subgroup_index;

            const [chunk_data, separation] = generator.createChunks();
            this.createChunks(chunk_data, separation);
        }
    }

    get diagram_name () /*: ?string */ {
        return (this.isGenerated) ? undefined : ((this.generator /*: any */) /*: CayleyGeneratorFromSpec */).diagram_name;
    }

    get strategy_parameters () /*: ?Array<StrategyParameters> */ {
        return (this.isGenerated) ? ((this.generator /*: any */) /*: CayleyGeneratorFromStrategy */).strategy_parameters : undefined;
    }

    get nodes () {
        return this.generator.nodes;
    }

    get arrows () {
        return this.generator.arrows;
    }

    get right_multiply () /*: boolean */ {
        if (this._right_multiply == undefined) {
            this._right_multiply = true;
        }

        return this._right_multiply;
    }

    set right_multiply (right_multiply /*: boolean */) {
        if (this.right_multiply != right_multiply) {
            this._right_multiply = right_multiply;

            // get Set of arrow generators
            const generators = new Set( this.arrows.map( (arrow) => arrow.generator ) );

            // remove all arrows, then add them all back
            this.removeArrows();
            this.addArrows(Array.from(generators));
        }
    }
    
    // in model and view
    addArrows (generators /*: Array<groupElement> */) {
        const new_arrows = this.generator.createArrows(generators, this.right_multiply);
        this.arrows.push(...new_arrows);
        this.createLines(new_arrows);

        this.reColorArrows();

        this.colorAllLines();
    }

    // re-color all arrows
    reColorArrows () {
        const generator_color_map = new Map(this.arrows.map( (arrow) => [arrow.generator, ''] ));
        Array.from(generator_color_map.keys()).forEach( (generator, inx) => {
            const color_string = '#' + new THREE.Color(GEUtils.fromRainbow(inx/generator_color_map.size, 1.0, 0.2)).getHexString();
            generator_color_map.set(generator, color_string);
        } );
        this.arrows.forEach( (arrow) => arrow.color = generator_color_map.get(arrow.generator) );
    }        

    // Removes arrows generated by generator from model and view
    //   (undefined generator => remove all arrows)
    removeArrows (generators /*: ?Array<groupElement> */) {
        if (generators == undefined) {
            this.generator.arrows.length = 0;
            this.deleteAllLines()
        } else {
            const removed_arrows =
                  this.arrows.filter( (arrow) => generators.findIndex( (generator) => arrow.generator == generator ) != -1 );
            this.generator.arrows =
                this.arrows.filter( (arrow) => generators.findIndex( (generator) => arrow.generator == generator ) == -1 );
            this.deleteLines(removed_arrows);
        }
    }

    ////////////////////////////   JSON routines   ////////////////////////////////

   toJSON () /*: CayleyDiagramJSON */ {
        const tmp  = Object.assign( {}, {
            background: this.background,
            fog_level: this.fog_level,
            line_width: this.line_width,
            sphere_base_radius: this.sphere_base_radius,
            sphere_scale_factor: this.sphere_scale_factor,
            zoom_level: this.zoom_level,
            camera_matrix: this.camera.matrix.toArray(),

            label_scale_factor: this.label_scale_factor,
            arrowhead_placement: this.arrowhead_placement,

            groupURL: this.group.URL,
            right_multiply: this.right_multiply,
            nodes: this.nodes.map( (node) => {
                const {position, element, label} = node;
                const {x, y, z} = position;
                return {position: {x, y, z}, element, label};
            } ),
            arrows: this.arrows.map( (arrow) => {
                const {start_node, end_node, generator, thirdPoint, offset, color} = arrow;
                const start_element = start_node.element;
                const end_element = end_node.element;
                return {start_element, end_element, generator, thirdPoint, offset, color};
            } ),
        } );

        if (this.isGenerated) {
            tmp.strategy_parameters = ((this.strategy_parameters /*: any */) /*: Array<StrategyParameters> */);
            tmp.chunk = ((this.chunk /*: any */) /*: integer */);
        } else {
            tmp.diagram_name = ((this.diagram_name /*: any */) /*: string */);
        }

        if (this.color_highlights != undefined || this.ring_highlights != undefined || this.square_highlights != undefined) {
            tmp.highlights = {};
            if (this.color_highlights != undefined)
                tmp.highlights.background = this.color_highlights;
            if (this.ring_highlights != undefined)
                tmp.highlights.ring = this.ring_highlights;
            if (this.square_highlights != undefined)
                tmp.highlights.square = this.square_highlights;
        }

        return tmp;
    }

    fromJSON (json /*: CayleyDiagramJSON */) {
        Object.keys(json).forEach( (name) => {
            switch (name) {
            case 'background':		this.background = json.background;;			break;
            case 'fog_level':           this.fog_level = json.fog_level;			break;
            case 'line_width':          this.line_width = json.line_width;			break;
            case 'sphere_base_radius':  this.sphere_base_radius = json.sphere_base_radius;	break;
            case 'sphere_scale_factor':	this.sphere_scale_factor = json.sphere_scale_factor;	break;
            case 'zoom_level':          this.zoom_level = json.zoom_level;			break;
            case 'camera_matrix':	this.camera.matrix.fromArray(json.camera_matrix);
					this.camera.matrix.decompose(
                                            this.camera.position,
                        		    this.camera.quaternion,
			                    this.camera.scale);					break;
            case 'label_scale_factor':	this.label_scale_factor = json.label_scale_factor;	break;
            case 'arrowhead_placement':	this.arrowhead_placement = json.arrowhead_placement;	break;
            default:										break;
            }
        } );
 
        this.deleteAllObjects();

        this.right_multiply = (json.right_multiply != undefined) ? json.right_multiply : true;

        this.generator = (json.diagram_name == undefined)
            ? new CayleyGeneratorFromStrategy(this.group, json.strategy_parameters)
            : new CayleyGeneratorFromSpec(this.group, json.diagram_name);

        if (json.camera_matrix == undefined)
            this.setCamera();

        if (json.nodes != undefined) {
            json.nodes.forEach( (json_node) => {
                const this_node = this.nodes[json_node.element];
                for (const property in this_node) {
                    if (json_node.hasOwnProperty(property)) {
                        if (property == 'position') {
                            const {x, y, z} = json_node.position;
                            this_node.position = new THREE.Vector3(x, y, z);
                        } else {
                            this_node[property] = json_node[property];
                        }
                    }
                }
            } );
        }
        this.createSpheres(this.nodes);
        if (this.displays_labels)
            this.createLabels();

        // check for highlights...
        const json_highlights = json.highlights;
        if (json_highlights != undefined
            && (json_highlights.background != undefined || json_highlights.ring != undefined || json_highlights.square != undefined) ) {
            this.clearHighlights();
            if (json_highlights.background != undefined) {
                this.color_highlights = json_highlights.background;
                this.drawColorHighlights();
            }
            if (json_highlights.ring != undefined) {
                this.ring_highlights = json_highlights.ring;
                this.drawShapedHighlights('ring');
            }
            if (json_highlights.square != undefined) {
                this.square_highlights = json_highlights.square;
                this.drawShapedHighlights('square');
            }
        }

        if (json.arrows != undefined) {
            const json_arrows = json.arrows;
            // remove all arrows and replace them with arrows generated from JSON arrow generators
            //   updated with potentially different thirdPoints, offset, colors, etc.
            this.removeArrows();
            const json_generators =
                  Array.from(json_arrows.reduce( (gen_set, json_arrow) => gen_set.add(json_arrow.generator), new Set() ));
            this.arrows.push(...this.generator.createArrows(json_generators, this.right_multiply));
            this.reColorArrows();

            // set up map from arrow start and end elements to passed json.arrow
            const json_arrow_map = json_arrows.reduce(
                (map, json_arrow) => map.set(`${json_arrow.start_element}:${json_arrow.end_element}`, json_arrow), new Map() );

            this.arrows.forEach( (this_arrow) => {
                // $FlowFixMe
                const json_arrow /*: any */ = json_arrow_map.get(`${this_arrow.start_node.element}:${this_arrow.end_node.element}`);
                for (const property in this_arrow) {
                    if (json_arrow.hasOwnProperty(property)) {
                        if (property != 'start_element' && property != 'end_element') {
                            if (property == 'thirdPoint') {
                                const {x, y, z} = json_arrow.thirdPoint;
                                this_arrow.thirdPoint = new THREE.Vector3(x, y, z);
                            } else {
                                this_arrow[property] = json_arrow[property];
                            }
                        }
                    }
                }
            } );
        } else if (json.arrow_generators != undefined) {
            const arrow_generators = json.arrow_generators;
            // remove all arrows and replace them with arrows generated from JSON arrow generators and specified colors
            this.removeArrows();
            const json_generators =
                  Array.from(arrow_generators.reduce( (gen_set, arrow_gen) => gen_set.add(arrow_gen.generator), new Set() ));
            this.arrows.push(...this.generator.createArrows(json_generators, this.right_multiply));
            this.reColorArrows();

            // set up map from json generators to json colors
            const json_gen_color_map = arrow_generators.reduce(
                (map, arrow_gen) => map.set(arrow_gen.generator, arrow_gen.color), new Map() );
            this.arrows.forEach( (this_arrow) => this_arrow.color = json_gen_color_map.get(this_arrow.generator) );
        }
        this.createLines(this.arrows);

        if (json.chunk != undefined)
            this.chunk = json.chunk;
    }
}

////////////////////////////   Factory Functions   //////////////////////////////

export function createUnlabelledCayleyDiagramView(options /*: CayleyDiagramViewOptions */) {
    const display = new CayleyDiagramView(Object.assign({}, {trackballControlled: false}, options));
    display.sphere_facet_count = 5;
    display._line_width = 1;
    display.displays_labels = false;
    return display;
}

export function createLabelledCayleyDiagramView(options /*: CayleyDiagramViewOptions */) {
    const display = new CayleyDiagramView(Object.assign({}, {trackballControlled: false}, options));
    display.sphere_facet_count = 10;
    display.line_width = 1;
    display.displays_labels = true;
    return display;
}

export function createInteractiveCayleyDiagramView(options /*: CayleyDiagramViewOptions */) {
    let display = new CayleyDiagramView(Object.assign({}, {trackballControlled: true}, options));
    display.displays_labels = true;
    display.render();
    return display;
}
