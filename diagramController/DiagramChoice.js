// @flow

import {Group, Cayley_Diagram_View} from '../CayleyDiagram.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import * as DC from './diagram.js';

export default class DiagramChoice {

   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      Group[0].cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
      } );
      DC.DiagramChoice._showChoice();
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = Group[0].cayleyDiagrams.findIndex( (cd) => cd.name == Cayley_Diagram_View[0].diagram_name );
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
      Cayley_Diagram_View[0].setDiagram(Group[0], diagram);
      DC.Chunking.enable();
      DC.DiagramChoice._showChoice();
      DC.update();
   }
}
