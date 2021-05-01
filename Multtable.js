// @flow

import GEUtils from './js/GEUtils.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import Menu from './js/Menu.js';
import {MulttableView, createFullMulttableView} from './js/MulttableView.js';
import {LISTENER_READY_MESSAGE, STATE_LOADED_MESSAGE} from './js/SheetModel.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import * as SSD from './js/SubsetHighlightController.js';

import * as VC from './visualizerFramework/visualizer.js';
export {broadcastChange} from './visualizerFramework/visualizer.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from './lib/externals.js';

export {load};

/*::
import type {MulttableJSON} from './js/MulttableView.js';
import type {MSG_external, MSG_editor} from './js/SheetModel.js';

declare type rowXcol = {row: number, col: number};
*/

/* Module variables */
let Group		/*: XMLGroup */;		// group about which information will be displayed
let Multtable_View	/*: MulttableView */;

const HELP_PAGE = 'help/rf-um-mt-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   // window-wide default actions
   window.onresize = resizeBody;
   $('#bodyDouble')[0].addEventListener('click', GEUtils.cleanWindow);
   window.addEventListener('contextmenu', (mouseEvent /*: MouseEvent */) => {
      GEUtils.cleanWindow();
      mouseEvent.preventDefault();
   });
   $('#rainbow')[0].addEventListener('click', () => chooseColoration('rainbow'));
   $('#grayscale')[0].addEventListener('click', () => chooseColoration('grayscale'));
   $('#none')[0].addEventListener('click', () => chooseColoration('none'));

   // Large graphic events
   LargeGraphic.init();

   // Control panel events
   $('#subset-button')[0].addEventListener('click', () => VC.showPanel('#subset-control') );
   $('#table-button')[0].addEventListener('click', () => VC.showPanel('#table-control') );
   $('#organization-select')[0].addEventListener('click', organizationClickHandler);
   $('#separation-slider')[0].addEventListener('input', separation);
}

// Load group from invocation URL and complete setup
async function load() {
   Group = await Library.loadFromURL()

   const highlighters = [
      {handler: highlightByBackground, label: 'Background'},
      {handler: highlightByBorder, label: 'Border'},
      {handler: highlightByCorner, label: 'Corner'}
   ];

   await SSD.load($('#subset-control'), highlighters, clearHighlights, Group)

   // Create header from group name
   $('#heading').html(`Multiplication Table for ${Group.name}`)

   // Draw Multtable in graphic
   Multtable_View = createFullMulttableView({container: $('#graphic')});
   Multtable_View.group = Group;

   // Create list of subgroups for organize-by-subgroup menu:
   $('#organization-choices').append( 
      [...Array(Group.subgroups.length - 1).keys()].reduce( ($frag, index) => {
         if (index == 0) {
            $frag.append(eval(Template.HTML('organization-choice-none-template')));
         } else {
            const subgroupIndex = index;
            const subgroup = Group.subgroups[subgroupIndex];
            $frag.append(eval(Template.HTML('organization-choice-template')));
         }
         return $frag;
      }, $(document.createDocumentFragment()) ))
      .css('visibility', 'hidden');
   organizeBySubgroup(0);

   // Register event handlers
   registerCallbacks();

   // Register the splitter with jquery-resizable, so you can resize the graphic horizontally
   // by grabbing the border between the graphic and the subset control and dragging it
   (($('#controls') /*: any */) /*: JQuery & {resizable: Function} */).resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: () => Multtable_View.resize(),
   });

   // Is this an editor started by a Sheet? If so, set up communication with Sheet
   if (window.isEditor) {
      setupEditorCallback();
   }

   // Load icon strip in upper right-hand corner
   VC.load(Group, HELP_PAGE);
}

function setupEditorCallback () {
   // this only happens once, right after initialization
   window.addEventListener('message', receiveInitialSetup, false);

   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( LISTENER_READY_MESSAGE, myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( LISTENER_READY_MESSAGE, '*' );
}

function receiveInitialSetup (event /*: MessageEvent */) {
   if (event.data == undefined)
      return;

   const event_data /*: MSG_external<MulttableJSON> */ = (event.data /*: any */);
   if (event_data.source == 'external') {
      const json_data = event_data.json;
      if (json_data.separation != undefined)
         $('#separation-slider').val(json_data.separation * 100);
      if (json_data.coloration != undefined)
         $('#' + json_data.coloration.toString()).prop('checked', true);
      if (json_data.organizingSubgroup != undefined)
          organizeBySubgroup(json_data.organizingSubgroup);
      Multtable_View.fromJSON(json_data);
      VC.enableChangeBroadcast(() => Multtable_View.toJSON());
      window.postMessage( STATE_LOADED_MESSAGE, myDomain )
   } else if (   event_data.source == 'editor'
              || ((event.data /*: any */) /*: string */) == LISTENER_READY_MESSAGE
              || ((event.data /*: any */) /*: string */) == STATE_LOADED_MESSAGE)
   {
      // we're just receiving our own messages -- ignore them
   } else {
      Log.warn('unknown message of origin $[event.orgin} received in Multtable.js:');
      Log.warn(event.data);
   }
}

/* Find subgroup index (the "value" attribute of the option selected) and display multtable accordingly */
function organizationClickHandler(event /*: MouseEvent */) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length != 0) {
      eval($curr.attr('action'));
      event.stopPropagation();
   }
}

