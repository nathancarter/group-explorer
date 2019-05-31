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
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices', () => {
         // show current choice, even if it's different from the choice when this setupDiagramSelect was called
         DC.DiagramChoice._showChoice();
      } ]);
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = group.cayleyDiagrams.findIndex( (cd) => cd.name == Diagram_name );
      $('#diagram-choice')
         .html($(`#diagram-choices > li:nth-of-type(${index+2}`).html())
         .show();
   }

   /* Display control routines */
   static clickHandler(event /*: JQueryEventObject */) {
      event.preventDefault();

      const $curr = $(event.target).closest('[action]');
      if ($curr != undefined) {
         eval($curr.attr('action'));
         event.stopPropagation();
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
