// @flow

import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import * as DC from './diagram.js';
import * as CD from '../CayleyDiagram.js';

export default class Chunking {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      if (   CD.Diagram_Name[0] === undefined
          && CD.Cayley_Diagram[0].strategies.every( (strategy, inx) => strategy.nesting_level == inx ) ) {
         DC.Chunking.enable();
      } else {
         DC.Chunking.disable();
         return;
      }

      $('#chunk-choices').html(eval(Template.HTML('chunk-select-first-template')));
      const generators = [];
      // generate option for each strategy in Cayley diagram
      CD.Cayley_Diagram[0].strategies.forEach( (strategy, strategy_index) => {
         if (strategy != GEUtils.last(CD.Cayley_Diagram[0].strategies)) {
            generators.push(CD.Group[0].representation[strategy.generator]);
            // find matching subgroup for chunking option
            const subgroup_index = CD.Group[0].subgroups.findIndex( (subgroup) => strategy.bitset.equals(subgroup.members) );
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-other-template')));
         }
      } );
      $('#chunk-choices').append(eval(Template.HTML('chunk-select-last-template')));
      DC.Chunking.selectChunk(CD.Cayley_Diagram[0].chunk);
   }

   static toggleChoices() {
      const choicesDisplay = $('#chunk-choices').css('display');
      $('#bodyDouble').click();
      if (choicesDisplay == 'none') {
         $('#chunk-choices').show();
      }         
   }

   static selectChunk(subgroup_index /*: number */) {
      if (DC.Chunking.isDisabled()) return;
      $('#bodyDouble').click();
      const strategy_index =
            CD.Cayley_Diagram[0].strategies.findIndex( (strategy) => strategy.bitset.equals(CD.Group[0].subgroups[subgroup_index].members) );
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      CD.Cayley_Diagram[0].chunk = (strategy_index == -1) ? 0 : subgroup_index;
      CD.Graphic_Context[0].updateChunking(CD.Cayley_Diagram[0]);
      CD.emitStateChange();
   }

   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      CD.Cayley_Diagram[0].chunk = 0;
      CD.Graphic_Context[0].updateChunking(CD.Cayley_Diagram[0]);

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
      CD.emitStateChange();
   }

   static isDisabled() /*: boolean */ {
      return $('#chunk-select').prop('disabled');
   }
}
