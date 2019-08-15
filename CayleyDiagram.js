// @flow

/*::
import CayleyDiagram from './js/CayleyDiagram.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import type {CayleyDiagramJSON} from './js/DisplayDiagram.js';
import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import SSD from './subsetDisplay/subsets.js';
import CVC from './cayleyViewController/view.js';
import DC from './diagramController/diagram.js';
import VC from './visualizerFramework/visualizer.js';

import type {MSG_listenerReady, MSG_stateLoaded, MSG_external, MSG_editor} from './js/SheetModel.js';

type AugmentedCayleyDiagramJSON = CayleyDiagramJSON & {_use_fog?: string,
                                                       _fog_level?: string | string[] | number,
                                                       _show_labels?: string,
                                                       _label_size?: string | string[] | number};
 */

/* Global variables */
var group		/*: XMLGroup */,	// group about which information will be displayed
    Diagram_name	/*: ?string */,		// name of Cayley diagram, or undefined if generated
    Cayley_diagram	/*: CayleyDiagram */,	// data being displayed in large diagram
    Graphic_context	/*: DisplayDiagram */,	// graphic context for large diagram
    canEmit		/*: boolean */ = true;	// flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-cd-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
window.addEventListener('load', load, {once: true});

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   window.addEventListener('resize', resizeBody);
   $('#bodyDouble')[0].addEventListener('click', cleanWindow);

   $('#subset-button')[0].addEventListener('click', () => VC.showPanel('#subset-control') );
   $('#view-button')[0].addEventListener('click', () => VC.showPanel('#view-control') );
   $('#diagram-button')[0].addEventListener('click', () => VC.showPanel('#diagram-control') );

   Tooltip.init();
}

/* Load the static components of the page */
function load() {
   // Promise to load group from invocation URL
   const group_load = Library
         .loadFromURL()
         .then( (_group) => {
             group = _group;
             setDiagramName();
         } )
         .catch( Log.err );

   // Promise to load visualizer framework around visualizer-specific code in this file
   const body_load = VC.load();

   // When group and framework are loaded, load panels and complete setup
   Promise.all([group_load, body_load])
      .then( () =>
             // Preload MathML cache for subsetDisplay, diagramControl
             MathML.preload().then( loadPanels )
           )
      .catch( Log.err );
}

function loadPanels() {
   const subset_display_load = SSD.load($('#subset-control'));
   const view_controller_load = CVC.load($('#view-control'));
   const diagram_controller_load = DC.load($('#diagram-control'));
   Promise.all([subset_display_load, view_controller_load, diagram_controller_load])
          .then(completeSetup)
          .catch( Log.err );
}

/* Set Diagram_name from URL (undefined => use generated Cayley diagram) */
function setDiagramName() {
   Diagram_name = new URL(window.location.href).searchParams.get('diagram');
   if (Diagram_name == null || !group.cayleyDiagrams.some( (diagram) => diagram.name == Diagram_name )) {
      Diagram_name = undefined;
   }
}

/* Now that all the static HTML is loaded, complete the setup */
function completeSetup() {
   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Cayley Diagram for&nbsp;</mtext>' + group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);

   // Create graphic context
   Graphic_context = new DisplayDiagram({container: $('#graphic'), trackballControlled: true});
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
      Diagram_name = jsonData.hasOwnProperty( '_diagram_name' ) ?
         jsonData._diagram_name :
         group.cayleyDiagrams.length > 0 ?
         group.cayleyDiagrams[0].name : undefined;
      DC.DiagramChoice.selectDiagram( Diagram_name, false );
      Cayley_diagram = new CayleyDiagram(group, Diagram_name);
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
      Graphic_context.fromJSON( jsonData, Cayley_diagram );
      $( '#zoom-level' ).val( 10 * Math.log( Cayley_diagram.zoomLevel ) );
      $( '#line-thickness' ).val( Cayley_diagram.lineWidth );
      $( '#node-radius' ).val( 10 * Math.log( Cayley_diagram.nodeScale ) );
      $( '#arrowhead-placement' ).val( 20 * Cayley_diagram.arrowheadPlacement );
      canEmit = true; // restore default behavior
      Graphic_context.showGraphic(Cayley_diagram);
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
      const camera = Graphic_context.camera.matrix.toArray();
      const nodes = Cayley_diagram.nodes.map( n => `${n.point.toArray().toString()}` ).join( ';' );
      const radii = Cayley_diagram.nodes.map( n => `${n.radius || 'undefined'}` ).join( ',' );
      const arrows = Cayley_diagram.lines.map( a => `${a.style},${a.offset || 'undefined'}` ).join( ';' );
      const thisKey = `${camera.toString()} ${nodes} ${radii} ${arrows}`;
      if ( lastKey != thisKey ) emitStateChange();
      lastKey = thisKey;
   }, 1000 );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( group.URL ) $( '#find-group' ).hide();
}

