// @flow

/* global $ */

import GEUtils from './js/GEUtils.js';
import * as Library from './js/Library.js';
import Log from './js/Log.js';
import {SymmetryObjectView, createInteractiveSymmetryObjectView} from './js/SymmetryObjectView.js';
import Template from './js/Template.js';
import * as VC from './visualizerFramework/visualizer.js';
import XMLGroup from './js/XMLGroup.js';

export {load};

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
   $('#bodyDouble')[0].addEventListener('click', GEUtils.cleanWindow);

  if (GEUtils.isTouchDevice()) {
    $('#controls')[0].addEventListener('touchstart', (event /*: Event */) => event.stopPropagation())
    $('#controls')[0].addEventListener('touchmove', (event /*: Event */) => event.stopPropagation())
    $('#controls')[0].addEventListener('touchend', (event /*: Event */) => event.stopPropagation())
  } else { // must be mouse device
    $('#controls')[0].addEventListener('mousedown', (event /*: Event */) => event.stopPropagation())
    $('#controls')[0].addEventListener('mousemove', (event /*: Event */) => event.stopPropagation())
    $('#controls')[0].addEventListener('mouseup', (event /*: Event */) => event.stopPropagation())
  }

   $('#diagram-select')[0].addEventListener('change', diagramChangeHandler);
   $('#zoom-level')[0].addEventListener('input', set_zoom_level);
   $('#line-thickness')[0].addEventListener('input', set_line_thickness);
   $('#node-radius')[0].addEventListener('input', set_node_radius);
   $('#use-fog')[0].addEventListener('input', set_fog_level);
   $('#fog-level')[0].addEventListener('input', set_fog_level);
}

// Load group from invocation URL, then get diagram name and complete setup
async function load () {
  Group = await Library.loadFromURL()

  // Get diagram name from URL
  const diagramName = getDiagramName()

  // Register event handlers
  registerCallbacks()

  // Create header from group name
  $('#heading').html(`Object of Symmetry for ${Group.name}`)

  // Create list of symmetry object option for faux-select
  const choices = Group.symmetryObjects.map((symmetryObject, index) => eval(Template.HTML('diagram-choice-template')).trim())
  const choiceIndex = Group.symmetryObjects.findIndex(({name}) => name === diagramName)
  GEUtils.setupFauxSelect($('#diagram-select')[0], choices, choiceIndex)

  // Draw symmetry object in graphic
  Symmetry_Object_View = createInteractiveSymmetryObjectView({ container: $('#graphic') })
  Symmetry_Object_View.setObject(Group.symmetryObjects[choiceIndex])
  $('#line-thickness').val(1 + (Symmetry_Object_View.line_width - 1) / 0.75)

  // Load icon strip in upper right-hand corner
  VC.load(Group, HELP_PAGE)
}

/* Get diagram name from URL; throw exception when group has no symmetry object */
function getDiagramName() /*: string */ {
   let diagram_name;
   // Check that this group has a symmetry object
   if (Group.symmetryObjects.length == 0) {
      // Throws exception if group has no symmetry objects
      throw `The group ${Group.shortName} has no symmetry objects.`;
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
            Log.warn(`The group ${Group.shortName} has no symmetry object named ${urlDiagramName}. ` +
                     `Using ${Group.symmetryObjects[0].name} instead.`);
            diagram_name = Group.symmetryObjects[0].name;
         } else {
            diagram_name = urlDiagramName;
         }
      }
   }

   return diagram_name;
}

// Resize the body, including the graphic
function resizeBody() {
   $('body, #bodyDouble').height(window.innerHeight);
   $('body, #bodyDouble').width(window.innerWidth);

   Symmetry_Object_View.resize(); // resizeGraphic();
};

/* Change diagram */
function diagramChangeHandler(changeEvent /*: Event */) {
   const choice = $(changeEvent.target).children()[0];
   if (choice != null) {
      const symmetryObjectIndex = $(choice).attr('data-symmetry-object-index')
      Symmetry_Object_View.setObject(Group.symmetryObjects[parseInt(symmetryObjectIndex)])
   }
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
