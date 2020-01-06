// @flow

import CayleyDiagram from './js/CayleyDiagram.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import DiagramDnD from './js/DiagramDnD.js';
import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import * as SSD from './subsetDisplay/subsets.js';
import * as CVC from './cayleyViewController/view.js';
import * as DC from './diagramController/diagram.js';
import * as VC from './visualizerFramework/visualizer.js';

export {loadGroup as load, emitStateChange, displayGraphic};

/*::
import type {CayleyDiagramJSON} from './js/DisplayDiagram.js';
import type {MSG_listenerReady, MSG_stateLoaded, MSG_external, MSG_editor} from './js/SheetModel.js';

type AugmentedCayleyDiagramJSON = CayleyDiagramJSON & {_use_fog?: string,
                                                       _fog_level?: string | string[] | number,
                                                       _show_labels?: string,
                                                       _label_size?: string | string[] | number};
*/

/* Exported module variables */
const Group          /*: Array<XMLGroup> */ = [];       // group about which information will be displayed
const Diagram_Name   /*: Array<string> */ = [];		// name of Cayley diagram, or undefined if generated
const Cayley_Diagram /*: Array<CayleyDiagram> */ = [];  // data being displayed in large diagram
const Graphic_Context/*: Array<DisplayDiagram> */ = []; // graphic context for large diagram
export {Group, Diagram_Name, Cayley_Diagram, Graphic_Context};

/* Module variables */
let DnD_handler      /*: DiagramDnD */;			// drag-and-drop, tooltip handler for large diagram
let canEmit          /*: boolean */ = true;		// flag: whether to notify parent window of table changes

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
         setDiagramNameFromURL();
         loadVisualizerFramework();
      } )
      .catch( Log.err );
}

// Load visualizer framework around visualizer-specific code in this file
function loadVisualizerFramework() {
   VC.load(Group[0], HELP_PAGE)
      .then( () => {
         preloadMathMLCache();
      } )
      .catch( Log.err );
}

function preloadMathMLCache() {
   MathML.preload(Group[0])
      .then( () => loadPanels() )
      .catch( Log.err )
}

function loadPanels() {
   const highlighters = [
      {handler: highlightByNodeColor, label: 'Node color'},
      {handler: highlightByRingAroundNode, label: 'Ring around node'},
      {handler: highlightBySquareAroundNode, label: 'Square around node'}
   ];
   const subset_display_load = SSD.load($('#subset-control'), highlighters, clearHighlights, Group[0]);
   const view_controller_load = CVC.load($('#view-control'));
   const diagram_controller_load = DC.load($('#diagram-control'));
   Promise.all([subset_display_load, view_controller_load, diagram_controller_load])
          .then(completeSetup)
          .catch( Log.err );
}

/* Set Diagram_Name from URL (undefined => use generated Cayley diagram) */
function setDiagramNameFromURL() {
   let name = new URL(window.location.href).searchParams.get('diagram');
   if (name == null || !Group[0].cayleyDiagrams.some( (diagram) => diagram.name == name )) {
      Diagram_Name.pop();
   } else {
      Diagram_Name[0] = name;
   }
}

