// @flow

import {AbstractDiagramDisplay} from './AbstractDiagramDisplay.js';
import {DEFAULT_SPHERE_COLOR, DEFAULT_LINE_COLOR as DEFAULT_PATH_COLOR} from './AbstractDiagramDisplay.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import type {XMLSymmetryObject} from './XMLGroup.js';
import type {AbstractDiagramDisplayOptions} from './AbstractDiagramDisplay.js';

type LineData = {
   vertices: Array<THREE.Vector3>,
   color: css_color,
} & Obj;

type LineUserData = {
   path: LineData
};

export type SymmetryObjectViewOptions = {
} & AbstractDiagramDisplayOptions;
*/

const SYMMETRY_OBJECT_BACKGROUND_COLOR = '#C8E8C8';

export class SymmetryObjectView extends AbstractDiagramDisplay {
    constructor (options /*: SymmetryObjectViewOptions */ = {}) {
        super(options);

        // Set background
        this.background = SYMMETRY_OBJECT_BACKGROUND_COLOR;
    }

    deleteAllObjects () {
        super.deleteAllObjects();
        this.deleteAllLines();
    }
    
    ////////////////////////////   Line routines   ////////////////////////////////

    get line_width () /*: float */ {
        return super.line_width;
    }
    
    set line_width (line_width /*: float */) {
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
                const line_data = lines.map( (line) => line.userData.path );
                this.deleteAllLines();
                this._line_width = line_width;
                this.createLines(line_data);
            }
        }
    }
        
    createLines (line_data /*: Array<LineData> */) {
        const line_group = this.getGroup('lines');
        line_data.forEach( (line_datum, inx) => {
            const geometry = new THREE.Geometry();
            geometry.vertices.push(...line_datum.vertices);

            const new_line = this.createLine(geometry);
            const new_line_color = line_datum.color;
            new_line.material.color.set(new_line_color);
            new_line.userData.path = line_datum;

            line_group.add(new_line);
        } )
    }

    deleteAllLines () {
        const line_group = this.getGroup('lines');
        const lines = ((line_group.children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */);

        // dispose of all geometries, materials;
        lines.forEach( (line) => {
            line.geometry.dispose();
            line.material.dispose();
        } );
        line_group.remove(...lines);
    }

    ///////////////////////   Draw symmetry object   //////////////////////////////

    setObject (symmetry_object /*: XMLSymmetryObject */) /*: SymmetryObjectView */ {
        this.deleteAllObjects();

        const spheres = symmetry_object.spheres.map( (sphere) => (
            {position: new THREE.Vector3(...sphere.point), color: sphere.color || DEFAULT_SPHERE_COLOR}
        ) );

        this.setCameraFromNodes(spheres);
        this.sphere_base_radius = symmetry_object.spheres[0].radius;
        this._sphere_scale_factor = 1;
        this.createSpheres(spheres);

        const paths = symmetry_object.paths.map( (path) => {
            return {vertices: path.points.map( (point) => new THREE.Vector3(...point) ),
                    color: path.color || DEFAULT_PATH_COLOR};
        } );
        this.createLines(paths);

        return this;
    }
}

////////////////////////////   Factory Functions   ////////////////////////////////

export function createInteractiveSymmetryObjectView(options /*: SymmetryObjectViewOptions */) {
    const display = new SymmetryObjectView(Object.assign({}, {trackballControlled: true}, options));
    display.render();
    return display;
}

export function createStaticSymmetryObjectView(options /*: SymmetryObjectViewOptions */) {
    const display = new SymmetryObjectView(Object.assign({}, {trackballControlled: false}, options));
    display.sphere_facet_count = 5;
    display._line_width = 1;
    return display;
}