function emitStateChange () {
   if ( canEmit ) {
      const json /*: AugmentedCayleyDiagramJSON */ = Object.assign(
         {},
         Graphic_context.toJSON( Cayley_diagram ),
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
   Cayley_diagram = new CayleyDiagram(group, Diagram_name);
   Graphic_context.showGraphic(Cayley_diagram);
   DC.update();
}

// Resize the body, including the graphic
function resizeBody() {
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   resizeGraphic();
};

function cleanWindow() {
   Tooltip.clear();
   SSD.clearMenus();
   DC.clearMenus();
}

/*
 * Resize the 3D scene from the freshly re-sized graphic
 *   (detach the canvas containing the 3D scene from the DOM,
 *    change camera parameters and renderer size, and then re-attach it)
 */
function resizeGraphic() {
   if (Graphic_context.camera !== undefined) {
      $('#graphic > canvas').detach();
      Graphic_context.camera.aspect = $('#graphic').width() / $('#graphic').height();
      Graphic_context.camera.updateProjectionMatrix();
      Graphic_context.renderer.setSize($('#graphic').width(), $('#graphic').height());
      Graphic_context.updateLineWidth(Cayley_diagram);  // not sure why -- seems to be needed in Chrome
      $('#graphic').append(Graphic_context.renderer.domElement);
   }
}


/*
 * Manages tooltip display in large graphic
 *   mousedown / touchstart clears all tooltips/menus/etc from entire screen and displays
 *   mouseup / touchend then displays label if over an object like a node or a chunk
 *     (don't display the label if it would be the same as the last label displayed
 *       -- so clicking on a spot a second time just removes the label the first click displayed)
 *   click propagation is blocked to prevent the #bodyDouble click handler from removing the just-displayed label
 */
class Tooltip {
/*::
   static lastObjects: Array<mathml>;  // the objects the mouse was over on the previous mousedown/touchstart
   static startTime: number;
 */
   static init() {
      Tooltip.clear();

      if (window.ontouchstart === undefined) {
         ['mousedown', 'mouseup', 'click']
            .forEach( (event) => $('#graphic')[0].addEventListener(event, Tooltip.eventHandler) );
      } else {
         ['touchstart', 'touchend', 'click']
            .forEach( (event) => $('#graphic')[0].addEventListener(event, Tooltip.eventHandler) );
      }
   }

   static clear() {
      $('#tooltip').remove();
      Tooltip.lastObjects = [];
      Tooltip.startTime = 0;
   }      

   static eventHandler(event /*: MouseEvent | TouchEvent */) {
      // if event is modified by shift key, etc., this click isn't about tooltips, so just return
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
         return;
      }

      // only process one-finger touches
      if (event.type.startsWith('touch')) {
         const touchEvent /*: TouchEvent */ = (event /*: any */);
         const touchCount = touchEvent.touches.length + ((touchEvent.type == 'touchend') ? touchEvent.changedTouches.length : 0);
         if (touchCount != 1)
            return;
      }

      switch (event.type) {
      case 'mousedown':
      case 'touchstart':
         const savedObjects = Tooltip.lastObjects;
         cleanWindow();
         Tooltip.lastObjects = savedObjects;
         Tooltip.startTime = event.timeStamp;
         break;
         
      case 'mouseup':
      case 'touchend': {
         // find objects under click
         const canvas = Graphic_context.renderer.domElement;
         const bounding_box = canvas.getBoundingClientRect();
         const eventLocation = function (ev /*: Event */) /*: eventLocation */ {
            if (event.type.startsWith('touch')) {
               const touchEvent /*: TouchEvent */ = (event /*: any */);
               return (event.type == 'touchend') ? touchEvent.changedTouches[0] : touchEvent.touches[0];
            } else {
               return ((event /*: any */) /*: MouseEvent */);
            }
         } (event);
         const x = ( (eventLocation.clientX - bounding_box.left) / canvas.width) * 2 - 1;
         const y = -( (eventLocation.clientY - bounding_box.top) / canvas.height) * 2 + 1;
         const objects = Graphic_context.getObjectsAtPoint(x, y).map( (obj) => MathML.sans(obj.name) );

         // add tooltip if
         //    mousedown is over some objects
         // && tooltip wouldn't be the same as the last tooltip
         // && mouseup is not too delayed
         if (   objects.length != 0
             && event.timeStamp - Tooltip.startTime < 500
             && !GEUtils.equals(Tooltip.lastObjects, objects) ) {
            // create tooltip
            const first = objects[0];
            const others = objects.slice(1);

            let tooltip;
            if (others.length == 0) {
               tooltip = $(eval(Template.HTML('single-object_template')));
            } else if (others.length == 1) {
               tooltip = $(eval(Template.HTML('double-object_template')));
            } else {
               tooltip = $(eval(Template.HTML('multi-object_template')));
               others.forEach( (obj) => {
                  tooltip.find('ul').append($(`<li>${obj}</li>`));
               } )
            }

            // add tooltip to graphic
            $('#graphic').append(tooltip);
            Menu.setMenuLocations(eventLocation, tooltip);
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'tooltip']);

            Tooltip.lastObjects = objects;
         } else {
            Tooltip.lastObjects = [];
         } }
         break;

      case 'click':
         event.stopPropagation();
         break;

      default:
         Log.warn('Tooltip handler -- unexpected event %s', event.type);
      }
   }
}

/* Highlighting routines */
function highlightByNodeColor(elements /*: Array<Array<groupElement>> */) {
   Cayley_diagram.highlightByNodeColor(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function highlightByRingAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_diagram.highlightByRingAroundNode(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function highlightBySquareAroundNode(elements /*: Array<Array<groupElement>> */) {
   Cayley_diagram.highlightBySquareAroundNode(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function clearHighlights() {
   Cayley_diagram.clearHighlights();
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}
