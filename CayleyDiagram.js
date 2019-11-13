// @flow

/*::
import CayleyDiagram from './js/CayleyDiagram.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import type {CayleyDiagramJSON} from './js/DisplayDiagram.js';
import DiagramDnD from './js/DiagramDnD.md';
import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.md';
import MathML from './js/MathML.md';
import Menu from './js/Menu.js';
import Template from './js/Template.md';
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
var group               /*: XMLGroup */,        // group about which information will be displayed
    Diagram_name        /*: ?string */,         // name of Cayley diagram, or undefined if generated
    Cayley_diagram      /*: CayleyDiagram */,   // data being displayed in large diagram
    Graphic_context     /*: DisplayDiagram */,  // graphic context for large diagram
    DnD_handler         /*: DiagramDnD */,	// drag-and-drop, tooltip handler for large diagram
    canEmit		/*: boolean */ = true;	// flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-cd-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
window.addEventListener('load', load, {once: true});

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
    window.onresize = resizeBody;
   $('#bodyDouble')[0].addEventListener('click', GEUtils.cleanWindow);
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
             MathML.preload(group).then( loadPanels )
           )
      .catch( Log.err );
}

function loadPanels() {
   const highlighters = [
      {handler: highlightByNodeColor, label: 'Node color'},
      {handler: highlightByRingAroundNode, label: 'Ring around node'},
      {handler: highlightBySquareAroundNode, label: 'Square around node'}
   ];
   const subset_display_load = SSD.load($('#subset-control'), highlighters);
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

   // Create graphic context
   Graphic_context = new DisplayDiagram({container: $('#graphic'), trackballControlled: true});
   DnD_handler = new DiagramDnD(Graphic_context);
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
      const $graphic = $('#graphic'); // Graphic_context.renderer.domElement;
      const bounding_box = $graphic[0].getBoundingClientRect();
      const x = ( (location.clientX - bounding_box.left) / $graphic.width()) * 2 - 1;
      const y = -( (location.clientY - bounding_box.top) / $graphic.height()) * 2 + 1;
      const objects = Graphic_context.getObjectsAtPoint(x, y);
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
      Menu.setMenuTreeLocation({id: 'tooltip'}, location);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'tooltip']);

      return $tooltip;
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