function toggleOrganizationChoices() {
   const choices = $('#organization-choices');
   const new_visibility = choices.css('visibility') == 'visible' ? 'hidden' : 'visible';
   choices.css('visibility', new_visibility);
}

/* Display multtable grouped by group.subgroups[subgroupIndex]
 *   (Note that the group itself is Group.subgroups[Group.subgroups.length - 1] */
function organizeBySubgroup (index /*: integer */) {
   Multtable_View.organizeBySubgroup(index == 0 ? Group.subgroups.length - 1 : index);

   // copy already-formatted text from menu
   $('#organization-choice').html($(`#organization-choices > li:nth-of-type(${index+1})`).html());
   $('#organization-choices').css('visibility', 'hidden');
}

/* Set separation between cosets in multtable display, and re-draw graphic */
function separation() {
   Multtable_View.separation = parseInt($('#separation-slider').val())/100;
}

/* Set coloration option in multtable, and re-draw graphic */
function chooseColoration(coloration /*: 'rainbow' | 'grayscale' | 'none' */) {
   Multtable_View.coloration = coloration;
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

   Multtable_View.resize();
}

/* Highlighting routines */
function highlightByBackground(elements /*: Array<Array<groupElement>> */) {
   Multtable_View.highlightByBackground(elements);
}

function highlightByBorder(elements /*: Array<Array<groupElement>> */) {
   Multtable_View.highlightByBorder(elements);
}

function highlightByCorner(elements /*: Array<Array<groupElement>> */) {
   Multtable_View.highlightByCorner(elements);
}

function clearHighlights() {
   Multtable_View.clearHighlights();
}

/*
 * Large graphic mouse events
 *   display/clear label -- click / tap
 *   zoom in/out -- wheel / two-finger pinch-spread
 *   move graph -- drag-and-drop / two-finger drag
 *   recenter, reset zoom -- right click / two-finger tap
 *   move row/column -- Shift drag-and-drop / one-finger drag
 */
class LargeGraphic {
/*::
  static lastEvent: ?Event;
 */
   static init() {
      LargeGraphic.lastEvent = null;

      const graphic = $('#graphic')[0];
      if (window.ontouchstart === undefined) {  // determine whether device supports touch events
         ['click', 'wheel', 'contextmenu', 'mousedown', 'mousemove', 'mouseup']
            .forEach( (eventType) => graphic.addEventListener(eventType, LargeGraphic.mouseHandler) );
      } else {
         ['touchstart', 'touchmove', 'touchend']
            .forEach( (eventType) => graphic.addEventListener(eventType, LargeGraphic.touchHandler) );
      }
   }

