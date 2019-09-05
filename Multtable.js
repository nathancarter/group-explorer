// @flow

/*::
import DisplayMulttable from './js/DisplayMulttable.js';
import type {MulttableJSON} from './js/DisplayMulttable.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import Multtable from './js/Multtable.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import VC from './visualizerFramework/visualizer.js';
import SSD from './subsetDisplay/subsets.js';

import type {MSG_listenerReady, MSG_stateLoaded, MSG_external, MSG_editor} from './js/SheetModel.js';

declare type rowXcol = {row: number, col: number};
 */

/* Global variables */
var group		/*: XMLGroup */,		// group about which information will be displayed
    multtable		/*: Multtable */,		// data being displayed in large diagram
    graphicContext	/*: DisplayMulttable */,	// graphic context for large diagram
    canEmit		/*: boolean */ = true;		// flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-mt-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
window.addEventListener('load', load, {once: true});

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   // window-wide default actions
   window.addEventListener('resize', resizeBody);
   $('#bodyDouble')[0].addEventListener('click', cleanWindow);
   window.addEventListener('contextmenu', (mouseEvent /*: MouseEvent */) => {
      cleanWindow();
      mouseEvent.preventDefault();
   });

   // Large graphic events
   LargeGraphic.init();

   // Control panel events
   $('#subset-button')[0].addEventListener('click', () => VC.showPanel('#subset-control') );
   $('#table-button')[0].addEventListener('click', () => VC.showPanel('#table-control') );
   $('#organization-select')[0].addEventListener('click', organizationClickHandler);
   $('#separation-slider')[0].addEventListener('input', separation);
}

/* Load the static components of the page */
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
   // Create header from group name
   $('#header').html(MathML.sans('<mtext>Multiplication Table for&nbsp;</mtext>' + group.name));

   // Create list of subgroups for Organize by subgroup menu:
   $('#organization-choices').html('').append(
      $(`<li action="organizeBySubgroup(${group.subgroups.length-1})">`).html(MathML.sansText('none')));
   for (let subgroupIndex = 1; subgroupIndex < group.subgroups.length-1; subgroupIndex++) {
      const subgroup = group.subgroups[subgroupIndex];
      const option /*: html */ =  eval(Template.HTML('organization-choice-template'));
      $('#organization-choices').append(option);
   }
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'organization-choices'],
                     () => {
                        $('#organization-choice').html($('#organization-choices > li:first-of-type').html());
                        $('#organization-choices').hide();
                     });

   // Draw Multtable in graphic
   multtable = new Multtable(group);
   graphicContext = new DisplayMulttable({container: $('#graphic')});

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

   VC.showPanel('#subset-control');

   resizeBody();

   window.addEventListener( 'message', function ( event /*: MessageEvent */ ) {
      const event_data /*: MSG_external<MulttableJSON> */ = (event.data /*: any */);
      if (typeof event_data == 'undefined' || event_data.source != 'external') {
         Log.warn('unknown message received in Multtable.js:');
         Log.warn(event.data);
         return;
      }
      canEmit = false; // don't spam notifications of changes about to happen
      graphicContext.fromJSON( event_data.json, multtable );
      graphicContext.showLargeGraphic( multtable );
      if ( event_data.json.separation != undefined )
         $( '#separation-slider' ).val( event_data.json.separation * 100 );
      if ( event_data.json.coloration != undefined )
         $( '#' + event_data.json.coloration.toString() ).prop( 'checked', true );
      if ( event_data.json.organizingSubgroup != undefined )
         $( '#organization-select' ).val( event_data.json.organizingSubgroup );
      canEmit = true; // restore default behavior
      const msg /*: MSG_stateLoaded */ = 'state loaded';
      window.postMessage( msg, myDomain )
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
      const msg /*: MSG_editor<MulttableJSON> */ = {
         source : 'editor',
         json : graphicContext.toJSON( multtable )
      };
      window.postMessage( msg, myDomain );
   }
}

/* Find subgroup index (the "value" attribute of the option selected) and display multtable accordingly */
function organizationClickHandler(event /*: MouseEvent */) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length == 0) {
      $('#organization-choices').hide();
   } else {
      eval($curr.attr('action'));
      event.stopPropagation();
   }
}

function toggleOrganizationChoices() {
   const hidingChoices = $('#organization-choices').css('display') == 'none';
   cleanWindow();
   if (hidingChoices) {
      $('#organization-choices').show();
   }
}

/* Display multtable grouped by group.subgroups[subgroupIndex]
 *   (Note that the group itself is group.subgroups[group.subgroups.length - 1] */
