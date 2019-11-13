// @flow
/*::
import Template from '../js/Template.md';
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

   static toggleChoices() {
      const choicesDisplay = $('#diagram-choices').css('display');
      $('#bodyDouble').click();
      if (choicesDisplay == 'none') {
         $('#diagram-choices').show();
      }         
   }

   static selectDiagram(diagram /*: ?string */, andDisplay /*:: ?: boolean */ = true) {
      $('#bodyDouble').click();
      Diagram_name = (diagram == undefined) ? undefined : diagram;
      DC.Chunking.enable();
      DC.DiagramChoice._showChoice();

      if ( andDisplay ) displayGraphic();
   }
}
