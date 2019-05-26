// @flow
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';

import DC from './diagram.js';

var Cayley_diagram : CayleyDiagram;
var Graphic_context : DisplayDiagram;

export default
 */
DC.ArrowMult = class ArrowMult {
   static setMult(rightOrLeft /*: string */) {
      Cayley_diagram.right_multiplication = (rightOrLeft == 'right');
      Graphic_context.showGraphic(Cayley_diagram);
   }
}
