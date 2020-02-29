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
    
    ////////////////////////////   Line routines   ////////////////////////////////
        
    createLines (line_data /*: Array<LineData> */) {
        const line_group = this.getGroup('lines');
        line_data.forEach( (line_datum, inx) => {
            const new_line = this.createLine(line_datum.vertices);
            const new_line_color = line_datum.color;
            new_line.material.color.set(new_line_color);

            line_group.add(new_line);
        } )
    }

    ///////////////////////   Draw symmetry object   //////////////////////////////

    setObject (symmetry_object /*: XMLSymmetryObject */) /*: SymmetryObjectView */ {
        this.deleteAllObjects();

        const spheres = symmetry_object.spheres.map( (sphere) => (
            {position: new THREE.Vector3(...sphere.point), color: sphere.color || DEFAULT_SPHERE_COLOR}
        ) );

        this.setCamera(spheres.map( (sphere) => sphere.position ));
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

export function createInteractiveSymmetryObjectView(options /*: SymmetryObjectViewOptions */ = {}) {
    const display = new SymmetryObjectView(options);
    display.use_fat_lines = true;
    display.enableTrackballControl();
    display.render();
    return display;
}

export function createStaticSymmetryObjectView(options /*: SymmetryObjectViewOptions */ = {}) {
    const display = new SymmetryObjectView(options);
    display.use_fat_lines = false;
    return display;
}
