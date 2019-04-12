
DC.Chunking = class {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      if (   Cayley_diagram.strategies.every( (strategy, inx) => strategy.nesting_level == inx )
          && $('#diagram-choice').attr('index') == '-1' ) {
         DC.Chunking.enable();
      } else {
         DC.Chunking.disable();
         return;
      }

      $('#chunk-choices').html(eval(Template.HTML('chunk-select-first-template')));
      const generators = [];
      // generate option for each strategy in Cayley diagram
      Cayley_diagram.strategies.forEach( (strategy, strategy_index) => {
         if (strategy != Cayley_diagram.strategies._last()) {
            // find matching subgroup for chunking option
            const subgroup_index = group.subgroups.findIndex( (subgroup) => strategy.bitset.equals(subgroup.members) );
            generators.push(group.representation[strategy.generator]);
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-other-template')));
         }
      } );
      $('#chunk-choices').append(eval(Template.HTML('chunk-select-last-template')));
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'chunk-choices',
                         () => $('#chunk-choice').html($('#chunk-choices > li:first-of-type').html())
      ]);
   }

   static clickHandler(event) {
      event.preventDefault();

      if (!DC.Chunking.isDisabled()) {
         const $curr = $(event.target).closest('[action]');
         if ($curr != undefined) {
            eval($curr.attr('action'));
            event.stopPropagation();
         }
      }
   }

   static selectChunk(strategy_index) {
      $('#chunk-choices').hide();
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      Cayley_diagram.chunk = (strategy_index == -1) ? undefined : strategy_index;
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
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
   }

   static isDisabled() {
      return $('#chunk-select').prop('disabled');
   }
}
