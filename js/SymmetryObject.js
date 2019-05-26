// @flow
/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */
/*::
import XMLGroup from './XMLGroup.js';
import type {XMLSymmetryObject} from './XMLGroup.js';
import Diagram3D from './Diagram3D.js';

export default
 */
class SymmetryObject {
/*::
   static BACKGROUND_COLOR : color;
   static DEFAULT_SPHERE_COLOR : color;
   static DEFAULT_PATH_COLOR : color;
 */
   static _init() {
      SymmetryObject.BACKGROUND_COLOR = '#C8E8C8';
      SymmetryObject.DEFAULT_SPHERE_COLOR = '#8C8C8C';
      SymmetryObject.DEFAULT_PATH_COLOR = '#000000';
   }

   static generate(group /*: XMLGroup */, diagramName /*: string */) /*: Diagram3D */ {
      const symmetryObject =
            ((group.symmetryObjects.find( (obj) => obj.name == diagramName ) /*: any */) /*: XMLSymmetryObject */);

      const nodes = symmetryObject.spheres.map( (sphere, inx) =>
                                                new Diagram3D.Node(inx, sphere.point, {color: ((sphere.color || SymmetryObject.DEFAULT_SPHERE_COLOR) /*: color */), radius: sphere.radius}) );

      const lines = symmetryObject.paths.map( (path) => {
         const vertices = path.points.map( (point) => new Diagram3D.Point(point) );
         return new Diagram3D.Line(vertices, {color: path.color || SymmetryObject.DEFAULT_PATH_COLOR, arrowhead: false});
      } );

      return new Diagram3D(group, nodes, lines, {background: SymmetryObject.BACKGROUND_COLOR, isGenerated: false});
   }
}

// initialize static variables
SymmetryObject._init();