/* Now that all the static HTML is loaded, complete the setup */
function completeSetup() {
   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Cayley Diagram for&nbsp;</mtext>' + Group[0].name));

   // Create graphic context
   Graphic_Context[0] = new DisplayDiagram({container: $('#graphic'), trackballControlled: true});
   DnD_handler = new DiagramDnD(Graphic_Context[0]);
   displayGraphic();

   // Register the splitter with jquery-resizable
   (($('#vert-container') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   });

   // Register event handlers
   registerCallbacks();

   VC.showPanel('#subset-control');

   window.addEventListener( 'message', function ( event /*: MessageEvent */) {
      const event_data /*: MSG_external<CayleyDiagramJSON> */ = (event.data /*: any */);
      if (typeof event_data == 'undefined' || event_data.source != 'external') {
         Log.warn('unknown message received in CayleyDiagram.js:');
         Log.warn(event.data);
         return;
      }
      const jsonData /*: AugmentedCayleyDiagramJSON */ = (event_data.json /*: any */);
      canEmit = false; // don't spam notifications of changes about to happen
      const diagram_name = jsonData.hasOwnProperty( '_diagram_name' ) ?
            jsonData._diagram_name : (Group[0].cayleyDiagrams.length > 0 ? Group[0].cayleyDiagrams[0].name : undefined);
      if (diagram_name == undefined) {
         Diagram_Name.pop();
      } else {
         Diagram_Name[0] = diagram_name;
      }
      DC.DiagramChoice.selectDiagram( Diagram_Name[0], false );
      Cayley_Diagram[0] = new CayleyDiagram(Group[0], Diagram_Name[0]);
      const _use_fog = jsonData._use_fog;
      if ( _use_fog != undefined )
         $( '#use-fog' ).prop( 'checked', _use_fog );
      const _fog_level = jsonData._fog_level;
      if ( _fog_level != undefined )
         $( '#fog-level' ).val( _fog_level );
      const _show_labels = jsonData._show_labels;
      if ( _show_labels != undefined )
         $( '#show-labels' ).prop( 'checked', _show_labels );
      const _label_size = jsonData._label_size;
      if ( _label_size != undefined )
         $( '#label-size' ).val( _label_size );
      Graphic_Context[0].fromJSON( jsonData, Cayley_Diagram[0] );
      $( '#zoom-level' ).val( 10 * Math.log( Cayley_Diagram[0].zoomLevel ) );
      $( '#line-thickness' ).val( Cayley_Diagram[0].lineWidth );
      $( '#node-radius' ).val( 10 * Math.log( Cayley_Diagram[0].nodeScale ) );
      $( '#arrowhead-placement' ).val( 20 * Cayley_Diagram[0].arrowheadPlacement );
      canEmit = true; // restore default behavior
      Graphic_Context[0].showGraphic(Cayley_Diagram[0]);
      DC.update();
      const msg /*: MSG_stateLoaded */ = 'state loaded';
      window.postMessage( msg, myDomain );
   }, false );

   const msg /*: MSG_listenerReady */ = 'listener ready';
   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( msg, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( msg, '*' );
   // the following code emits a state change if any of our view's data has changed
   // in ways for which we don't currently have event handlers/signals set up.
   // these include camera position, node position, node radius, and arrow positions.
   var lastKey = null;
   setInterval( function () {
      const camera = Graphic_Context[0].camera.matrix.toArray();
      const nodes = Cayley_Diagram[0].nodes.map( n => `${n.point.toArray().toString()}` ).join( ';' );
      const radii = Cayley_Diagram[0].nodes.map( n => `${n.radius || 'undefined'}` ).join( ',' );
      const arrows = Cayley_Diagram[0].lines.map( a => `${a.style},${a.offset || 'undefined'}` ).join( ';' );
      const thisKey = `${camera.toString()} ${nodes} ${radii} ${arrows}`;
      if ( lastKey != thisKey ) emitStateChange();
      lastKey = thisKey;
   }, 1000 );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( Group[0].URL ) $( '#find-group' ).hide();
}

function emitStateChange () {
   if ( canEmit ) {
      const json /*: AugmentedCayleyDiagramJSON */ = Object.assign(
         {},
         Graphic_Context[0].toJSON( Cayley_Diagram[0] ),
         { _use_fog: $( '#use-fog' ).prop( 'checked' ),
           _fog_level: $( '#fog-level' ).val(),
           _show_labels: $( '#show-labels' ).prop( 'checked' ),
           _label_size: $( '#label-size' ).val() }
      );
      const msg /*: MSG_editor<CayleyDiagramJSON> */ = {
         source: 'editor',
         json: json
      };
      window.postMessage( msg, myDomain );
      // Log.debug('SENT:', JSON.stringify( json, null, 4 ) );
   }
}

// Draw Cayley diagram in graphic
function displayGraphic() {
   Cayley_Diagram[0] = new CayleyDiagram(Group[0], Diagram_Name[0]);
   Graphic_Context[0].showGraphic(Cayley_Diagram[0]);
   DC.update();
}

// Resize the body, including the graphic
function resizeBody() {
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   resizeGraphic();
};

/*
 * Resize the 3D scene from the freshly re-sized graphic
 *   (detach the canvas containing the 3D scene from the DOM,
 *    change camera parameters and renderer size, and then re-attach it)
 */
function resizeGraphic() {
   if (Graphic_Context[0].camera !== undefined) {
      $('#graphic > canvas').detach();
      Graphic_Context[0].camera.aspect = $('#graphic').width() / $('#graphic').height();
      Graphic_Context[0].camera.updateProjectionMatrix();
      Graphic_Context[0].renderer.setSize($('#graphic').width(), $('#graphic').height());
      Graphic_Context[0].updateLineWidth(Cayley_Diagram[0]);  // not sure why -- seems to be needed in Chrome
      $('#graphic').append(Graphic_Context[0].renderer.domElement);
   }
}


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
      const $graphic = $('#graphic'); // Graphic_Context.renderer.domElement;
      const bounding_box = $graphic[0].getBoundingClientRect();
      const x = ( (location.clientX - bounding_box.left) / $graphic.width()) * 2 - 1;
      const y = -( (location.clientY - bounding_box.top) / $graphic.height()) * 2 + 1;
      const objects = Graphic_Context[0].getObjectsAtPoint(x, y);
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
   Cayley_Diagram[0].highlightByNodeColor(elements);
   Graphic_Context[0].updateHighlights(Cayley_Diagram[0]);
   emitStateChange();
}

function highlightByRingAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram[0].highlightByRingAroundNode(elements);
   Graphic_Context[0].updateHighlights(Cayley_Diagram[0]);
   emitStateChange();
}

function highlightBySquareAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_Diagram[0].highlightBySquareAroundNode(elements);
   Graphic_Context[0].updateHighlights(Cayley_Diagram[0]);
   emitStateChange();
}

function clearHighlights() {
   Cayley_Diagram[0].clearHighlights();
   Graphic_Context[0].updateHighlights(Cayley_Diagram[0]);
   emitStateChange();
}
