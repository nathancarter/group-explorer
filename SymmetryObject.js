// @flow

/*::
import Diagram3D from './js/Diagram3D.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import MathUtils from './js/MathUtils.js';
import Menu from './js/Menu.js';
import SymmetryObject from './js/SymmetryObject.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import VC from './visualizerFramework/visualizer.js';
 */

/* Global variables */
var group		/*: XMLGroup */,	// group about which information will be displayed
    diagramName		/*: string */,		// name of SymmetryObject, guaranteed to be non-empty
    graphicData		/*: Diagram3D */,	// data being displayed in large diagram
    graphicContext	/*: DisplayDiagram */;	// graphic context for large diagram
const HELP_PAGE = 'help/rf-um-os-options/index.html';

/* Initial entry to javascript, called once after document load */
window.addEventListener('load', load, {once: true});

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   window.addEventListener('resize', resizeBody);
   $('#bodyDouble')[0].addEventListener('click', cleanWindow);

   $('#diagram-select')[0].addEventListener('click', diagramClickHandler);
   $('#zoom-level')[0].addEventListener('input', set_zoom_level);
   $('#line-thickness')[0].addEventListener('input', set_line_thickness);
   $('#node-radius')[0].addEventListener('input', set_node_radius);
   $('#use-fog')[0].addEventListener('input', set_fog_level);
   $('#fog-level')[0].addEventListener('input', set_fog_level);
}

/* Load the static components of the page */
function load() {
   // Promise to load group from invocation URL
   const groupLoad = Library
      .loadFromURL()
      .then( (_group) => group = _group )
      .catch( Log.err );

   // Promise to load visualizer framework around visualizer-specific code in this file
   const bodyLoad = VC.load();

   // When group and framework are loaded, insert subset_page and complete rest of setup
   Promise.all([groupLoad, bodyLoad])
          .then( () => {
             setDiagramName();
             if (diagramName != undefined) {
                completeSetup();
             }} )
          .catch( Log.err );
}

/* Set diagramName from URL (undefined => error, no symmetry group) */
function setDiagramName() {
   // Check that this group has a symmetry object
   if (group.symmetryObjects.length == 0) {
      // If not, leave diagramName undefined and alert user
      alert(`The group ${MathML.toUnicode(group.name)} has no symmetry objects.`);
   } else {
      // If so, use the diagram name from the URL search string
      const urlDiagramName = new URL(window.location.href).searchParams.get('diagram');
      // unless it is empty
      if (urlDiagramName == undefined) {
         diagramName = group.symmetryObjects[0].name;
      } else {
         // or it does not match one of the symmetryObjects
         if (!group.symmetryObjects.some( (symmetryObject) => symmetryObject.name == urlDiagramName )) {
            // Name is passed but there is no matching symmetryObject -- alert user and continue
            alert(`The group ${MathML.toUnicode(group.name)} has no symmetry object named ${urlDiagramName}. ` +
                  `Using ${group.symmetryObjects[0].name} instead.`);
            diagramName = group.symmetryObjects[0].name;
         } else {
            diagramName = urlDiagramName;
         }
      }
   }
}

/* Now that group has loaded, complete the setup */
function completeSetup() {
   // Register event handlers
   registerCallbacks();

   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Object of Symmetry for&nbsp;</mtext>' + group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);

   // Create list of symmetry object option for faux-select
   for (let index = 0; index < group.symmetryObjects.length; index++) {
      $('#diagram-choices').append(eval(Template.HTML('diagram-choice-template'))).hide();
   };
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices',
                      () => $('#diagram-choice').html($('#diagram-choices > li:first-of-type').html())]);

   // Draw symmetry object in graphic
   graphicContext = new DisplayDiagram({container: $('#graphic'), trackballControlled: true});
   displaySymmetryObject();

   (($('#vert-container') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   })
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

   resizeGraphic();
};

/* Displays symmetry object -- called during setup, and upon changing symmetry object */
function displaySymmetryObject() {
   graphicData = SymmetryObject.generate(group, diagramName);
   graphicData.lineWidth = 10;
   graphicContext.showGraphic(graphicData);
}

/*
 * Resize the 3D scene from the freshly re-sized graphic
 *   (detach the canvas containing the 3D scene from the DOM,
 *    change camera parameters and renderer size, and then re-attach it)
 */
function resizeGraphic() {
   if (graphicContext.camera !== undefined) {
      $('#graphic > canvas').remove();
      graphicContext.camera.aspect = $('#graphic').width() / $('#graphic').height();
      graphicContext.camera.updateProjectionMatrix();
      graphicContext.renderer.setSize($('#graphic').width(), $('#graphic').height());
      $('#graphic').append(graphicContext.renderer.domElement);
   }
}

function cleanWindow() {
   $('#diagram-choices').hide();
}

/* Change diagram */
function diagramClickHandler(event /*: MouseEvent */) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length == 0) {
      $('#diagram-choices').hide();
   } else {
      eval($curr.attr('action'));
      event.stopPropagation();
   }
}

function set_diagram_name(index /*: number */) {
   diagramName = group.symmetryObjects[index].name;
   $('#diagram-choice').html($(`#diagram-choices > li:nth-of-type(${index+1})`).html());
   $('#diagram-choices').hide();
   displaySymmetryObject();
}

/* Slider handlers */
function set_zoom_level() {
   graphicData.zoomLevel = Math.exp( parseInt($('#zoom-level').val())/10 );
   graphicContext.updateZoomLevel(graphicData);
}

/* Set line thickness from slider value
 *   slider is in range [1,20], maps non-linearly to [1,15] so that:
 *   1 -> 1, using native WebGL line
 *   2 -> [4,15] by 4*exp(0.07*(slider-2)) heuristic, using THREE.js mesh line
 */
function set_line_thickness() {
   const slider_value = parseInt($('#line-thickness').val());
   const lineWidth = (slider_value == 1) ? 1 : 4*Math.exp(0.0734*(slider_value-2));
   graphicData.lineWidth = lineWidth;
   graphicContext.updateLineWidth(graphicData);
}

function set_node_radius() {
   graphicData.nodeScale = Math.exp( parseInt($('#node-radius').val())/10 );
   graphicContext.updateNodeRadius(graphicData);
}

function set_fog_level() {
   graphicData.fogLevel = $('#use-fog').is(':checked') ? parseInt($('#fog-level').val())/10 : 0;
   graphicContext.updateFogLevel(graphicData);
}
