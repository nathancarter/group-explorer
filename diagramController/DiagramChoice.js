// @flow
/*::
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import DC from './diagram.js';

var displayGraphic: () => void;
var group: XMLGroup;
var Diagram_name: ?string;

export default
 */
DC.DiagramChoice = class {
   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      group.cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
      } );
      DC.DiagramChoice._showChoice();
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = group.cayleyDiagrams.findIndex( (cd) => cd.name == Diagram_name );
      $('#diagram-choice')
         .html($(`#diagram-choices > li:nth-of-type(${index+2})`).html())
         .show();
   }

   /* Display control routines */
   static clickHandler(clickEvent /*: MouseEvent */) {
      const $curr = $(clickEvent.target).closest('[action]');
      $('#bodyDouble').click();
      if ($curr != undefined) {
         eval($curr.attr('action'));
         clickEvent.stopPropagation();
      }
   }

   static selectDiagram(diagram /*: ?string */, andDisplay /*:: ?: boolean */ = true) {
      Diagram_name = (diagram == undefined) ? undefined : diagram;
      DC.Generator.enable();
      DC.Chunking.enable();
      DC.DiagramChoice._showChoice();

      if ( andDisplay ) displayGraphic();
   }
}
