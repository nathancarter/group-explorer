
DC.Chunking = class {
   static clickHandler(event) {
      event.preventDefault();

      // check if disabled
      if (DC.Chunking.isDisabled()) {
         return;
      }

      eval($(event.target.closest('[action]')).attr('action'));
      event.stopPropagation();
   }

   static setupChunkingSelect() {
   }

   static selectChunk(event) {
      if (DC.Chunking.isDisabled()) {
         return;
      }
   }
   
   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
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
  