function organizeBySubgroup(subgroupIndex /*: number */) {
   multtable.organizeBySubgroup(subgroupIndex);

   // copy already-formatted text from menu
   $('#organization-choice').html(
      $(`#organization-choices > li:nth-of-type(${(subgroupIndex == group.subgroups.length - 1) ? 1 : subgroupIndex+1})`).html());
   $('#organization-choices').hide();
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

/* Set separation between cosets in multtable display, and re-draw graphic */
function separation() {
//   multtable.setSeparation( (($('#separation-slider')[0] /*: any */) /*: HTMLInputElement */).valueAsNumber/100 );
   multtable.setSeparation( parseInt($('#separation-slider').val())/100 );
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

/* Set coloration option in multtable, and re-draw graphic */
function chooseColoration(coloration /*: 'Rainbow' | 'Grayscale' | 'None' */) {
   multtable.coloration = coloration;
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

// Resize the body, including the graphic
function resizeBody() {
   $('#bodyDouble').height(window.innerHeight);
   $('#bodyDouble').width(window.innerWidth);

   resizeGraphic();
}

function resizeGraphic() {
   graphicContext.canvas.width = $('#graphic').width();
   graphicContext.canvas.height = $('#graphic').height();
   graphicContext.showLargeGraphic(multtable);
}

function cleanWindow() {
   $('#nodeLabel').remove();
   $('#drag-image').remove();
   $('#organization-choices').hide();
   SSD.clearMenus();
}

/* Highlighting routines */
function highlightByBackground(elements /*: Array<Array<groupElement>> */) {
   multtable.highlightByBackground(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function highlightByBorder(elements /*: Array<Array<groupElement>> */) {
   multtable.highlightByBorder(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function highlightByCorner(elements /*: Array<Array<groupElement>> */) {
   multtable.highlightByCorner(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function clearHighlights() {
   multtable.clearHighlights();
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
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
            cleanWindow();
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
         graphicContext.showLargeGraphic(multtable);
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
      return graphicContext.xy2rowXcol(canvasX, canvasY);
   }

   static displayNewLabel(loc /*: eventLocation */) /*: ?HTMLElement */ {
      const rowXcol = LargeGraphic.loc2rowXcol(loc);
      const hasLabel = rowXcol && $(`#nodeLabel[row='${rowXcol.row}'][col='${rowXcol.col}']`).length != 0;
      cleanWindow();
      if (rowXcol == undefined || hasLabel) {
         return null;
      } else {
         const element = group.mult(multtable.elements[rowXcol.row], multtable.elements[rowXcol.col]);
         const $label = $(`<div id="nodeLabel" row="${rowXcol.row}" col="${rowXcol.col}">`)
                           .html(MathML.sans(group.representation[element]));
         $('#graphic').append($label);
         Menu.setMenuLocations(loc, $label);
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'nodeLabel']);
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
      cleanWindow();
      const [startCentroid, startDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(start)),
            [endCentroid, endDiameter] = LargeGraphic.centroidAndDiameter(LargeGraphic.touches(end)),
            zoomFactor = endDiameter / startDiameter;
      graphicContext
         .zoom(endDiameter / startDiameter)
         .move(endCentroid.clientX - startCentroid.clientX, endCentroid.clientY - startCentroid.clientY);
      graphicContext.showLargeGraphic(multtable);
   }

   static mouseMove(start /*: MouseEvent */, end /*: MouseEvent */) {
      cleanWindow();
      graphicContext.move(end.clientX - start.clientX, end.clientY - start.clientY);
      graphicContext.showLargeGraphic(multtable);
   }

   static zoom2fit() {
      cleanWindow();
      graphicContext.reset();
      graphicContext.showLargeGraphic(multtable);
   }

   static dragStart(loc /*: eventLocation */) /*: ?HTMLElement */ {
      const rowXcol = LargeGraphic.loc2rowXcol(loc);  // row, column of event location

      if (rowXcol == undefined) {
         return null;
      }

      cleanWindow();
      
      const canvas = graphicContext.canvas;

      // find width of a single cell, and width of the entire table
      // make these the width and height of the img, bounded by canvas size
      const cellSize = graphicContext.transform.elements[0];  // [0] is the scale in the transform matrix
      const tableSize = multtable.size * cellSize;

      let width, height, swapping, start;
      if (rowXcol.row == 0 && rowXcol.col != 0) {  // dragging column?
         [swapping, start, width, height] = ['col', rowXcol.col, cellSize, tableSize];
      } else if (rowXcol.col == 0 && rowXcol.row != 0) {  // dragging row?
         [swapping, start, width, height] = ['row', rowXcol.row, tableSize, cellSize];
      } else {
         return null;
      }
      
      // upper left corner of clicked cell in canvas-relative coordinates
      const position = new THREE.Vector3(rowXcol.col, rowXcol.row, 1).applyMatrix3(graphicContext.transform);

      const style =
            'position: absolute; ' +
            `width: ${width}; height: ${height}; ` +
            'object-fit: none; ' +
            `object-position: -${position.x.toFixed(0)}px -${position.y.toFixed(0)}px; ` +
            'opacity: 0.75; ' +
            '';

      const image = $(`<img id="drag-image" src="${graphicContext.canvas.toDataURL()}" swapping="${swapping}" start="${start}" style="${style}">`)[0];
      $('#graphic').append(image);
      LargeGraphic.dragOver(loc);

      return image;
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
         multtable.swap(start, rowXcol.row);
      } else {
         multtable.swap(start, rowXcol.col);
      }

      graphicContext.showLargeGraphic(multtable);
      emitStateChange();

      return cleanup();
   }
}
