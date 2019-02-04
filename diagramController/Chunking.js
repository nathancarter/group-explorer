
DC.Chunking = class {
   static updateChunkingSelect() {
      $('#chunk-select').html(eval(Template.HTML('chunk-select-first-template')));
      // check that first generator is innermost, second is middle, etc.
      if (   Cayley_diagram.strategies.every( (strategy, inx) => strategy.nesting_level == inx )
          && $('#diagram-select')[0].value == '' ) {
         DC.Chunking.enable();
      } else {
         DC.Chunking.disable();
         return;
      }
      $('#chunk-select').html(eval(Template.HTML('chunk-select-first-template')));
      // Generate multi-character subscript as Unicode text (<option> tags cannot contain HTML)
      const subscript = (jnx) =>
         (jnx == 0) ? '' : (subscript(Math.floor(jnx / 10)) + subscripts[jnx % 10]);  // subscripts defined in js/mathmlUtils.js
      const generators = [];
      // generate option for each strategy in Cayley diagram
      Cayley_diagram.strategies.forEach( (strategy, strategy_index) => {
         if (strategy == Cayley_diagram.strategies._last()) {
            return;
         }
         // find matching subgroup for chunking option
         const subgroup_index = group.subgroups.findIndex( (subgroup) => strategy.bitset.equals(subgroup.members) );
         generators.push(strategy.generator);
         const generator_strings = generators.map( (el) => mathml2text(group.representation[el]) ).join(', ');
         $('#chunk-select').append(eval(Template.HTML('chunk-select-other-template')));
      } );
      $('#chunk-select').append(eval(Template.HTML('chunk-select-last-template')));
   }

   static selectChunk(event) {
      event.stopPropagation();
      if (DC.Chunking.isDisabled()) {
         return;
      }
      Cayley_diagram.chunk = (event.target.value == -1) ? undefined : event.target.value;
      Graphic_context.updateChunking(Cayley_diagram);
   }
   
   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      Cayley_diagram.chunk = undefined;
      Graphic_context.updateChunking(Cayley_diagram);

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', $chunking_fog.parent().css('height'));
      $chunking_fog.css('width', $chunking_fog.parent().css('width'));
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
   }

   static isDisabled() {
      return $('#chunk-select').prop('disabled');
   }
}
