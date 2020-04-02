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

import * as SSD from './js/SubsetHighlightController.js';
import * as CVC from './js/CayleyViewController.js';
import * as DC from './js/CayleyDiagramController.js';

import * as VC from './visualizerFramework/visualizer.js';
export {broadcastChange} from './visualizerFramework/visualizer.js';

export {load};

/*::
import type {CayleyDiagramJSON} from './js/CayleyDiagramView.js';
import type {MSG_external} from './js/SheetModel.js';
*/

/* Module variables */
export let Group /*: XMLGroup */ = new XMLGroup();  // group about which information is displayed
export const Cayley_Diagram_View /*: CayleyDiagramView */ = createInteractiveCayleyDiagramView();
const DnD_handler /*: DiagramDnD */ = new DiagramDnD(Cayley_Diagram_View);  // drag-and-drop handler for large diagram
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

// The element that takes the longest to display is the SubsetHighlightPanel, due to the typesetting required.
// We process along the critical path: load Group, preload MathML cache, generate SubsetHighlightPanel
function load() {
   loadLibrary();
}

function loadLibrary () {
   Library.loadFromURL()
      .then( (group) => {
         Group = group;
         preloadMathMLCache();
      } )
      .catch(Log.err);
}

function preloadMathMLCache () {
   MathML.preload(Group)
      .then( () => displaySubsetHighlightPanel() )
      .catch(Log.err);
}

function displaySubsetHighlightPanel () {
   const highlighters = [
      {handler: highlightByNodeColor, label: 'Node color'},
      {handler: highlightByRingAroundNode, label: 'Ring around node'},
      {handler: highlightBySquareAroundNode, label: 'Square around node'}
   ];
   SSD.load($('#subset-control'), highlighters, clearHighlights, Group)
      .then( () => completeSetup() )
      .catch(Log.err);

   // These activities can proceed before the main graphic is generated

   // Generate Cayley diagram, but don't display in the main #graphic yet
   let diagram_name = new URL(window.location.href).searchParams.get('diagram');
   if (   diagram_name != undefined
          && Group.cayleyDiagrams.find( (cayleyDiagram) => cayleyDiagram.name == diagram_name) == undefined) {
      Log.err(`group ${Group.shortName} has no Cayley diagram named ${diagram_name} -- generating diagram instead`);
      diagram_name = undefined;
   }
   Cayley_Diagram_View.group = Group;		     // set group and diagram name in Cayley_Diagram_View
   Cayley_Diagram_View.diagram_name = diagram_name;  //   and generate their Cayley diagram

   // Create header from group name
   $('#header').html(MathML.sans('<mtext>Cayley Diagram for&nbsp;</mtext>' + Group.name));

   // Register the splitter with jquery-resizable
   (($('#controls') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: () => Cayley_Diagram_View.resize(),
   });

   // Register event handlers
   registerCallbacks();

   // Load icon strip in upper right-hand corner
   VC.load(Group, HELP_PAGE);
}

// Complete setup functions once the main #graphic is sized correctly
function completeSetup () {
   // Is this an editor started by a Sheet? If so, set up communication with Sheet
   if (window.isEditor) {
      setupEditorCallback();
   } else {
      startVisualizer();
   }      

   // This starts building the other panels -- we won't wait until they complete
   // They are initially created with display=none, then exposed when the panel is selected
   DC.load($('#diagram-control'));
   CVC.load($('#view-control'));
}

function startVisualizer () {
   Cayley_Diagram_View.container = $('#graphic')[0]; // append Cayley_Diagram_View to main #graphic panel
   Cayley_Diagram_View.enableTrackballControl();     // enable trackball animation
   Cayley_Diagram_View.render();		     // start animation
}

// Set up message communication for Sheet editor
function setupEditorCallback () {
   // this only happens once, right after initialization
   window.addEventListener('message', receiveInitialSetup, false);

   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( LISTENER_READY_MESSAGE, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( LISTENER_READY_MESSAGE, '*' );
}

// When functioning as an editor for a Sheet this receives the startup configuration
function receiveInitialSetup (event /*: MessageEvent */) {
   if (event.data == undefined)
      return;

   const event_data /*: MSG_external<CayleyDiagramJSON> */ = (event.data /*: any */);
   if (event_data.source == 'external') {
      // Get json from message and build Cayley diagram from it, then start visualizer
      const json_data = event_data.json;
      Cayley_Diagram_View.fromJSON(Group, json_data);
      CVC.updateFromView();
      DC.update();
      startVisualizer();

      // Acknowledge message and remove 'message' listener  (this is the only consequential message it will get)
      window.removeEventListener('message', receiveInitialSetup, false);
      window.postMessage( STATE_LOADED_MESSAGE, myDomain );

      // Set up periodic check for changes and enable their broadcast
      VC.enableChangeBroadcast(() => Cayley_Diagram_View.toJSON());
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

   Cayley_Diagram_View.resize();
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
      const $graphic = $(Cayley_Diagram_View.renderer.domElement);
      const bounding_box = $graphic[0].getBoundingClientRect();
      const x = ( (location.clientX - bounding_box.left) / $graphic.width()) * 2 - 1;
      const y = -( (location.clientY - bounding_box.top) / $graphic.height()) * 2 + 1;
      const objects = Cayley_Diagram_View.getObjectsAtPoint(x, y);
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
   Cayley_Diagram_View.drawColorHighlights(elements);
}

function highlightByRingAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram_View.drawRingHighlights(elements);
}

function highlightBySquareAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram_View.drawSquareHighlights(elements);
}

function clearHighlights() {
   Cayley_Diagram_View.clearHighlights();
}
