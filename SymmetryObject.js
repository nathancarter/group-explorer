// @flow

import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import {SymmetryObjectView, createInteractiveSymmetryObjectView} from './js/SymmetryObjectView.js';
import Template from './js/Template.js';
import * as VC from './visualizerFramework/visualizer.js';
import XMLGroup from './js/XMLGroup.js';

export {loadGroup as load};

/*::
import type {XMLSymmetryObject} from './js/XMLGroup.js';
*/

/* Module variables */
let Group			/*: XMLGroup */;		// group about which information will be displayed
let Symmetry_Object_View	/*: SymmetryObjectView */;	// SymmetryObject view of Group

const HELP_PAGE = 'help/rf-um-os-options/index.html';

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   window.onresize = resizeBody;
   $('#bodyDouble')[0].addEventListener('click', cleanWindow);

   $('#diagram-select')[0].addEventListener('click', diagramClickHandler);
   $('#zoom-level')[0].addEventListener('input', set_zoom_level);
   $('#line-thickness')[0].addEventListener('input', set_line_thickness);
   $('#node-radius')[0].addEventListener('input', set_node_radius);
   $('#use-fog')[0].addEventListener('input', set_fog_level);
   $('#fog-level')[0].addEventListener('input', set_fog_level);
}

// Load group from invocation URL
function loadGroup() {
   Library
      .loadFromURL()
      .then( (group) => {
         Group = group;
         loadVisualizerFramework();
      } )
      .catch( Log.err );
}

// Load visualizer framework around visualizer-specific code in this file
function loadVisualizerFramework() {
   VC.load(Group, HELP_PAGE)
      .then( () => {
         const diagram_name = getDiagramName();
         completeSetup(diagram_name);
      } )
      .catch( Log.err );
}

/* Get diagram name from URL; throw exception when group has no symmetry object */
function getDiagramName() /*: string */ {
   let diagram_name;
   // Check that this group has a symmetry object
   if (Group.symmetryObjects.length == 0) {
      // Throws exception is group has no symmetry objects
      throw `The group ${MathML.toUnicode(Group.name)} has no symmetry objects.`;
   } else {
      // If so, use the diagram name from the URL search string
      const urlDiagramName = new URL(window.location.href).searchParams.get('diagram');
      // unless it is empty
      if (urlDiagramName == undefined) {
         diagram_name = Group.symmetryObjects[0].name;
      } else {
         // or it does not match one of the symmetryObjects
         if (!Group.symmetryObjects.some( (symmetryObject) => symmetryObject.name == urlDiagramName )) {
            // Name is passed but there is no matching symmetryObject -- alert user and continue
            Log.warn(`The group ${MathML.toUnicode(Group.name)} has no symmetry object named ${urlDiagramName}. ` +
                     `Using ${Group.symmetryObjects[0].name} instead.`);
            diagram_name = Group.symmetryObjects[0].name;
         } else {
            diagram_name = urlDiagramName;
         }
      }
   }

   return diagram_name;
}

/* Now that Group has loaded, complete the setup */
function completeSetup(diagram_name /*: string */) {
   // Register event handlers
   registerCallbacks();

   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Object of Symmetry for&nbsp;</mtext>' + Group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);

   // Create list of symmetry object option for faux-select
   for (let index = 0; index < Group.symmetryObjects.length; index++) {
      $('#diagram-choices').append(eval(Template.HTML('diagram-choice-template'))).hide();
   };
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices',
                      () => $('#diagram-choice').html($('#diagram-choices > li:first-of-type').html())]);

   // Draw symmetry object in graphic
   Symmetry_Object_View = createInteractiveSymmetryObjectView({container: $('#graphic')});
   set_diagram_name(Group.symmetryObjects.findIndex( (symmetry_object) => symmetry_object.name == diagram_name ));
   $('#line-thickness').val(1 + (Symmetry_Object_View.line_width - 1)/0.75);

   (($('#vert-container') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: () => Symmetry_Object_View.resize(), // resizeGraphic,
   })
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

   Symmetry_Object_View.resize(); // resizeGraphic();
};

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
   const diagram_name = Group.symmetryObjects[index].name;
   $('#diagram-choice').html($(`#diagram-choices > li:nth-of-type(${index+1})`).html());
   $('#diagram-choices').hide();
   Symmetry_Object_View.setObject(Group.symmetryObjects[index]);
}

/* Slider handlers */
function set_zoom_level() {
   const zoom_level = Math.exp( parseInt($('#zoom-level').val())/10 );
   Symmetry_Object_View.zoom_level = zoom_level;
}

function set_line_thickness() {
   const slider_value = parseInt($('#line-thickness').val());
   const line_width = 1 + 0.75*(slider_value - 1);
   Symmetry_Object_View.line_width = line_width;
}

function set_node_radius() {
   const node_scale = Math.exp( parseInt($('#node-radius').val())/10 );
   Symmetry_Object_View.sphere_scale_factor = node_scale;
}

function set_fog_level() {
   const fog_level = $('#use-fog').is(':checked') ? parseInt($('#fog-level').val())/10 : 0;
   Symmetry_Object_View.fog_level = fog_level;
}
