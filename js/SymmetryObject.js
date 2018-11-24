/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class SymmetryObject {
   static _init() {
      SymmetryObject.BACKGROUND_COLOR = 0xC8E8C8;
   }

   static generate(group, diagramName) {
      const symmetryObject = group.symmetryObjects.find( (obj) => obj.name == diagramName );
      const nodes = symmetryObject.spheres.map( (sphere, inx) =>
         new Diagram3D.Node(inx, sphere.point, {color: sphere.color, radius: sphere.radius}) );

      const lines = symmetryObject.paths.map( (path) => {
         const vertices = path.points.map( (point) => new Diagram3D.Point(point) );
         return new Diagram3D.Line(vertices, {color: path.color, arrowhead: false});
      } );

      return new Diagram3D(group, nodes, lines, {background: SymmetryObject.BACKGROUND_COLOR});
   }
}

// initialize static variables
SymmetryObject._init();
