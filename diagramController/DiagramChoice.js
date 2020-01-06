// @flow

import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import * as DC from './diagram.js';
import * as CD from '../CayleyDiagram.js';

var displayGraphic /*: () => void */;

export default class DiagramChoice {
   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      CD.Group[0].cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
      } );
      DC.DiagramChoice._showChoice();
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = CD.Group[0].cayleyDiagrams.findIndex( (cd) => cd.name == CD.Diagram_Name[0] );
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
      (diagram == undefined) ? CD.Diagram_Name.pop() : CD.Diagram_Name[0] = diagram;
      DC.Chunking.enable();
      DC.DiagramChoice._showChoice();

      if ( andDisplay ) CD.displayGraphic();
   }
}
