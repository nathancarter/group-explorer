// @flow

import {Cayley_Diagram_View} from '../CayleyDiagram.js';

export {load, setFromJSON};

const VIEW_PANEL_URL = 'cayleyViewController/view.html';

/*::
import type {CayleyDiagramJSON} from '../js/CayleyDiagramView.js';
*/

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

/* Set sliders, check boxes in view panel:
 *   zoom level
 *   line thickness
 *   node radius
 *   use fog/fog level
 *   show labels/label size
 *   arrowhead placement
 */
function setFromJSON (jsonData /*: CayleyDiagramJSON */) {
    Object.entries(jsonData).forEach( ([name, value]) => {
        value = Number(value);
        switch (name) {
        case 'line_width':
           $('#line-thickness').val((value == 1) ? 1 : Math.log(value/4)/0.0734 + 2);
	   break;
        case 'sphere_scale_factor':
	   $('#node-radius').val( 10*Math.log(value) );
	   break;
        case 'arrowhead_placement':
	   $('#arrowhead-placement').val(20*value);
	   break;
        case 'label_scale_factor':
           $('#show-labels').prop('checked', value != 0);
           $('#label-size').val( (value == 0) ? 5 : 10*Math.log(value) );
           break;
        case 'fog_level':
           $('#use-fog').prop('checked', value != 0);
           $('#fog-level').val(10*value);
           break;
        case 'zoom_level':
           $('#zoom-level').val(10*Math.log(value));
           break;
        default:
           return;
        }
    } )
}

/* Slider handlers */
function setZoomLevel() {
   const zoom_level = Math.exp( Number($('#zoom-level').val())/10 );
   Cayley_Diagram_View[0].zoom_level = zoom_level;
}

/* Set line thickness from slider value
 *   slider is in range [1,20], maps non-linearly to [1,15] so that:
 *   1 -> 1, using native WebGL line
 *   2 -> [4,15] by 4*exp(0.07*(slider-2)) heuristic, using THREE.js mesh line
 */
function setLineThickness() {
   const slider_value = Number($('#line-thickness').val());
   const line_width = (slider_value == 1) ? 1 : 4*Math.exp(0.0734*(slider_value-2));
   Cayley_Diagram_View[0].line_width = line_width;
}

function setNodeRadius() {
   const sphere_scale_factor = Math.exp( Number($('#node-radius').val())/10 );
   Cayley_Diagram_View[0].sphere_scale_factor = sphere_scale_factor;
}

function setFogLevel() {
   const fog_level = $('#use-fog').is(':checked') ? Number($('#fog-level').val())/10 : 0;
   Cayley_Diagram_View[0].fog_level = fog_level;
}

function setLabelSize() {
   const label_scale_factor = $('#show-labels').is(':checked') ? Math.exp( Number($('#label-size').val())/10 ) : 0;
   Cayley_Diagram_View[0].label_scale_factor = label_scale_factor;
}

function setArrowheadPlacement() {
   const arrowhead_placement = Number($('#arrowhead-placement').val())/20;
   Cayley_Diagram_View[0].arrowhead_placement = arrowhead_placement;
}

