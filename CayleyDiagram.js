// @flow

import {THREE} from './lib/externals.js';

import {CayleyDiagramView, createInteractiveCayleyDiagramView} from './js/CayleyDiagramView.js';
import DiagramDnD from './js/DiagramDnD.js';
import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import {LISTENER_READY_MESSAGE, STATE_LOADED_MESSAGE} from './js/SheetModel.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import * as SSD from './subsetDisplay/subsets.js';
import * as CVC from './cayleyViewController/view.js';
import * as DC from './diagramController/diagram.js';

import * as VC from './visualizerFramework/visualizer.js';
export {broadcastChange} from './visualizerFramework/visualizer.js';

export {loadGroup as load};

/*::
import type {CayleyDiagramJSON} from './js/CayleyDiagramView.js';
import type {MSG_external, MSG_editor} from './js/SheetModel.js';
*/

/* Exported module variables */
const Group			/*: Array<XMLGroup> */ = [];		// group about which information will be displayed
const Cayley_Diagram_View	/*: Array<CayleyDiagramView> */ = [];	// display for large diagram

export {Group, Cayley_Diagram_View};

/* Module variables */
let DnD_handler      /*: DiagramDnD */;			// drag-and-drop, tooltip handler for large diagram

const HELP_PAGE /*: string */ = 'help/rf-um-cd-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
    window.onresize = resizeBody;
   $('#bodyDouble')[0].addEventListener('click', GEUtils.cleanWindow);
   $('#subset-button')[0].addEventListener('click', () => VC.showPanel('#subset-control') );
   $('#view-button')[0].addEventListener('click', () => VC.showPanel('#view-control') );
   $('#diagram-button')[0].addEventListener('click', () => VC.showPanel('#diagram-control') );

   Tooltip.init();
}

// Load group from invocation URL
function loadGroup() {
   Library
      .loadFromURL()
      .then( (group) => {
         Group[0] = group;
         let diagram_name = new URL(window.location.href).searchParams.get('diagram');
         if (   diagram_name != undefined
             && group.cayleyDiagrams.find( (cayleyDiagram) => cayleyDiagram.name == diagram_name) == undefined) {
            Log.err(`group ${group.shortName} has no Cayley diagram named ${diagram_name} -- generating diagram instead`);
            diagram_name = undefined;
         }
         loadVisualizerFramework(diagram_name);
      } )
      .catch( Log.err );
}

// Load visualizer framework around visualizer-specific code in this file
function loadVisualizerFramework(diagram_name /*: ?string */) {
   VC.load(Group[0], HELP_PAGE)
      .then( () => {
         preloadMathMLCache(diagram_name);
      } )
      .catch( Log.err );
}

function preloadMathMLCache (diagram_name /*: ?string */) {
   MathML.preload(Group[0])
      .then( () => loadPanels(diagram_name) )
      .catch( Log.err )
}

function loadPanels (diagram_name /*: ?string */) {
   const highlighters = [
      {handler: highlightByNodeColor, label: 'Node color'},
      {handler: highlightByRingAroundNode, label: 'Ring around node'},
      {handler: highlightBySquareAroundNode, label: 'Square around node'}
   ];
   const subset_display_load = SSD.load($('#subset-control'), highlighters, clearHighlights, Group[0]);
   const view_controller_load = CVC.load($('#view-control'));
   const diagram_controller_load = DC.load($('#diagram-control'));
   Promise.all([subset_display_load, view_controller_load, diagram_controller_load])
          .then( () => completeSetup(diagram_name) )
          .catch( Log.err );
}

