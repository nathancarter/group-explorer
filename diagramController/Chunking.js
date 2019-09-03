// @flow
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import GEUtils from '../js/GEUtils.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import DC from './diagram.js';

// globals implemented in CayleyDiagram.js
var group: XMLGroup;
var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;
var Diagram_name: string;
var emitStateChange: () => void;

export default
 */
DC.Chunking = class {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      if (   Diagram_name === undefined
          && Cayley_diagram.strategies.every( (strategy, inx) => strategy.nesting_level == inx ) ) {
         DC.Chunking.enable();
      } else {
         DC.Chunking.disable();
         return;
      }

      $('#chunk-choices').html(eval(Template.HTML('chunk-select-first-template')));
      const generators = [];
      // generate option for each strategy in Cayley diagram
      Cayley_diagram.strategies.forEach( (strategy, strategy_index) => {
         if (strategy != GEUtils.last(Cayley_diagram.strategies)) {
            generators.push(group.representation[strategy.generator]);
            // find matching subgroup for chunking option
            const subgroup_index = group.subgroups.findIndex( (subgroup) => strategy.bitset.equals(subgroup.members) );
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-other-template')));
         }
      } );
      $('#chunk-choices').append(eval(Template.HTML('chunk-select-last-template')));
      DC.Chunking.selectChunk(Cayley_diagram.chunk);
   }

   static clickHandler(clickEvent /*: MouseEvent */) {
      if (!DC.Chunking.isDisabled()) {
         const $curr = $(clickEvent.target).closest('[action]');
         if ($curr != undefined) {
            eval($curr.attr('action'));
            clickEvent.stopPropagation();
         }
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
      $('#bodyDouble').click();
      const strategy_index =
            Cayley_diagram.strategies.findIndex( (strategy) => strategy.bitset.equals(group.subgroups[subgroup_index].members) );
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      Cayley_diagram.chunk = (strategy_index == -1) ? 0 : subgroup_index;
      Graphic_context.updateChunking(Cayley_diagram);
      emitStateChange();
   }

   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      Cayley_diagram.chunk = 0;
      Graphic_context.updateChunking(Cayley_diagram);

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
      emitStateChange();
   }

   static isDisabled() /*: boolean */ {
      return $('#chunk-select').prop('disabled');
   }
}
