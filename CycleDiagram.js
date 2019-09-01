// @flow

/*::
import CycleGraph from './js/CycleGraph.js';
import DisplayCycleGraph from './js/DisplayCycleGraph.js';
import type {CycleGraphJSON} from './js/DisplayCycleGraph.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import XMLGroup from './js/XMLGroup.js';

import VC from './visualizerFramework/visualizer.js';
import SSD from './subsetDisplay/subsets.js';

import type {MSG_listenerReady, MSG_stateLoaded, MSG_external, MSG_editor} from './js/SheetModel.js';
 */

// global variables
var group		/*: XMLGroup */,		// group about which information will be displayed
    cyclegraph		/*: CycleGraph */,		// data being displayed in large diagram
    graphicContext	/*: DisplayCycleGraph */,	// graphic context for large diagram
    canEmit		/*: boolean */ = true;		// flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-cg-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
window.addEventListener('load', load, {once: true});

// Static event managers (called after document is assembled)
function registerCallbacks() {
   // window-wide event listeners
   window.addEventListener('resize', resizeBody);
   $('#bodyDouble')[0].addEventListener('click', cleanWindow);
   window.addEventListener('contextmenu', (mouseEvent /*: MouseEvent */) => {
      cleanWindow();
      mouseEvent.preventDefault();
   });

   LargeGraphic.init();
}

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
          .then( () =>
             // Preload MathML cache for subsetDisplay
             MathML.preload(group).then( () =>
                // Load subset display, and complete setup
                SSD.load($('#subset-control')).then(completeSetup)
             )
          )
          .catch( Log.err );
}


