class CVC {
   static load($viewWrapper) {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: CVC.VIEW_PANEL_URL,
                   success: (data) => {
                      $viewWrapper.html(data);
                      CVC.setupViewPage();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${CVC.VIEW_PANEL_URL}: ${err}`);
                   }
         } )
      } )
   }

   static setupViewPage() {
      $('#zoom-level').off('input', CVC.setZoomLevel).on('input', CVC.setZoomLevel);
      $('#line-thickness').off('input', CVC.setLineThickness).on('input', CVC.setLineThickness);
      $('#node-radius').off('input', CVC.setNodeRadius).on('input', CVC.setNodeRadius);
      $('#fog-level').off('input', CVC.setFogLevel).on('input', CVC.setFogLevel);
      $('#use-fog').off('input', CVC.setFogLevel).on('input', CVC.setFogLevel);
      $('#label-size').off('input', CVC.setLabelSize).on('input', CVC.setLabelSize);
      $('#show-labels').off('input', CVC.setLabelSize).on('input', CVC.setLabelSize);
      $('#arrowhead-placement').off('input', CVC.setArrowheadPlacement).on('input', CVC.setArrowheadPlacement);
   }

   /* Slider handlers */
   static setZoomLevel() {
      Cayley_diagram.zoomLevel = Math.exp( $('#zoom-level')[0].valueAsNumber/10 );
      Graphic_context.updateZoomLevel(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }

   static setLineThickness() {
      Cayley_diagram.lineWidth = $('#line-thickness')[0].valueAsNumber;
      Graphic_context.updateLineWidth(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }

   static setNodeRadius() {
      Cayley_diagram.nodeScale = Math.exp( $('#node-radius')[0].valueAsNumber/10 );
      Graphic_context.updateNodeRadius(Cayley_diagram);
      Graphic_context.updateLabels(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }

   static setFogLevel() {
      Cayley_diagram.fogLevel = $('#use-fog')[0].checked ? $('#fog-level')[0].valueAsNumber/10 : 0;
      Graphic_context.updateFogLevel(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }

   static setLabelSize() {
      Cayley_diagram.labelSize = $('#show-labels')[0].checked ?
                                 Math.exp( $('#label-size')[0].valueAsNumber/10 ) : 0;
      Graphic_context.updateLabelSize(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }

   static setArrowheadPlacement() {
      Cayley_diagram.arrowheadPlacement = $('#arrowhead-placement')[0].valueAsNumber/20;
      Graphic_context.updateArrowheadPlacement(Cayley_diagram);
      Cayley_diagram.emitStateChange();
   }
}

CVC.VIEW_PANEL_URL = 'cayleyViewController/view.html';
