// @flow

import {CycleGraphView, createLabelledCycleGraphView} from './js/CycleGraphView.js';
import GEUtils from './js/GEUtils.js';
import * as Library from './js/Library.js';
import Log from './js/Log.js';
import Menu from './js/Menu.js';
import {LISTENER_READY_MESSAGE, STATE_LOADED_MESSAGE} from './js/SheetModel.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import * as SSD from './js/SubsetHighlightController.js';
import * as VC from './visualizerFramework/visualizer.js';

export {broadcastChange} from './visualizerFramework/visualizer.js';

export {load};

/*::
import type {CycleGraphJSON} from './js/CycleGraphView.js';
import type {MSG_external, MSG_editor} from './js/SheetModel.js';
*/

// Module variables
let Group		/*: XMLGroup */;		// group about which information will be displayed
let Cycle_Graph_View	/*: CycleGraphView */;		// graphic context for large diagram

const HELP_PAGE = 'help/rf-um-cg-options/index.html';

const myDomain = new URL(window.location.href).origin;

// Static event managers (called after document is assembled)
function registerCallbacks() {
   // window-wide event listeners
   window.onresize = resizeBody;
   $('#bodyDouble')[0].addEventListener('click', GEUtils.cleanWindow);
   window.addEventListener('contextmenu', (mouseEvent /*: MouseEvent */) => {
      GEUtils.cleanWindow();
      mouseEvent.preventDefault();
   });

   LargeGraphic.init();
}

// Load group from invocation URL and complete setup
async function load () {
  Group = await Library.loadFromURL()

  const highlighters = [
    {handler: highlightByBackground, label: 'Background'},
    {handler: highlightByBorder, label: 'Border'},
    {handler: highlightByTop, label: 'Top'}
  ];
  
  await SSD.load($('#subset-control'), highlighters, clearHighlights, Group)

   // Create header from group name
   $('#heading').html(`Cycle Graph for ${Group.name}`);

   // Create Cycle Graph, graphic context (it will be displayed in resizeBody below)
   Cycle_Graph_View = createLabelledCycleGraphView({container: $('#graphic')});
   Cycle_Graph_View.group = Group;

   // Register event handlers
   registerCallbacks();

   // Register the splitter with jquery-resizable, so you can resize the graphic horizontally
   // by grabbing the border between the graphic and the subset control and dragging it
   (($('#controls') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: () => Cycle_Graph_View.resize(),
   });

   // Is this an editor started by a Sheet? If so, set up communication with Sheet
   if (window.location.href.includes('SheetEditor=true')) {
      setupEditorCallback();
   }

   // Load icon strip in upper right-hand corner
   VC.load(Group, HELP_PAGE);
}

function setupEditorCallback () {
   window.addEventListener('message', receiveInitialSetup, false);

   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( LISTENER_READY_MESSAGE, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( LISTENER_READY_MESSAGE, '*' );
}

function receiveInitialSetup (event /*: MessageEvent */) {
   if (event.data == undefined)
      return;

   const event_data /*: MSG_external<CycleGraphJSON> */ = (event.data /*: any */);
   if (event_data.source == 'external') {
      Cycle_Graph_View.fromJSON(event_data.json);
      Cycle_Graph_View.queueShowGraphic();
      VC.enableChangeBroadcast(() => Cycle_Graph_View.toJSON());
      window.postMessage( STATE_LOADED_MESSAGE, myDomain );
   } else if (   event_data.source == 'editor'
              || ((event.data /*: any */) /*: string */) == LISTENER_READY_MESSAGE
              || ((event.data /*: any */) /*: string */) == STATE_LOADED_MESSAGE)
   {
      // we're just receiving our own messages -- ignore them
   } else {
      Log.warn('unknown message received in CycleGraph.js:');
      Log.warn(event.data);
   }
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

    Cycle_Graph_View.resize();
};


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
         GEUtils.cleanWindow();
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
         GEUtils.cleanWindow();
         const deltaY = ((mouseEvent /*: any */) /*: WheelEvent */).deltaY;
         (deltaY < 0) ? Cycle_Graph_View.zoomIn(deltaY) : Cycle_Graph_View.zoomOut(deltaY);
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
         GEUtils.cleanWindow();
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
      const element = Cycle_Graph_View.select(clickX, clickY);
      if (element != undefined) {
         const $label = $(eval(Template.HTML('node-label-template')))
                          .appendTo('#graphic');
         Menu.setMenuLocation($label, event);
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
      GEUtils.cleanWindow();
      const [startCentroid, startDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(start)),
            [endCentroid, endDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(end)),
            zoomFactor = endDiameter / startDiameter;
      Cycle_Graph_View
         .zoom(endDiameter / startDiameter)
         .move(endCentroid.clientX - startCentroid.clientX, endCentroid.clientY - startCentroid.clientY);
   }

   static mouseMove(start /*: MouseEvent */, end /*: MouseEvent */) {
      GEUtils.cleanWindow();
      Cycle_Graph_View.move(end.clientX - start.clientX, end.clientY - start.clientY);
   }

   static zoom2fit() {
      GEUtils.cleanWindow();
      Cycle_Graph_View.reset();
   }
}


/* Highlighting routines */
function highlightByBackground(elements /*: Array<Array<groupElement>> */) {
   Cycle_Graph_View.highlightByBackground(elements);
}

function highlightByBorder(elements /*: Array<Array<groupElement>> */) {
   Cycle_Graph_View.highlightByBorder(elements);
}

function highlightByTop(elements /*: Array<Array<groupElement>> */) {
   Cycle_Graph_View.highlightByTop(elements);
}

function clearHighlights() {
   Cycle_Graph_View.clearHighlights();
}
