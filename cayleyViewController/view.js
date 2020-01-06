// @flow

import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import * as CD from '../CayleyDiagram.js';

export {load};

const VIEW_PANEL_URL = 'cayleyViewController/view.html';

function load($viewWrapper /*: JQuery */) /*: Promise<void> */
{
   return new Promise( (resolve, reject) => {
      $.ajax( { url: VIEW_PANEL_URL,
                success: (data /*: html */) => {
                   $viewWrapper.html(data);
                   setupViewPage();
                   resolve();
                },
                error: (_jqXHR, _status, err) => {
                   reject(`Error loading ${VIEW_PANEL_URL} ${err === undefined ? '' : ': ' + err}`);
                }
              } )
   } )
}

function setupViewPage() {
   $('#zoom-level').off('input', setZoomLevel).on('input', setZoomLevel);
   $('#line-thickness').off('input', setLineThickness).on('input', setLineThickness);
   $('#node-radius').off('input', setNodeRadius).on('input', setNodeRadius);
   $('#fog-level').off('input', setFogLevel).on('input', setFogLevel);
   $('#use-fog').off('input', setFogLevel).on('input', setFogLevel);
   $('#label-size').off('input', setLabelSize).on('input', setLabelSize);
   $('#show-labels').off('input', setLabelSize).on('input', setLabelSize);
   $('#arrowhead-placement').off('input', setArrowheadPlacement).on('input', setArrowheadPlacement);
}

/* Slider handlers */
function setZoomLevel() {
   CD.Cayley_Diagram[0].zoomLevel = Math.exp( Number($('#zoom-level').val())/10 );
   CD.Graphic_Context[0].updateZoomLevel(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

/* Set line thickness from slider value
 *   slider is in range [1,20], maps non-linearly to [1,15] so that:
 *   1 -> 1, using native WebGL line
 *   2 -> [4,15] by 4*exp(0.07*(slider-2)) heuristic, using THREE.js mesh line
 */
function setLineThickness() {
   const slider_value = Number($('#line-thickness').val());
   const lineWidth = (slider_value == 1) ? 1 : 4*Math.exp(0.0734*(slider_value-2));
   CD.Cayley_Diagram[0].lineWidth = lineWidth;
   CD.Graphic_Context[0].updateLineWidth(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

function setNodeRadius() {
   CD.Cayley_Diagram[0].nodeScale = Math.exp( Number($('#node-radius').val())/10 );
   CD.Graphic_Context[0].updateNodeRadius(CD.Cayley_Diagram[0]);
   CD.Graphic_Context[0].updateLabels(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

function setFogLevel() {
   CD.Cayley_Diagram[0].fogLevel = $('#use-fog').is(':checked') ? Number($('#fog-level').val())/10 : 0;
   CD.Graphic_Context[0].updateFogLevel(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

function setLabelSize() {
   CD.Cayley_Diagram[0].labelSize = $('#show-labels').is(':checked') ? Math.exp( Number($('#label-size').val())/10 ) : 0;
   CD.Graphic_Context[0].updateLabelSize(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

function setArrowheadPlacement() {
   CD.Cayley_Diagram[0].arrowheadPlacement = Number($('#arrowhead-placement').val())/20;
   CD.Graphic_Context[0].updateArrowheadPlacement(CD.Cayley_Diagram[0]);
   CD.emitStateChange();
}

