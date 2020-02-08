// @flow

/*
 * Routines to draw 3D ball-and-stick diagrams using three.js
 */

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE, TrackballControls, MeshLine, MeshLineMaterial} from '../lib/externals.js';

/*::
type SphereData = {
   position: THREE.Vector3,
   color?: css_color,
} & Obj;

export type AbstractDiagramDisplayOptions = {
   container?: JQuery,
   width?: number,
   height?: number,
   trackballControlled?: boolean,
};
*/

const DEFAULT_SPHERE_COLOR = '#8c8c8c';  // gray
const DEFAULT_SPHERE_FACET_COUNT = 20;
const DEFAULT_LINE_COLOR = 'black';
const DEFAULT_LINE_WIDTH = 7;
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
    control: TrackballControls;

    _fog_level: float;  // in [0,1]

    _sphere_facet_count: integer;
    sphere_base_radius: float;
    _sphere_scale_factor: float;

    _max_webgl_line_width: number;
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

        // Controls
        if (this.container != undefined && options.trackballControlled) {
            this.control = new TrackballControls(this.camera, this.container);
            this.control.dynamicDampingFactor = 1.0;
        }
        
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
        window.requestAnimationFrame( () => this.render() );
        this.control.update();
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
     *     and make cubes look flat; look at origina, and adjust camera
     *     distance so that diagram fills field of view
     */
    setCameraFromNodes (sphere_data /*: Array<SphereData> */) {
        let location, up;
        if (sphere_data.every( (sphere) => sphere.position.x == 0.0 )) {
            location = new THREE.Vector3(3, 0, 0);
            up = new THREE.Vector3(0, 1, 0);
        } else if (sphere_data.every( (sphere) => sphere.position.y == 0.0 )) {
            location = new THREE.Vector3(0, 3, 0);
            up = new THREE.Vector3(0, 0, -1);
        } else if (sphere_data.every( (sphere) => sphere.position.z == 0.0 )) {
            location = new THREE.Vector3(0, 0, 3);
            up = new THREE.Vector3(0, 1, 0);
        } else {
            location = new THREE.Vector3(1.7, 1.6, 1.9);
            up = new THREE.Vector3(0, 1, 0);
        }

        const radius = Math.sqrt(Math.max(1, ...sphere_data.map( (sphere) => sphere.position.lengthSq() )));
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

    get sphere_facet_count () /*: integer */ {
        if (this._sphere_facet_count == undefined) {
            this._sphere_facet_count = DEFAULT_SPHERE_FACET_COUNT;
        }

        return this._sphere_facet_count;
    }

    set sphere_facet_count (sphere_facet_count /*: integer */) {
        this._sphere_facet_count = sphere_facet_count;
    }
    
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

    get max_webgl_line_width () {
        if (this._max_webgl_line_width == undefined) {
            const max_line_width =
                  this.renderer.getContext().getParameter(this.renderer.getContext().ALIASED_LINE_WIDTH_RANGE)[1];
            this._max_webgl_line_width = max_line_width || 1;
        }

        return this._max_webgl_line_width;
    }

    get line_width () /*: float */ {
        if (this._line_width == undefined) {
            this._line_width = DEFAULT_LINE_WIDTH;
        }

        return this._line_width;
    }
    
    set line_width (line_width /*: float */) {
        /* overridden in subclasses */
        this._line_width = line_width;
    }
    
    // Create a thick or thin THREE line from a geometry
    createLine (geometry /*: THREE.Geometry */) /*: THREE.Line | THREE.Mesh */ {
        let material;
        if (this.line_width <= this.max_webgl_line_width) {
            material = new THREE.LineBasicMaterial({});
            material.linewidth = this.line_width;
        } else {
            material = new MeshLineMaterial({
                sizeAttenuation: false,
                side: THREE.DoubleSide,
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                fog: true,
            });
            material.lineWidth = this.line_width;
        };

        let line;
        if (material.isLineBasicMaterial) {
            line = new THREE.Line(geometry, material);
        } else {
            const mesh_line = new MeshLine();
            mesh_line.setGeometry(geometry);
            line = new THREE.Mesh(mesh_line.geometry, material);
            line.userData.meshLine = mesh_line;  // needed for raycasting fat lines
            mesh_line.geometry.userData = line;  // used in DiagramDnD
        }

        return line;
    }

    canUpdateLineWidthInPlace (old_width /*: float */, new_width /*: float */) /*: boolean */ {
        return (new_width <= this.max_webgl_line_width && old_width <= this.max_webgl_line_width)
            || (new_width > this.max_webgl_line_width && old_width > this.max_webgl_line_width);
    }

    updateLineWidthInPlace (new_width /*: float */) {
        const lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Mesh | THREE.Line> */);
        if (new_width <= this.max_webgl_line_width) {
            lines.forEach( (line) => ((line.material /*: any */) /*: THREE.LineBasicMaterial */).linewidth = new_width );
        } else {
            lines.forEach( (line) => ((line.material /*: any */) /*: MeshLineMaterial */).lineWidth = new_width );
        }
    }
}
