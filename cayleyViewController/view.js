// @flow

import {Cayley_Diagram_View} from '../CayleyDiagram.js';
import {CayleyDiagramView} from '../js/CayleyDiagramView.js';
import Log from '../js/Log.js';

export {load, updateFromView};

const VIEW_PANEL_URL = './cayleyViewController/view.html';

/*::
import type {CayleyDiagramJSON} from '../js/CayleyDiagramView.js';
*/

function load($viewWrapper /*: JQuery */) {
   $.ajax( { url: VIEW_PANEL_URL,
             success: (data /*: html */) => {
                $viewWrapper.html(data);
                setupViewPage();
                updateFromView();
             },
             error: (_jqXHR, _status, err) => {
                Log.err(`Error loading ${VIEW_PANEL_URL} ${err === undefined ? '' : ': ' + err}`)
             }
           } );
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

/* Set sliders, check boxes in view panel:
 *   arrowhead placement
 *   use fog/fog level
 *   show labels/label size
 *   line thickness
 *   node radius
 *   zoom level
 */
function updateFromView() {
    $('#arrowhead-placement').val(20*Cayley_Diagram_View.arrowhead_placement);

    const fog_level = Cayley_Diagram_View.fog_level;
    $('#use-fog').prop('checked', fog_level != 0);
    $('#fog-level').val( (fog_level == 0) ? 5 : 10*fog_level);

    const label_scale_factor = Cayley_Diagram_View.label_scale_factor;
    $('#show-labels').prop('checked', label_scale_factor != 0);
    $('#label-size').val( (label_scale_factor == 0) ? 5 : 10*Math.log(label_scale_factor) );

    $('#line-thickness').val(1 + (Cayley_Diagram_View.line_width - 1)/0.75);

    $('#node-radius').val(10*Math.log(Cayley_Diagram_View.sphere_scale_factor));

    $('#zoom-level').val(10*Math.log(Cayley_Diagram_View.zoom_level));
}

/* Slider handlers */
function setZoomLevel() {
   const zoom_level = Math.exp( Number($('#zoom-level').val())/10 );
   Cayley_Diagram_View.zoom_level = zoom_level;
}

function setLineThickness() {
   const slider_value = Number($('#line-thickness').val());
   const line_width = 1 + 0.75*(slider_value - 1);
   Cayley_Diagram_View.line_width = line_width;
}

function setNodeRadius() {
   const sphere_scale_factor = Math.exp( Number($('#node-radius').val())/10 );
   Cayley_Diagram_View.sphere_scale_factor = sphere_scale_factor;
}

function setFogLevel() {
   const fog_level = $('#use-fog').is(':checked') ? Number($('#fog-level').val())/10 : 0;
   Cayley_Diagram_View.fog_level = fog_level;
}

function setLabelSize() {
   const label_scale_factor = $('#show-labels').is(':checked') ? Math.exp( Number($('#label-size').val())/10 ) : 0;
   Cayley_Diagram_View.label_scale_factor = label_scale_factor;
}

function setArrowheadPlacement() {
   const arrowhead_placement = Number($('#arrowhead-placement').val())/20;
   Cayley_Diagram_View.arrowhead_placement = arrowhead_placement;
}

