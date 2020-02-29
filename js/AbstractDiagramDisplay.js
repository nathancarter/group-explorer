// @flow

/*
 * Routines to draw 3D ball-and-stick diagrams using three.js
 */

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE, TrackballControls, Line2, LineMaterial, LineGeometry} from '../lib/externals.js';

/*::
export type LineType = THREE.Line | Line2;

type SphereData = {
   position: THREE.Vector3,
   color?: css_color,
} & Obj;

export type AbstractDiagramDisplayOptions = {
   container?: JQuery,
   width?: number,
   height?: number,
};
*/

const DEFAULT_SPHERE_COLOR = '#8c8c8c';  // gray
const DEFAULT_LINE_COLOR = 'black';
const DEFAULT_LINE_WIDTH = 4;
const DEFAULT_CANVAS_HEIGHT = 50;
const DEFAULT_CANVAS_WIDTH = 50;
const DEFAULT_LIGHT_POSITIONS = [
    new THREE.Vector3(105, 0, 0),
    new THREE.Vector3(-35, -50, -87),
    new THREE.Vector3(-35, -50, 87),
    new THREE.Vector3(-35, 100, 0),
];
const ABSTRACT_DIAGRAM_DISPLAY_GROUP_NAMES = ['lights', 'spheres', 'lines'];

export {DEFAULT_SPHERE_COLOR, DEFAULT_LINE_COLOR};

