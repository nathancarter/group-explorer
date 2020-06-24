// @flow

import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
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

   $('#diagram-select')[0].addEventListener('click', diagramClickHandler);
   $('#zoom-level')[0].addEventListener('input', set_zoom_level);
   $('#line-thickness')[0].addEventListener('input', set_line_thickness);
   $('#node-radius')[0].addEventListener('input', set_node_radius);
   $('#use-fog')[0].addEventListener('input', set_fog_level);
   $('#fog-level')[0].addEventListener('input', set_fog_level);
}

// Load group from invocation URL, then get diagram name and complete setup
function load() {
   Library
      .loadFromURL()
      .then( (group) => {
         Group = group;
         // Preload the few strings used in this visualizer, makes it easier to sync MathJax and browser display
         const mathml_strings =
               Group.symmetryObjects.map( (symmetryObject) => MathML._2mtext(symmetryObject.name) );
         mathml_strings.push(`<mtext>Object of Symmetry for&nbsp;</mtext>${Group.name}`);
         MathML.cacheStrings(mathml_strings)
            .then( () => {
               const diagram_name = getDiagramName();
               completeSetup(diagram_name);
            } )
            .catch( Log.err );
      } )
      .catch( Log.err );
}

/* Get diagram name from URL; throw exception when group has no symmetry object */
function getDiagramName() /*: string */ {
   let diagram_name;
   // Check that this group has a symmetry object
   if (Group.symmetryObjects.length == 0) {
      // Throws exception if group has no symmetry objects
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

   // Create header from group name
   $('#heading').html(MathML.sans(`<mtext>Object of Symmetry for&nbsp;</mtext>${Group.name}`));

    // Create list of symmetry object option for faux-select
   Group.symmetryObjects.reduce( ($frag, symmetryObject, index) => {
      return $frag.append(eval(Template.HTML('diagram-choice-template')));
   }, $(document.createDocumentFragment()) ).appendTo($('#diagram-choices'));
   $('#diagram-choice').html($('#diagram-choices > li:first-of-type').html());

   // Draw symmetry object in graphic
   Symmetry_Object_View = createInteractiveSymmetryObjectView({container: $('#graphic')});
   setDiagramName(Group.symmetryObjects.findIndex( (symmetry_object) => symmetry_object.name == diagram_name ));
   $('#line-thickness').val(1 + (Symmetry_Object_View.line_width - 1)/0.75);

   // Load icon strip in upper right-hand corner
   VC.load(Group, HELP_PAGE);
}

// Resize the body, including the graphic
function resizeBody() {
   $('body, #bodyDouble').height(window.innerHeight);
   $('body, #bodyDouble').width(window.innerWidth);

   Symmetry_Object_View.resize(); // resizeGraphic();
};

/* Change diagram */
function diagramClickHandler(event /*: MouseEvent */) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length != 0) {
      eval($curr.attr('action'));
      event.stopPropagation();
   }
}

function toggleDiagramChoices () {
   const choices = $('#diagram-choices');
   const new_visibility = choices.css('visibility') == 'visible' ? 'hidden' : 'visible';
   choices.css('visibility', new_visibility);
}

function setDiagramName(index /*: number */) {
   const diagram_name = Group.symmetryObjects[index].name;
   $('#diagram-choice').html($(`#diagram-choices > li:nth-of-type(${index+1})`).html());
   $('#diagram-choices').css('visibility', 'hidden');
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
