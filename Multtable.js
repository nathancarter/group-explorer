// @flow

/*::
import DisplayMulttable from './js/DisplayMulttable.js';
import type {MulttableJSON} from './js/DisplayMulttable.js';
import Library from './js/Library.js';
import MathML from './js/MathML.js';
import Menu from './js/Menu.js';
import Multtable from './js/Multtable.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

import VC from './visualizerFramework/visualizer.js';
import SSD from './subsetDisplay/subsets.js';

import type {MSG_listenerReady, MSG_stateLoaded, MSG_external, MSG_editor} from './js/SheetModel.js';
 */

/* Global variables */
var group		/*: XMLGroup */,		// group about which information will be displayed
    multtable		/*: Multtable */,		// data being displayed in large diagram
    graphicContext	/*: DisplayMulttable */,	// graphic context for large diagram
    canEmit		/*: boolean */ = true;		// flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-mt-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
$(window).one('load', load);

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   $(window).off('resize', resizeBody).on('resize', resizeBody);
   $(window).off('click', clearLabels).on('click', clearLabels);
   $(window).off('wheel', clearLabels).on('wheel', clearLabels);
   $(window).off('contextMenu', clearLabels).on('contextMenu', clearLabels);

   // mouse events in large graphic
   $('#graphic > canvas').off('click', displayLabel).on('click', displayLabel);
   $('#graphic > canvas').off('click', displayLabel).on('click', displayLabel);
   $('#graphic > canvas').off('wheel', zoom).on('wheel', zoom);
   $('#graphic > canvas').off('contextmenu', zoom2fit).on('contextmenu', zoom2fit);

   // drag-and-drop in large graphic
   $('#graphic > canvas').attr('draggable', 'true');
   $('#graphic > canvas').off('dragstart', dragStart).on('dragstart', dragStart);
   $('#graphic > canvas').off('drop', drop).on('drop', drop);
   $('#graphic > canvas').off('dragover', dragOver).on('dragover', dragOver);

   $('#subset-button').on('click', () => VC.showPanel('#subset-control') );
   $('#table-button').on('click', () => VC.showPanel('#table-control') );
   $(window).off('click', organizationClickHandler).on('click', organizationClickHandler);
   $('#separation-slider').off('input', separation).on('input', separation);
}

/* Load the static components of the page */
function load() {
   // Promise to load group from invocation URL
   const groupLoad = Library
      .loadFromURL()
      .then( (_group) => group = _group )
      .catch( console.error );

   // Promise to load visualizer framework around visualizer-specific code in this file
   const bodyLoad = VC.load();

   // When group and framework are loaded, insert subset_page and complete rest of setup
   Promise.all([groupLoad, bodyLoad])
          .then( () =>
             // Preload MathML cache for subsetDisplay
             MathML.preload().then( () =>
                // Load subset display, and complete setup
                SSD.load($('#subset-control')).then(completeSetup)
             )
          )
          .catch( console.error );
}

/* Now that subsetDisplay is loaded, complete the setup */
function completeSetup() {
   // Create header from group name
   $('#header').html(MathML.sans('<mtext>Multiplication Table for&nbsp;</mtext>' + group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, $('#header')[0]]);

   // Create list of subgroups for Organize by subgroup menu:
   $('#organization-choices').html('').append(
      $(`<li action="organizeBySubgroup(${group.subgroups.length-1})">`).html(MathML.sans('<mtext>none</mtext>')));
   for (let subgroupIndex = 1; subgroupIndex < group.subgroups.length-1; subgroupIndex++) {
      const subgroup = group.subgroups[subgroupIndex];
      const option /*: html */ =  eval(Template.HTML('organization-choice-template'));
      $('#organization-choices').append(option);
   }
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'organization-choices',
                      () => $('#organization-choice').html($('#organization-choices > li:first-of-type').html())]);

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
         console.error('unknown message received in Multtable.js:');
         console.error(event.data);
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
function organizationClickHandler(event /*: JQueryEventObject */) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length == 0) {
      $('#organization-choices').hide();
   } else {
      eval($curr.attr('action'));
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
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   resizeGraphic();
}

function resizeGraphic() {
   graphicContext.canvas.width = $('#graphic').width();
   graphicContext.canvas.height = $('#graphic').height();
   graphicContext.showLargeGraphic(multtable);
}

/*
 * Large graphic mouse events
 *   Mouse wheel -- zoom in/out
 *   Right click -- zoom to fit
 *   Left click -- display/clear label
 *   Drag-and-drop -- move entire table
 *   Shift drag-and-drop -- move row/column
 */
let Last_display_time = performance.now();
function zoom(event /*: JQueryEventObject */) {
   event.preventDefault();
   (((event.originalEvent /*: any */) /*: WheelEvent */).deltaY < 0) ? graphicContext.zoomIn() : graphicContext.zoomOut();
   if (performance.now() - Last_display_time > 100) {
      resizeGraphic();
      Last_display_time = performance.now();
   }
}

function zoom2fit(event /*: JQueryEventObject */) {
   event.preventDefault();
   graphicContext.reset();
   resizeGraphic();
}

function event2columns(_event /*: JQueryEventObject */) {
   const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
   const event /*: JQueryMouseEventObject */ = (_event /*: any */);
   const clickX = event.clientX - bounding_rectangle.left;
   const clickY = event.clientY - bounding_rectangle.top;
   return graphicContext.select(clickX, clickY);
}