/* Now that subsetDisplay is loaded, complete the setup */
function completeSetup() {
   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Cycle Graph for&nbsp;</mtext>' + group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);

   // Create Cycle Graph, graphic context (it will be displayed in resizeBody below)
   cyclegraph = new CycleGraph(group);
   graphicContext = new DisplayCycleGraph({container: $('#graphic')});

   // Register event handlers
   registerCallbacks();

   // Register the splitter with jquery-resizable, so you can resize the graphic horizontally
   // by grabbing the border between the graphic and the subset control and dragging it
   (($('#vert-container') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   });

   resizeBody();

   window.addEventListener( 'message', function (event /*: MessageEvent */) {
      const event_data /*: MSG_external<CycleGraphJSON> */ = (event.data /*: any */);
      if (typeof event.data == 'undefined' || ((event.data /*: any */) /*: Obj */).source != 'external') {
         Log.warn('unknown message received in CycleDiagram.js:');
         Log.warn(event.data);
         return;
      }
      canEmit = false; // don't spam notifications of changes about to happen
      graphicContext.fromJSON( event_data.json, cyclegraph );
      graphicContext.showLargeGraphic( cyclegraph );
      canEmit = true; // restore default behavior
      const msg /*: MSG_stateLoaded */ = 'state loaded';
      window.postMessage( msg, myDomain );
   }, false );

   const msg /*: MSG_listenerReady */ = 'listener ready';
   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( msg, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( msg, '*' );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( group.URL ) $( '#find-group' ).hide();
}

function emitStateChange () {
   if ( canEmit ) {
      const msg /*: MSG_editor<CycleGraphJSON> */ = {
         source : 'editor',
         json : graphicContext.toJSON( cyclegraph )
      };
      window.postMessage( msg, myDomain );
   }
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

   resizeGraphic();
};

function resizeGraphic() {
   graphicContext.canvas.width = $('#graphic').width();
   graphicContext.canvas.height = $('#graphic').height();
   graphicContext.showLargeGraphic(cyclegraph);
}

function cleanWindow() {
   $('#nodeLabel').remove();
   SSD.clearMenus();
}


/*
 * Large graphic mouse events
 *   display/clear label -- click / tap
 *   zoom in/out -- wheel / two-finger pinch-spread
 *   move graph -- drag-and-drop / two-finger drag
 *   recenter, reset zoom -- right click / two-finger tap
 */
class LargeGraphic {
/*::
  static lastEvent: ?Event;
 */
   static init() {
      LargeGraphic.lastEvent = null;

      const canvas = $('#graphic > canvas')[0];
      if (window.ontouchstart === undefined) {  // determine whether device supports touch events
         ['click', 'wheel', 'contextmenu', 'mousedown', 'mousemove', 'mouseup']
            .forEach( (eventType) => canvas.addEventListener(eventType, LargeGraphic.mouseHandler) );
      } else {
         ['click', 'touchstart', 'touchmove', 'touchend']
            .forEach( (eventType) => canvas.addEventListener(eventType, LargeGraphic.touchHandler) );
      }
   }

   // Event handler for mouse-only platform
   static mouseHandler(mouseEvent /*: MouseEvent */) {
      // skip modified events
      if (mouseEvent.shiftKey || mouseEvent.ctrlKey || mouseEvent.altKey || mouseEvent.metaKey) {
         return;
      };

      const lastEvent /*: MouseEvent */ = (LargeGraphic.lastEvent /*: any */);

      switch (mouseEvent.type) {
      case 'click':
         cleanWindow();
         if (LargeGraphic.lastEvent == null) {
            LargeGraphic.displayLabel(mouseEvent);
         }
         LargeGraphic.lastEvent = null;
         mouseEvent.stopPropagation();
         break;

      case 'contextmenu':
         LargeGraphic.zoom2fit();
         LargeGraphic.lastEvent = null;
         mouseEvent.preventDefault();
         break;

      case 'wheel':
         cleanWindow();
         (((mouseEvent /*: any */) /*: WheelEvent */).deltaY < 0) ? graphicContext.zoomIn() : graphicContext.zoomOut();
         graphicContext.showLargeGraphic(cyclegraph);
         break;

      case 'mousedown':
         LargeGraphic.lastEvent = mouseEvent;
         break;

      case 'mousemove':
         if (lastEvent != undefined) {
            LargeGraphic.mouseMove(lastEvent, mouseEvent);
            LargeGraphic.lastEvent = mouseEvent;
            mouseEvent.preventDefault();
         }
         break;

      case 'mouseup':
         if (lastEvent != undefined) {
            LargeGraphic.mouseMove(lastEvent, mouseEvent);
            if (lastEvent.type == 'mousedown') {
               LargeGraphic.lastEvent = null;
            }
         }
         mouseEvent.stopPropagation();
         mouseEvent.preventDefault();
      }
   }

   // Event handler for platform that supports touch events
   static touchHandler(event /*: TouchEvent | MouseEvent */) {
      // skip modified events
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
         return;
      };

      // everything here but clicks
      const touchEvent /*: TouchEvent */ = (event /*: any */);

      // only accept two-finger touches
      if (event.type.startsWith('touch')) {
         const touchCount = (touchEvent.type == 'touchend')
               ? (touchEvent.changedTouches.length + touchEvent.touches.length)
               : touchEvent.touches.length;
         if (touchCount != 2) {
            return;
         }
      }

      const lastEvent /*: TouchEvent */ = (LargeGraphic.lastEvent /*: any */);

      switch (event.type) {
      case 'click':
         cleanWindow();
         LargeGraphic.displayLabel( ((event /*: any */) /*: MouseEvent */) );
         LargeGraphic.lastEvent = null;
         event.stopPropagation();
         break;

      case 'touchstart':
         LargeGraphic.lastEvent = touchEvent;
         break;

      case 'touchmove':
         if (lastEvent != undefined) {
            LargeGraphic.touchZoomAndMove(lastEvent, touchEvent);
            LargeGraphic.lastEvent = touchEvent;
            event.preventDefault();
         }
         break;

      case 'touchend':
         if (lastEvent != undefined) {
            if (lastEvent.type == 'touchstart' && touchEvent.timeStamp - lastEvent.timeStamp < 350) {
               LargeGraphic.zoom2fit();               
            } else {
               LargeGraphic.touchZoomAndMove(lastEvent, touchEvent);
            }
            LargeGraphic.lastEvent = null; 
         }
         touchEvent.stopPropagation();
         touchEvent.preventDefault();
      }
   }

   static displayLabel(event /*: eventLocation */) {
      const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
      const clickX = event.clientX - bounding_rectangle.left;
      const clickY = event.clientY - bounding_rectangle.top;
      const element = graphicContext.select(clickX, clickY);
      if (element != undefined) {
         const $label = $('<div id="nodeLabel">').html(MathML.sans(group.representation[element]));
         $('#graphic').append($label);
         Menu.setMenuLocations(event, $label);
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'nodeLabel']);
      }
   }

   static touches(touchEvent /*: TouchEvent */) /*: Array<Touch> */ {
      if (touchEvent.type == 'touchend') {
         const result = Array.from(touchEvent.changedTouches);
         result.push(...Array.from(touchEvent.touches));
         return result;
      } else {
         return Array.from(touchEvent.touches);
      }
   }

   static centroidAndDiameter(touchArray /*: Array<Touch> */) /*: [eventLocation, float] */ {
      const centroid = {clientX: (touchArray[0].clientX + touchArray[1].clientX)/2, 
                        clientY: (touchArray[0].clientY + touchArray[1].clientY)/2 },
            dx = touchArray[0].clientX - touchArray[1].clientX,
            dy = touchArray[0].clientY - touchArray[1].clientY,
            diameter = Math.sqrt(dx*dx + dy*dy);
      return [centroid, diameter];
   }

   static touchZoomAndMove(start /*: TouchEvent */, end /*: TouchEvent */) {
      cleanWindow();
      const [startCentroid, startDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(start)),
            [endCentroid, endDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(end)),
            zoomFactor = endDiameter / startDiameter;
      graphicContext
         .zoom(endDiameter / startDiameter)
         .move(endCentroid.clientX - startCentroid.clientX, endCentroid.clientY - startCentroid.clientY);
      graphicContext.showLargeGraphic(cyclegraph);
   }

   static mouseMove(start /*: MouseEvent */, end /*: MouseEvent */) {
      cleanWindow();
      graphicContext.move(end.clientX - start.clientX, end.clientY - start.clientY);
      graphicContext.showLargeGraphic(cyclegraph);
   }

   static zoom2fit() {
      cleanWindow();
      graphicContext.reset();
      graphicContext.showLargeGraphic(cyclegraph);
   }
}


/* Highlighting routines */
function highlightByBackground(elements /*: Array<Array<groupElement>> */) {
   cyclegraph.highlightByBackground(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function highlightByBorder(elements /*: Array<Array<groupElement>> */) {
   cyclegraph.highlightByBorder(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function highlightByTop(elements /*: Array<Array<groupElement>> */) {
   cyclegraph.highlightByTop(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function clearHighlights() {
   cyclegraph.clearHighlights();
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}
