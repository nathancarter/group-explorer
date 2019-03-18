
class DC {
   static clearMenus() {
      $('#diagram-page .highlighted').removeClass('highlighted');
      $('#diagram-page .menu:visible').remove();
      $('#remove-arrow-button').prop('disabled', true);
      $('#diagram-choices').hide();
      $('#chunk-choices').hide();
   }

   /* Load, initialize diagram control */
   static load($diagramWrapper) {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: DC.DIAGRAM_PANEL_URL,
                   success: (data) => {
                      $diagramWrapper.html(data);
                      DC.setupDiagramPage();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${DC.DIAGRAM_PANEL_URL}: ${err}`);
                   }
         } )
      } )
   }

   static setupDiagramPage() {
      $(window).off('click', DC.clearMenus).on('click', DC.clearMenus)
               .off('contextmenu', DC.clearMenus).on('contextmenu', DC.clearMenus);

      DC.DiagramChoice.setupDiagramSelect();
      $('#diagram-select').off('click', DC.DiagramChoice.clickHandler).on('click', DC.DiagramChoice.clickHandler);

      $('#arrow-control').off('click', DC.Arrow.clickHandler).on('click', DC.Arrow.clickHandler);

      $('#generation-control').off('click', DC.Generator.clickHandler).on('click', DC.Generator.clickHandler);
      $('#generation-control').off('contextmenu', DC.Generator.clickHandler).on('contextmenu', DC.Generator.clickHandler);
      $('#generation-table').off('dragstart', DC.Generator.dragStart).on('dragstart', DC.Generator.dragStart);
      $('#generation-table').off('drop', DC.Generator.drop).on('drop', DC.Generator.drop);
      $('#generation-table').off('dragover', DC.Generator.dragOver).on('dragover', DC.Generator.dragOver);

      $('#chunk-select').off('click', DC.Chunking.clickHandler).on('click', DC.Chunking.clickHandler);
   }

   static update() {
      DC.Generator.draw();
      DC.Arrow.updateArrows();
      DC.Chunking.updateChunkingSelect();
   }
}

DC.DIAGRAM_PANEL_URL = 'diagramController/diagram.html';