export class AbstractDiagramDisplay {
/*::
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    control: ?TrackballControls;

    _fog_level: float;  // in [0,1]

    sphere_facet_count: integer;
    sphere_base_radius: float;
    _sphere_scale_factor: float;

    use_fat_lines: boolean;
    _line_width: number;
*/
    /*
     * Create three.js objects to display data in container
     *
     * create a scene to hold all the elements such as lights and objects
     * create a camera, which defines the point of view
     * create a renderer, sets the size
     * add the output of the renderer to the container element (a jquery wrapped set)
     */
    constructor (options /*: AbstractDiagramDisplayOptions */ = {}) {
        // Default constants

        // Camera
        this.camera = new THREE.PerspectiveCamera(45);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true});
        if (options.container != undefined) {
            $(options.container).append(this.renderer.domElement);
        }

        this.size = (options.container != undefined)
              ? {w: $(options.container).width(), h: $(options.container).height()}
              : {w: options.width || DEFAULT_CANVAS_WIDTH, h: options.height || DEFAULT_CANVAS_HEIGHT};
       
        // Create new Scene
        this.scene = new THREE.Scene();
        ABSTRACT_DIAGRAM_DISPLAY_GROUP_NAMES.forEach( (name) => {
            const group = new THREE.Group();
            group.name = name;
            this.scene.add(group);
        } );

        // Scene objects
        this.scene.fog = new THREE.Fog();
        this.light_positions = DEFAULT_LIGHT_POSITIONS;

        const scene_diameter = Math.sqrt(this.size.w*this.size.w + this.size.h*this.size.h);
        this.sphere_facet_count = (scene_diameter < 100) ? 5 : (scene_diameter < 300) ? 10 : 20;
    }

    /* 
     * Attributes
     */
    get background () /*: css_color */ {
        return '#' + this.renderer.getClearColor().getHexString();
    }

    set background (background_color /*: THREE.Color | number | string */) {
        const color = '#' + new THREE.Color(background_color).getHexString();
        this.renderer.setClearColor(color, 1.0);
        this.scene.fog.color.set(color);  // set Fog color to background
    }

    get container () /*: HTMLElement */ {
        return ((this.renderer.domElement.parentElement /*: any */) /*: HTMLElement */);
    }

    set container (container /*: HTMLElement */) {
        $(container).append(this.renderer.domElement);
        this.resize();
    }

    enableTrackballControl (container /*: ?HTMLElement */) {
        if (container != undefined) {
            this.container = container;
        }

        if (this.container != undefined) {
            this.control = new TrackballControls(this.camera, this.container);
            this.control.dynamicDampingFactor = 1.0;
        }
    }

    get fog_level () {
        if (this._fog_level == undefined) {
            this._fog_level = 0;
        };
        return this._fog_level;
    }

    // reduce fog level by increasing 'far' parameter (experimentally determined coefficients :-)
    //   (fogLevel is in [0,1])
    set fog_level (fog_level /*: float */) {
        this._fog_level = fog_level;

        const sceneRadius = Math.sqrt(Math.max(1, ...this.getGroup('spheres').children.map( (sphere) => sphere.position.lengthSq() )));
        const cameraDistance = this.camera.position.length();
        this.scene.fog.near = cameraDistance - sceneRadius - 1;
        this.scene.fog.far = (fog_level == 0) ? 100 : (cameraDistance + sceneRadius*(5 - 4 * fog_level));
    }

    get light_positions () {
        const positions = this.getGroup('lights').children.map/*:: <THREE.Vector3> */( (light) => light.position );
        return positions;
    }

    set light_positions (locations /*: Array<THREE.Vector3> */) {
        const lights = this.getGroup('lights');
        lights.remove(...lights.children);
        locations.forEach( (location) => {
            const light = new THREE.DirectionalLight();
            light.position.copy(location);
            lights.add(light);
        } )
    }

    get size () /*: {w: number, h: number} */ {
        const size = this.renderer.getSize(new THREE.Vector2());
        return {w: size.x, h: size.y};
    }

    set size ({w, h} /*: {w: number, h: number} */) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    // legacy interface, for compatibility with Sheets
    getSize() /*: {w: number, h: number} */ {
        return this.size;
    }

    setSize(width /*: number */, height /*: number */) {
        this.size = {w: width, h: height};
    }

    /*
     * Methods
     */
    clear () {
        this.fog_level = 0;
        this.zoom_level = 1;
        this.deleteAllObjects();
    }

    getGroup (name /*: string */) /*: THREE.Group */ {
        return ((this.scene.children.find( (el) => el.name == name ) /*: any */) /*: THREE.Group */);
    }

    deleteAllObjects () {
        this.deleteAllSpheres();
        this.deleteAllLines();
    }

    getImage () /*: Image */ {
        this.renderer.render(this.scene, this.camera);
        const image = new Image();
        image.src = this.renderer.domElement.toDataURL();
        return image;
    }

    // Render graphics, recursing to animate
    render () {
        this.renderer.render(this.scene, this.camera);
        const trackballControl = this.control;
        if (trackballControl != undefined) {
            trackballControl.update();
            window.requestAnimationFrame( () => this.render() );
        }
    }

    // Resize the 3D scene from the freshly re-sized graphic
    resize () {
        if (this.container != undefined) {
            const $container = $(this.container);
            this.size = {w: $container.width(), h: $container.height()};
        }
    }        
    
    ////////////////////////////   Camera   /////////////////////////////////////////

    /*
     * Position the camera and point it at the center of the scene
     *
     * Camera positioned to match point of view in GE2 for user-specified (not generated) diagrams:
     *   If diagram lies entirely in the y-z plane (all x == 0)
     *     place camera on x-axis, y-axis up (z-axis to the left)
     *   If diagram lies entirely in the x-z plane (all y == 0)
     *     place camera on y-axis, z-axis down (x-axis to the right)
     *   If diagram lies entirely in the x-y plane (all z == 0)
     *     place camera on z-axis, y-axis up (x-axis to the right)
     *   Otherwise place camera with y-axis up, offset a bit from
     *     the (1,1,1) vector so that opposite corners don't line up
     *     and make cubes look flat; look at origin, and adjust camera
     *     distance so that diagram fills field of view
     */
    setCamera (sphere_positions /*: Array<THREE.Vector3> */) {
        let location, up;
        if (sphere_positions.every( (position) => position.x == 0.0 )) {
            location = new THREE.Vector3(3, 0, 0);
            up = new THREE.Vector3(0, 1, 0);
        } else if (sphere_positions.every( (position) => position.y == 0.0 )) {
            location = new THREE.Vector3(0, 3, 0);
            up = new THREE.Vector3(0, 0, -1);
        } else if (sphere_positions.every( (position) => position.z == 0.0 )) {
            location = new THREE.Vector3(0, 0, 3);
            up = new THREE.Vector3(0, 1, 0);
        } else {
            location = new THREE.Vector3(1.7, 1.6, 1.9);
            up = new THREE.Vector3(0, 1, 0);
        }

        const radius = Math.sqrt(Math.max(1, ...sphere_positions.map( (position) => position.lengthSq() )));
        location.multiplyScalar(radius);
    
        this.camera.position.copy(location);
        this.camera.up.copy(up);
        this.camera.lookAt(new THREE.Vector3());
    }

    get zoom_level () {
        return this.camera.zoom;
    }

    set zoom_level (zoom_level /*: float */) {
        this.camera.zoom = zoom_level;
        this.camera.updateProjectionMatrix();
    }

    ////////////////////////////   Sphere routines   ////////////////////////////////
    
    get sphere_scale_factor () /*: float */ {
        if (this._sphere_scale_factor == undefined) {
            this._sphere_scale_factor = 1;
        }

        return this._sphere_scale_factor;
    }

    set sphere_scale_factor (new_scale_factor /*: float */) {
        if (this.sphere_scale_factor != new_scale_factor) {
            this._sphere_scale_factor = new_scale_factor;
            const spheres = this.getGroup('spheres').children;
            const sphere_radius = this.sphere_radius;
            spheres.forEach( (sphere) => sphere.scale.set(sphere_radius, sphere_radius, sphere_radius) );
        }
    }

    get sphere_radius () /*: float */ {
        return this.sphere_base_radius * this.sphere_scale_factor;
    }
    
    // Create a sphere for each node, add to scene in THREE.Group named "spheres"
    createSpheres (sphere_data /*: Array<SphereData> */) {
        const geometry = new THREE.SphereGeometry(1.0, this.sphere_facet_count, this.sphere_facet_count);
        sphere_data.forEach( (sphere_datum) => {
            sphere_datum.color = (sphere_datum.color == undefined) ? DEFAULT_SPHERE_COLOR : sphere_datum.color;
            const material = new THREE.MeshPhongMaterial();
            material.color.set(sphere_datum.color);
            const sphere = new THREE.Mesh(geometry, material);
            sphere.userData = {node: sphere_datum};
            sphere.scale.set(this.sphere_radius, this.sphere_radius, this.sphere_radius);
            sphere.position.copy(sphere_datum.position);
            this.getGroup('spheres').add(sphere);
        } );
    }
    
    deleteAllSpheres () {
        const sphere_group = this.getGroup('spheres');
        const spheres = ((sphere_group.children /*: any */) /*: Array<THREE.Mesh> */);
        spheres.forEach( (sphere) => sphere.geometry.dispose() );
        sphere_group.remove(...spheres);
    }
    
    ////////////////////////////   Line routines   ////////////////////////////////

    get line_width () /*: float */ {
        if (this._line_width == undefined) {
            this._line_width = DEFAULT_LINE_WIDTH;
        }

        return this.use_fat_lines ? this._line_width : 1;
    }
    
    set line_width (line_width /*: float */) {
        if (this.line_width != line_width) {
            this._line_width = line_width;
            const lines = ((this.getGroup('lines').children /*: any */) /*: Array<LineType> */);
            lines.forEach( (line) => line.material.linewidth = line_width );
        }
    }

    createLine (vertices /*: Array<THREE.Vector3> */) /*: LineType */ {
        const new_line = (this.use_fat_lines) ? this.createFatLine(vertices) : this.createWebglLine(vertices);
        return new_line;
    }

    createWebglLine (vertices /*: Array<THREE.Vector3> */) /*: THREE.Line */ {
        const geometry = new THREE.Geometry();
        geometry.vertices = vertices;

        const material = new THREE.LineBasicMaterial( {
            linewidth: this.line_width,
        } );
            
        const line = new THREE.Line(geometry, material);
        return line;
    }

    // Create a fat line from an array of vertices
    createFatLine (vertices /*: Array<THREE.Vector3> */) /*: LineType */ {
        const geometry = new LineGeometry();
        geometry.setPositions( vertices.reduce(
            (positions, vertex) => (positions.push(vertex.x, vertex.y, vertex.z), positions),
            [] ) );

        const material = new LineMaterial( {
            linewidth: this.line_width,
            resolution:  new THREE.Vector2(window.innerWidth, window.innerHeight),
        } );
            
        const line = new Line2( geometry, material );
        return line;
    }

    deleteAllLines () {
        this.deleteLines( ((this.getGroup('lines').children /*: any */) /*: Array<LineType> */) );
    }

    deleteLines (lines /*: Array<LineType> */) {
        // dispose of all geometries, materials;
        lines.forEach( (line) => {
            line.geometry.dispose();
            line.material.dispose();  // FIXME: should we do this for fat lines?
        } );
        this.getGroup('lines').remove(...lines);
    }
}
