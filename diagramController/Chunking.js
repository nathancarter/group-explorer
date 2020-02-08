// @flow

import {Group, Cayley_Diagram_View} from '../CayleyDiagram.js';
import {CayleyGeneratorFromStrategy} from '../js/CayleyGenerator.js';
import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import * as DC from './diagram.js';

export default class Chunking {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      const generator = ((Cayley_Diagram_View[0].generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      if (   Cayley_Diagram_View[0].isGenerated
          && generator.strategies.every( (strategy, inx) => strategy.nesting_level == inx ) ) {
         DC.Chunking.enable();

         $('#chunk-choices').html(eval(Template.HTML('chunk-select-first-template')));
         generator.strategies.slice(0, -1).reduce( (generators, strategy, inx) => {
            generators.push(Group[0].representation[strategy.generator]);
            const subgroup_index = Group[0].subgroups.findIndex( (subgroup) => subgroup.members.equals(strategy.elements) );
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-other-template')));
            return generators;
         }, [] );
         $('#chunk-choices').append(eval(Template.HTML('chunk-select-last-template')));
         DC.Chunking.selectChunk(generator.chunk);
      } else {
         DC.Chunking.disable();
      }
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
      const generator = ((Cayley_Diagram_View[0].generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      const subgroup_members = Group[0].subgroups[subgroup_index].members;
      const strategy_index = generator.strategies.findIndex( (strategy) => strategy.elements.equals(subgroup_members) );
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      Cayley_Diagram_View[0].chunk = (strategy_index == -1) ? 0 : subgroup_index;
   }

   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      if (Cayley_Diagram_View[0].isGenerated) {
         const generator = ((Cayley_Diagram_View[0].generator /*: any */) /*: CayleyGeneratorFromStrategy */);
         generator.chunk = 0;
      }

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
   }

   static isDisabled() /*: boolean */ {
      return $('#chunk-select').prop('disabled');
   }
}
