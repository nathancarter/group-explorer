// @flow

/*::
import CycleGraph from './js/CycleGraph.js';
import DisplayCycleGraph from './js/DisplayCycleGraph.js';
import type {CycleGraphJSON} from './js/DisplayCycleGraph.js';
import Library from './js/Library.js';
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
$(window).on('load', load);

// Static event managers (called after document is assembled)
function registerCallbacks() {
   $(window).off('resize', resizeBody).on('resize', resizeBody);
   $(window).off('click', clearLabels).on('click', clearLabels);
   $(window).off('wheel', clearLabels).on('wheel', clearLabels);
   $(window).off('contextMenu', clearLabels).on('contextMenu', clearLabels);

   // mouse events in large graphic
   $('#graphic > canvas').off('click', displayLabel).on('click', displayLabel);
   $('#graphic > canvas').off('wheel', zoom).on('wheel', zoom);
   $('#graphic > canvas').off('contextmenu', zoom2fit).on('contextmenu', zoom2fit);

   // drag-and-drop in large graphic
   $('#graphic > canvas').attr('draggable', 'true');
   $('#graphic > canvas').off('dragstart', dragstart).on('dragstart', dragstart);
   $('#graphic > canvas').off('drop', drop).on('drop', drop);
   $('#graphic > canvas').off('dragover', dragover).on('dragover', dragover);
}

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
         console.error('unknown message received in CycleDiagram.js:');
         console.error(event.data);
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
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   resizeGraphic();
};

function resizeGraphic() {
   graphicContext.canvas.width = $('#graphic').width();
   graphicContext.canvas.height = $('#graphic').height();
   graphicContext.showLargeGraphic(cyclegraph);
}


/*
 * Large graphic mouse events
 *   Mouse wheel -- zoom in/out
 *   Right click -- zoom to fit
 *   Left click -- display label
 *   Drag-and-drop -- move cycle graph
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

function displayLabel(_event /*: JQueryEventObject */) {
   const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
   const event = ((_event /*: any */) /*: JQueryMouseEventObject */);
   event.preventDefault();
   clearLabels(_event);
   const clickX = event.clientX - bounding_rectangle.left;
   const clickY = event.clientY - bounding_rectangle.top;
   const element = graphicContext.select(clickX, clickY);
   if (element !== undefined) {
      const $label = $('<div id="nodeLabel">').html(MathML.sans(group.representation[element]));
      $('#graphic').append($label);
      Menu.setMenuLocations(event, $label);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'nodeLabel']);
      event.stopPropagation();
   }
}

function clearLabels(event /*: JQueryEventObject */) {
   $('#nodeLabel').remove();
}

// Start drag-and-drop CycleGraph in large diagram
let Drag_start = undefined;
function dragstart(_event /*: JQueryEventObject */) {
   const event = ((_event /*: any */) /*: JQueryMouseEventObject */),
         dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */),
         dataTransfer = ((dragEvent.dataTransfer /*: any */) /*: DataTransfer */);

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
   dataTransfer.setData('text/plain', 'anything');  // needed for Firefox (!?)
   Drag_start = [dragEvent.clientX, dragEvent.clientY];
}

function drop(_event /*: JQueryEventObject */) {
   const event = ((_event /*: any */) /*: JQueryMouseEventObject */),
         dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);

   event.preventDefault();
   if (Drag_start !== undefined) {
      graphicContext.move(dragEvent.clientX - Drag_start[0],
                          dragEvent.clientY - Drag_start[1] );
      Drag_start = undefined;
   }
   $('#hidden-image').remove();
   resizeGraphic();
}

function dragover(event /*: JQueryEventObject */) {
   event.preventDefault();
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
