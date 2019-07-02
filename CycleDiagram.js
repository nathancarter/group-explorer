// global variables
var group,		// group about which information will be displayed
    cyclegraph,    // data being displayed in large diagram
    graphicContext,	// graphic context for large diagram
    canEmit = true;  // flag: whether to notify parent window of table changes
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
   $('#vert-container').resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   });

   resizeBody();

   window.addEventListener( 'message', function ( event ) {
      if ( event.data.source == 'external' ) {
         canEmit = false; // don't spam notifications of changes about to happen
         graphicContext.fromJSON( event.data.json, cyclegraph );
         graphicContext.showLargeGraphic( cyclegraph );
         canEmit = true; // restore default behavior
         window.postMessage( 'state loaded', myDomain );
      }
   }, false );
   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( 'listener ready', myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( 'listener ready', '*' );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( group.URL ) $( '#find-group' ).hide();
}

function emitStateChange () {
   if ( !canEmit ) return;
   var json = graphicContext.toJSON( cyclegraph );
   window.postMessage( {
      source : 'editor',
      json : json
   }, myDomain );
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
function zoom(event) {
   event.preventDefault();
   (event.originalEvent.deltaY < 0) ? graphicContext.zoomIn() : graphicContext.zoomOut();
   if (performance.now() - Last_display_time > 100) {
      resizeGraphic();
      Last_display_time = performance.now();
   }
}

function zoom2fit(event) {
   event.preventDefault();
   graphicContext.reset();
   resizeGraphic();
}

function displayLabel(event) {
   event.preventDefault();
   clearLabels(event);
   const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
   const clickX = event.clientX - bounding_rectangle.x;
   const clickY = event.clientY - bounding_rectangle.y;
   const element = graphicContext.select(clickX, clickY);
   if (element !== undefined) {
      const $label = $('<div id="nodeLabel">').html(MathML.sans(group.representation[element]));
      $('#graphic').append($label);
      Menu.setMenuLocations(event, $label);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'nodeLabel']);
      event.stopPropagation();
   }
}

function clearLabels(event) {
   $('#nodeLabel').remove();
}

// Start drag-and-drop CycleGraph in large diagram
let Drag_start = undefined;
function dragstart(event) {
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
      event.originalEvent.dataTransfer.setDragImage(image, drag_width/2, drag_height/2);
   }
   event.originalEvent.dataTransfer.setData('text/plain', 'anything');  // needed for Firefox (!?)
   Drag_start = [event.originalEvent.clientX, event.originalEvent.clientY];
}

function drop(event) {
   event.preventDefault();
   if (Drag_start !== undefined) {
      graphicContext.move(event.originalEvent.clientX - Drag_start[0],
                          event.originalEvent.clientY - Drag_start[1] );
      Drag_start = undefined;
   }
   $('#hidden-image').remove();
   resizeGraphic();
}

function dragover(event) {
   event.preventDefault();
}


/* Highlighting routines */
function highlightByBackground(elements) {
   cyclegraph.highlightByBackground(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function highlightByBorder(elements) {
   cyclegraph.highlightByBorder(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function highlightByTop(elements) {
   cyclegraph.highlightByTop(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}

function clearHighlights() {
   cyclegraph.clearHighlights();
   emitStateChange();
   graphicContext.showLargeGraphic(cyclegraph);
}