/* Now that all the static HTML is loaded, complete the setup */
function completeSetup(diagram_name /*: ?string */) {
   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Cayley Diagram for&nbsp;</mtext>' + Group[0].name));

   // Create graphic context
   Cayley_Diagram_View[0] = createInteractiveCayleyDiagramView({container: $('#graphic')});
   Cayley_Diagram_View[0].setDiagram(Group[0], diagram_name);
   CVC.fromJSON(Cayley_Diagram_View[0].toJSON());
   DnD_handler = new DiagramDnD(Cayley_Diagram_View[0]);
   DC.setup();

   // Register the splitter with jquery-resizable
   (($('#vert-container') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: () => Cayley_Diagram_View[0].resize(),
   });

   // Register event handlers
   registerCallbacks();

   VC.showPanel('#subset-control');

   // this happens only once, after initiation, doesn't it?
   window.addEventListener('message', receiveInitialSetup, false);

   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( LISTENER_READY_MESSAGE, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( LISTENER_READY_MESSAGE, '*' );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( Group[0].URL ) $( '#find-group' ).hide();
}

// FIXME: can this be invoked more than once with 'external' message?
//   (what if there are two editors around?)
function receiveInitialSetup (event /*: MessageEvent */) {
   if (event.data == undefined)
      return;

   const event_data /*: MSG_external<CayleyDiagramJSON> */ = (event.data /*: any */);
   if (event_data.source == 'external') {
      const json_data = event_data.json;
      Cayley_Diagram_View[0].fromJSON(json_data);
      CVC.fromJSON(json_data);
      DC.update();
      window.postMessage( STATE_LOADED_MESSAGE, myDomain );
      VC.enableChangeBroadcast(() => Cayley_Diagram_View[0].toJSON());
      setInterval( () => VC.broadcastChange(), 1000);
   } else if (   event_data.source == 'editor'
                 || ((event.data /*: any */) /*: string */) == LISTENER_READY_MESSAGE
                 || ((event.data /*: any */) /*: string */) == STATE_LOADED_MESSAGE)
   {
      // we're just receiving our own messages -- ignore them
   } else {
      Log.warn('unknown message of origin $[event.orgin} received in CayleyDiagram.js:');
      Log.warn(event.data);
   }
}

// Resize the body, including the graphic
function resizeBody() {
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   Cayley_Diagram_View[0].resize();
};


/*
 * Manages tooltip display in large graphic
 *   
 *   mousedown / touchstart clears all tooltips/menus/etc from entire screen
 *   if event wasn't over same objects as it was for 

 *   if mouseup / touchend is over an object like a node or a chunk show new label or just remove old
 *     if mouseup is a click
 *        if $tooltip exists && new $tooltip would be for same element again
 *           remove old $tooltip
 *        else
 *           remove old $tooltip
 *           add new $tooltip
 *        endif
 *     endif
 *           
 *   click propagation is blocked to prevent the #bodyDouble click handler from removing the just-displayed label
 */
class Tooltip {
   static init() {
      $('#graphic')[0].addEventListener('click', Tooltip.eventHandler);
      if (GEUtils.isTouchDevice()) {
         $('#graphic')[0].addEventListener('touchstart', Tooltip.eventHandler);
      } else {
         $('#graphic')[0].addEventListener('mousedown', Tooltip.eventHandler);
         $('#graphic')[0].addEventListener('wheel', Tooltip.eventHandler);
         $('#graphic')[0].addEventListener('contextmenu', Tooltip.eventHandler);
      }
   } 

   static eventHandler(event /*: Event */) {
      if (event.type == 'touchstart') {
         const touchEvent = ((event /*: any */) /*: TouchEvent */);
         // only handle single touch events
         if (touchEvent.touches.length != 1)
            return;
      } else if (event.type == 'mousedown') {
         const mouseEvent = ((event /*: any */) /*: MouseEvent */);
         // if event is modified by shift key, etc., this event isn't about tooltips, so just return
         if (mouseEvent.shiftKey || mouseEvent.ctrlKey || mouseEvent.altKey || mouseEvent.metaKey)
            return;
      } else if (event.type != 'click') {
         GEUtils.cleanWindow();
         return;
      }

      const event_location = (event.type == 'touchstart')
                             ? ((event /*: any */) /*: TouchEvent */).touches[0]
                             : ((event /*: any */) /*: MouseEvent */);

      switch (event.type) {
      case 'touchstart':
      case 'mousedown': {
         const $old_tooltip = $('#tooltip:visible');
         const current_objectIDs = Tooltip.getObjectIDsAtLocation(event_location).map( (obj) => obj.id ).join(', ');
         const make_new_tooltip = current_objectIDs.length != 0 &&				   // clicked over an object
               !($old_tooltip.length != 0 && $old_tooltip.attr('objectIDs') == current_objectIDs); // not the same as existing tooltip
         GEUtils.cleanWindow();
         if (make_new_tooltip) {
            const $new_tooltip = Tooltip.createTooltip(event_location);
            const timeoutID = setTimeout( () => $new_tooltip.remove(), 500 );
            $new_tooltip.attr('timeoutID', ((timeoutID /*: any */) /*: number */));
         } }
         break;

      case 'click': {
         const $tooltip = $('#tooltip');
         if ($tooltip.length != 0) {
            clearTimeout( (($tooltip.attr('timeoutID') /*: any */) /*: TimeoutID */) );
            $tooltip.show();
            event.stopPropagation();
         } }
         break;

         // Unexpected events
      default:
         Log.warn(`CayleyDiagram Tooltip.eventHandler unexpected event ${event.type}`);
      }
   }

   static getObjectIDsAtLocation(location /*: eventLocation */) /*: Array<THREE.Object3D> */ {
      const $graphic = $('#graphic'); // Cayley_Diagram_View[0].renderer.domElement;
      const bounding_box = $graphic[0].getBoundingClientRect();
      const x = ( (location.clientX - bounding_box.left) / $graphic.width()) * 2 - 1;
      const y = -( (location.clientY - bounding_box.top) / $graphic.height()) * 2 + 1;
      const objects = Cayley_Diagram_View[0].getObjectsAtPoint(x, y);
      return objects;
   }

   static createTooltip(location /*: eventLocation */) {
      const objects = Tooltip.getObjectIDsAtLocation(location);
      const object_names = objects.map( (obj) => MathML.sans(obj.name) );
      const objectIDs_string = objects.map( (obj) => obj.id ).join(', ');

      // create tooltip
      const top = object_names[0];
      const rest = object_names.slice(1);

      const template_name = (rest.length == 0) ? 'single-object-template' :
                            (rest.length == 1) ? 'double-object-template' :
                            'multi-object-template';
      const $tooltip = $(eval(Template.HTML(template_name)))
                          .appendTo('#graphic');
      Menu.setMenuLocation($tooltip, location);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'tooltip']);

      return $tooltip;
   }
}

/* Highlighting routines */
function highlightByNodeColor(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram_View[0].drawColorHighlights(elements);
}

function highlightByRingAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram_View[0].drawRingHighlights(elements);
}

function highlightBySquareAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram_View[0].drawSquareHighlights(elements);
}

function clearHighlights() {
   Cayley_Diagram_View[0].clearHighlights();
}