   // Event handler for mouse-only platform
   static mouseHandler(mouseEvent /*: MouseEvent */) {
      // skip modified events, except for mouseXXX with shiftKey down
      if (   mouseEvent.ctrlKey || mouseEvent.altKey || mouseEvent.metaKey
          || (mouseEvent.shiftKey && !mouseEvent.type.startsWith('mouse')) ) {
         return;
      };

      const lastEvent /*: MouseEvent */ = (LargeGraphic.lastEvent /*: any */);

      // create artificial event type like 'shift-mousedown' to branch on
      const syntheticType = (mouseEvent.shiftKey ? 'shift-' : '') + mouseEvent.type;

      switch (syntheticType) {
      case 'click':
         if (LargeGraphic.lastEvent == null) {
            LargeGraphic.displayNewLabel(mouseEvent);
         } else {
            GEUtils.cleanWindow();
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
         (deltaY < 0) ? Multtable_View.zoomIn(deltaY) : Multtable_View.zoomOut(deltaY);
         break;

      case 'mousedown':
         LargeGraphic.lastEvent = mouseEvent;
         break;

      case 'shift-mousedown':
         if (LargeGraphic.dragStart(mouseEvent)) {
            LargeGraphic.lastEvent = mouseEvent;
         } else {
            LargeGraphic.lastEvent = null;
         }
         break;

      case 'mousemove':
         if (lastEvent != undefined && !lastEvent.shiftKey) {
            LargeGraphic.mouseMove(lastEvent, mouseEvent);
            LargeGraphic.lastEvent = mouseEvent;
         } else {
            LargeGraphic.lastEvent = null;
         }
         mouseEvent.preventDefault();
         break;

      case 'shift-mousemove':
         if (lastEvent != undefined && lastEvent.shiftKey) {
            LargeGraphic.dragOver(mouseEvent);
            LargeGraphic.lastEvent = mouseEvent;
         } else {
            LargeGraphic.lastEvent = null;
         }
         mouseEvent.preventDefault();
         break;

      case 'mouseup':
         if (lastEvent != undefined && !lastEvent.shiftKey && lastEvent.type == 'mousemove') {
            LargeGraphic.mouseMove(lastEvent, mouseEvent); // leave last event there so ensuing 'click' event won't display tooltip
            LargeGraphic.lastEvent = mouseEvent;
         } else {
            LargeGraphic.lastEvent = null;
         }
         mouseEvent.stopPropagation();
         mouseEvent.preventDefault();
         break;

      case 'shift-mouseup':
         if (lastEvent != undefined && lastEvent.shiftKey && lastEvent.type == 'mousemove') {
               LargeGraphic.dragEnd(mouseEvent);
         }
         LargeGraphic.lastEvent = null;
         mouseEvent.stopPropagation();
         mouseEvent.preventDefault();
         break;

      default:
         Log.warn('LargeGraphic.mouseHandler unknown event %s', syntheticType);
      }
   }

   // Event handler for platforms that support touch events
   static touchHandler(touchEvent /*: TouchEvent */) {
      // skip modified events
      if (touchEvent.shiftKey || touchEvent.ctrlKey || touchEvent.altKey || touchEvent.metaKey) {
         return;
      };

      const touches = LargeGraphic.touches(touchEvent);
      const touchCount = touches.length;

      // only accept one- and two-finger touches
      if (!(touchCount == 1 || touchCount == 2)) {
         return;
      }

      const lastEvent /*: TouchEvent */ = (LargeGraphic.lastEvent /*: any */);

      // start over -- somehow switched from one-touch to two-touch dnd in midstream
      if (lastEvent != null && touchEvent.type != 'touchstart' && LargeGraphic.touches(lastEvent).length != touchCount) {
         return;
      }

      const syntheticType = touchEvent.type + ((touchCount == 2) ? '_2' : '');
      switch (syntheticType) {
      case 'touchstart':
      case 'touchstart_2':
         LargeGraphic.lastEvent = touchEvent;
         break;

      case 'touchmove':
         if (lastEvent != undefined) {
            if (lastEvent.type == 'touchstart' && touchEvent.timeStamp - lastEvent.timeStamp < 350) {
               // too soon to tell if this is a click or a drag -- don't do anything, wait for next event
            } else {
               if (lastEvent.type == 'touchstart') {
                  LargeGraphic.dragStart(touches[0]);
               } else {
                  LargeGraphic.dragOver(touches[0]);
               }
               LargeGraphic.lastEvent = touchEvent;
            }
         }
         touchEvent.preventDefault();
         break;

      case 'touchmove_2':
         if (lastEvent != undefined) {
            LargeGraphic.touchZoomAndMove(lastEvent, touchEvent);
            LargeGraphic.lastEvent = touchEvent;
            touchEvent.preventDefault();
         }            
         break;

      case 'touchend':
         if (lastEvent != undefined) {
            if (lastEvent.type == 'touchstart' && touchEvent.timeStamp - lastEvent.timeStamp < 350) {
               if (LargeGraphic.displayNewLabel(touches[0])) {
                  touchEvent.preventDefault();  // prevent this from turning into a click event and clearing all labels
               }
            } else {
               LargeGraphic.dragEnd(touches[0]);
            }
         }
         LargeGraphic.lastEvent = null;
         break;

      case 'touchend_2':
         if (lastEvent != undefined) {
            if (lastEvent.type == 'touchstart' && touchEvent.timeStamp - lastEvent.timeStamp < 350) {
               LargeGraphic.zoom2fit();               
            } else {
               LargeGraphic.touchZoomAndMove(lastEvent, touchEvent);
            }
         }
         LargeGraphic.lastEvent = null; 
         touchEvent.stopPropagation();
         touchEvent.preventDefault();
         break;

      default:
         Log.warn('LargeGraphic.touchHandler unknown event %s', syntheticType);
      }
   }

   static loc2rowXcol(event /*: eventLocation */) /*: ?rowXcol */ {
      const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
      const canvasX = event.clientX - bounding_rectangle.left;
      const canvasY = event.clientY - bounding_rectangle.top;
      return Multtable_View.xy2rowXcol(canvasX, canvasY);
   }

   static displayNewLabel(loc /*: eventLocation */) /*: ?HTMLElement */ {
      const rowXcol = LargeGraphic.loc2rowXcol(loc);
      const hasLabel = rowXcol && $(`#node-label[row='${rowXcol.row}'][col='${rowXcol.col}']`).length != 0;
      GEUtils.cleanWindow();
      if (rowXcol == undefined || hasLabel) {
         return null;
      } else {
         const element = Group.mult(Multtable_View.elements[rowXcol.row], Multtable_View.elements[rowXcol.col]);
         const $label = $(eval(Template.HTML('node-label-template')))
                          .appendTo('#graphic');
         Menu.setMenuLocation($label, loc);
         return $label[0];
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
      Multtable_View
         .zoom(endDiameter / startDiameter)
         .move(endCentroid.clientX - startCentroid.clientX, endCentroid.clientY - startCentroid.clientY);
   }

   static mouseMove(start /*: MouseEvent */, end /*: MouseEvent */) {
      GEUtils.cleanWindow();
      Multtable_View.move(end.clientX - start.clientX, end.clientY - start.clientY);
   }

   static zoom2fit() {
      GEUtils.cleanWindow();
      Multtable_View.resetZoom();
   }

   static dragStart(loc /*: eventLocation */) /*: ?HTMLElement */ {
      const rowXcol = LargeGraphic.loc2rowXcol(loc);  // row, column of event location

      if (rowXcol == undefined) {
         return null;
      }

      GEUtils.cleanWindow();
      
      const canvas = Multtable_View.canvas;

      // find width of a single cell, and width of the entire table
      // make these the width and height of the img, bounded by canvas size
      const cellSize = Multtable_View.transform.elements[0];  // [0] is the scale in the transform matrix
      const tableSize = Multtable_View.table_size * cellSize;

      let width, height, swapping, start;
      if (rowXcol.row == 0 && rowXcol.col != 0) {  // dragging column?
         [swapping, start, width, height] = ['col', rowXcol.col, cellSize, tableSize];
      } else if (rowXcol.col == 0 && rowXcol.row != 0) {  // dragging row?
         [swapping, start, width, height] = ['row', rowXcol.row, tableSize, cellSize];
      } else {
         return null;
      }
      
      // upper left corner of clicked cell in canvas-relative coordinates
      const position = new THREE.Vector3(rowXcol.col, rowXcol.row, 1).applyMatrix3(Multtable_View.transform);

      const style =
            'position: absolute; ' +
            `width: ${width}; height: ${height}; ` +
            'object-fit: none; ' +
            `object-position: -${position.x.toFixed(0)}px -${position.y.toFixed(0)}px; ` +
            'opacity: 0.75; ' +
            '';

      const $image = $(eval(Template.HTML('drag-image-template')))
                       .appendTo('#graphic');
      LargeGraphic.dragOver(loc);

      return $image[0];
   }

   static dragOver(loc /*: eventLocation */) {
      const rowXcol = LargeGraphic.loc2rowXcol(loc);

      // must be on first row / column to display drag image
      const swapping = $('#drag-image').attr('swapping');
      if (   rowXcol != undefined
          && (   (swapping == 'row' && rowXcol.col == 0 && rowXcol.row != 0)
              || (swapping == 'col' && rowXcol.row == 0 && rowXcol.col != 0) ) ) {
         $('#drag-image').show()
                         .css('top', `${loc.clientY}`)
                         .css('left', `${loc.clientX}`);
      } else {
         $('#drag-image').hide();
      }
   }

   static dragEnd(loc /*: eventLocation */) {
      const cleanup = () => ($('#drag-image').remove(), undefined);
      
      /* don't swap if
       *   there's no drag image
       *   loc isn't over the table
       *   loc isn't in the 1st row / column
       *   loc is in the original row / column (so there's no swap to be done)
       */
      const $dragImage = $('#drag-image');
      if ($dragImage.length == 0)
         return cleanup();

      const rowXcol = LargeGraphic.loc2rowXcol(loc);
      if (rowXcol == undefined)
         return cleanup();

      const swapping = $dragImage.attr('swapping');
      const start = parseInt($dragImage.attr('start'));
      $dragImage.remove();
      if (   (swapping == 'row' && (rowXcol.col != 0 || rowXcol.row == 0 || rowXcol.row == start))
          || (swapping == 'col' && (rowXcol.row != 0 || rowXcol.col == 0 || rowXcol.col == start)) )
         return cleanup();

      if (swapping == 'row') {
         Multtable_View.swap(start, rowXcol.row);
      } else {
         Multtable_View.swap(start, rowXcol.col);
      }

      return cleanup();
   }
}