function displayLabel(_event /*: JQueryEventObject */) {
   _event.preventDefault();

   // clear existing tooltip on any click, even if it's not to show a new tooltip
   clearLabels();

   const location = event2columns(_event);

   const event /*: JQueryMouseEventObject */ = (_event /*: any */);

   // if event has shift key, etc., this click isn't to show a tooltip; just return
   if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return;
   }

   if (location !== undefined) {
      // clear label by clicking on same cell again
      if ($(`#nodeLabel[col='${location.x}'][row='${location.y}']`).length != 0) {
         return;
      }
      const product = group.mult(multtable.elements[location.y], multtable.elements[location.x]);
      const $label = $(`<div id="nodeLabel" col="${location.x}" row="${location.y}">`).html(MathML.sans(group.representation[product]));
      $('#graphic').append($label);
      Menu.setMenuLocations(event, $label);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'nodeLabel']);
      event.stopPropagation();
   }
}

function clearLabels() {
   $('#nodeLabel').remove();
}

// Drag-and-drop in large diagram
class DragState {
/*::
  _position : void /* when idle *-/ |
              [number, number] /* when dragging entire image *-/ |
              {x: number, y: number} /* when shift-dragging one column or row *-/;
 */
   constructor() { this._position = undefined; }
   get isIdle() { return typeof(this._position) != 'object'; }
   get isDragging() { return !this.isIdle && Array.isArray(this._position); }
   get isShiftDragging() { return !this.isIdle && !this.isDragging; }
   get position() { return  this._position; }
   set position(position) {
      this._position = undefined;
      if (   typeof(position) == 'object'
          && (   Array.isArray(position)
              || (   (position.x == 0 && position.y != 0)
                  || (position.x != 0 && position.y == 0) ) ) ) {
         this._position = position;
      }
   }
}
const Drag_state = new DragState();
function dragStart(_event /*: JQueryEventObject */) {
   const event /*: JQueryMouseEventObject */ = (_event /*: any */),
         dragEvent /*: DragEvent */ = (event.originalEvent /*: any */),
         dataTransfer /*: DataTransfer */ = (dragEvent.dataTransfer /*: any */);

   clearLabels();

   if (event.shiftKey) {
      Drag_state.position = event2columns(_event);
      if (!Drag_state.isShiftDragging) {
         event.preventDefault();
         return;
      }

      // set image to 1-pixel blank
      dataTransfer.setDragImage($('#blank')[0], 0, 0);
   } else {
      Drag_state.position = [dragEvent.clientX, dragEvent.clientY];
      if (!Drag_state.isDragging) {
         event.preventDefault();
         return;
      }

      // Built-in dnd image drag doesn't work too well on Chrome/Linux
      //   Workaround is to explicitly make img from screen image and drag that
      if (navigator.appVersion.indexOf('Chrome') != -1 && navigator.appVersion.indexOf('Linux') != -1) {
         const canvas = graphicContext.canvas;
         const drag_width = canvas.width/3;
         const drag_height = canvas.height/3;
         // note that top value is negative -- Chrome will still drag it even though it's not visible
         const image = $(`<img id="hidden-image" src="${graphicContext.canvas.toDataURL()}"
                style="position: absolute; top: -${drag_height}; width: ${drag_width};">`)[0];
         $('#graphic').append(image);
         dataTransfer.setDragImage(image, drag_width/2, drag_height/2);
      }
   }
   // dataTransfer must be set in event for Firefox to fire a dragstart event
   // (this seems to be a well-known bug -- see https://bugzilla.mozilla.org/show_bug.cgi?id=1352852
   //   or https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
   dataTransfer.setData('text', 'anything');
}

function dragOver(_event /*: JQueryEventObject */) {
   const event /*: JQueryMouseEventObject */ = (_event /*: any */),
         dragEvent /*: DragEvent */ = (event.originalEvent /*: any */),
         dataTransfer /*: DataTransfer */ = (dragEvent.dataTransfer /*: any */);

   if (Drag_state.isDragging && !event.shiftKey) {
      event.preventDefault();
   } else if (Drag_state.isShiftDragging && event.shiftKey) {
      const location = event2columns(_event);
      if (location === undefined) {
         Drag_state.position = undefined;
      } else {
         event.preventDefault();
         // change cursor to indicate whether row/column can be dropped or not
         const position /*: {x: number, y: number} */ = (Drag_state.position /*: any */);
         if (   location.x == 0 && position.x == 0 && location.y != 0
             || location.y == 0 && position.y == 0 && location.x != 0) {
            dataTransfer.dropEffect = 'move';
         } else {
            dataTransfer.dropEffect = 'none';
         }
      }
   }
}

function drop(_event /*: JQueryEventObject */) {
   const event /*: JQueryMouseEventObject */ = (_event /*: any */),
         dragEvent /*: DragEvent */ = (event.originalEvent /*: any */),
         dataTransfer /*: DataTransfer */ = (dragEvent.dataTransfer /*: any */);

   event.preventDefault();
   if (Drag_state.isDragging && !event.shiftKey) {
      const position /*: [number, number] */ = (Drag_state.position /*: any */);
      graphicContext.move(dragEvent.clientX - position[0],
                          dragEvent.clientY - position[1]);
   } else if (Drag_state.isShiftDragging && event.shiftKey) {
      const location = event2columns(_event);
      if (location !== undefined) {
         // swap two multtable elements
         const swap = (el1, el2) => {
            const tmp = multtable.elements[el1];
            multtable.elements[el1] = multtable.elements[el2];
            multtable.elements[el2] = tmp;
         }
         const position /*: {x: number, y: number} */ = (Drag_state.position /*: any */);
         if (location.x == 0 && position.x == 0 && location.y != 0) {
            swap(position.y, location.y);
         } else if (location.y == 0 && position.y == 0 && location.x != 0) {
            swap(position.x, location.x);
         }
         emitStateChange();
      }
   }
   Drag_state.position = undefined;
   resizeGraphic();
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
