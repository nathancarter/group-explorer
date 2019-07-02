/* Global variables */
var group,		// group about which information will be displayed
    multtable,		// data being displayed in large diagram
    graphicContext,	// graphic context for large diagram
    canEmit = true;  // flag: whether to notify parent window of table changes
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
   $('#organization-choices').html(
      $('<li action="organizeBySubgroup(0)">').html(MathML.sans('<mtext>none</mtext>')));
   for (let subgroupIndex = 1; subgroupIndex < group.subgroups.length-1; subgroupIndex++) {
      const subgroup = group.subgroups[subgroupIndex];
      const option =  eval(Template.HTML('organization-choice-template'));
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
   $('#vert-container').resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   });

   VC.showPanel('#subset-control');

   resizeBody();

   window.addEventListener( 'message', function ( event ) {
      if ( event.data.source == 'external' ) {
         canEmit = false; // don't spam notifications of changes about to happen
         graphicContext.fromJSON( event.data.json, multtable );
         graphicContext.showLargeGraphic( multtable );
         if ( event.data.json.hasOwnProperty( 'separation' ) )
            $( '#separation-slider' ).val( event.data.json.separation * 100 );
         if ( event.data.json.hasOwnProperty( '_color_choice' ) )
            $( '#' + event.data.json._color_choice ).prop( 'checked', true );
         if ( event.data.json.hasOwnProperty( '_subgroup_choice' ) )
            $( '#organization-select' ).val( event.data.json._subgroup_choice );
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
   var json = graphicContext.toJSON( multtable );
   json._color_choice = $( 'input[name="coloration"]:checked' ).prop( 'id' );
   json._subgroup_choice = $( '#organization-select' ).val();
   window.postMessage( {
      source : 'editor',
      json : json
   }, myDomain );
}

/* Find subgroup index (the "value" attribute of the option selected) and display multtable accordingly */
function organizationClickHandler(event) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length == 0) {
      $('#organization-choices').hide();
   } else {
      eval($curr.attr('action'));
   }
}

/* Display multtable grouped by group.subgroup[subgroupIndex] */
function organizeBySubgroup(subgroupIndex) {
   if (subgroupIndex == 0) {
      multtable.reset();
   } else {
      multtable.organizeBySubgroup(group.subgroups[subgroupIndex]);
   }
   // copy already-formatted text from menu
   $('#organization-choice').html(
      $(`#organization-choices > li:nth-of-type(${subgroupIndex+1})`).html());
   $('#organization-choices').hide();
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

/* Set separation between cosets in multtable display, and re-draw graphic */
function separation() {
   multtable.setSeparation( $('#separation-slider')[0].valueAsNumber/100 );
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

/* Set coloration option in multtable, and re-draw graphic */
function chooseColoration(coloration) {
   multtable.colors = coloration;
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

function event2columns(event) {
   const bounding_rectangle = $('#graphic')[0].getBoundingClientRect();
   const clickX = event.clientX - bounding_rectangle.x;
   const clickY = event.clientY - bounding_rectangle.y;
   return graphicContext.select(clickX, clickY);
}

function displayLabel(event) {
   event.preventDefault();

   // clear existing tooltip on any click, even if it's not to show a new tooltip
   clearLabels(event);

   // if event has shift key, etc., this click isn't to show a tooltip; just return
   if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return;
   }

   const location = event2columns(event);
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

function clearLabels(event) {
   $('#nodeLabel').remove();
}

// Drag-and-drop in large diagram
class DragState {
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
function dragStart(event) {
   clearLabels(event);
   if (event.shiftKey) {
      Drag_state.position = event2columns(event);
      if (!Drag_state.isShiftDragging) {
         event.preventDefault();
         return;
      }

      // set image to 1-pixel blank
      event.originalEvent.dataTransfer.setDragImage($('#blank')[0], 0, 0);
   } else {
      Drag_state.position = [event.originalEvent.clientX, event.originalEvent.clientY];
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
         event.originalEvent.dataTransfer.setDragImage(image, drag_width/2, drag_height/2);
      }
   }
   // dataTransfer must be set in event for Firefox to fire a dragstart event
   // (this seems to be a well-known bug -- see https://bugzilla.mozilla.org/show_bug.cgi?id=1352852
   //   or https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
   event.originalEvent.dataTransfer.setData('text', 'anything');
}

function dragOver(event) {
   if (Drag_state.isDragging && !event.shiftKey) {
      event.preventDefault();
   } else if (Drag_state.isShiftDragging && event.shiftKey) {
      const location = event2columns(event);
      if (location === undefined) {
         Drag_state.position = undefined;
      } else {
         event.preventDefault();
         // change cursor to indicate whether row/column can be dropped or not
         if (   location.x == 0 && Drag_state.position.x == 0 && location.y != 0
             || location.y == 0 && Drag_state.position.y == 0 && location.x != 0) {
            event.originalEvent.dataTransfer.dropEffect = 'move';
         } else {
            event.originalEvent.dataTransfer.dropEffect = 'none';
         }
      }
   }
}

function drop(event) {
   event.preventDefault();
   if (Drag_state.isDragging && !event.shiftKey) {
      graphicContext.move(event.originalEvent.clientX - Drag_state.position[0],
                          event.originalEvent.clientY - Drag_state.position[1]);
   } else if (Drag_state.isShiftDragging && event.shiftKey) {
      const location = event2columns(event);
      if (location !== undefined) {
         // swap two multtable elements
         const swap = (el1, el2) => {
            const tmp = multtable.elements[el1];
            multtable.elements[el1] = multtable.elements[el2];
            multtable.elements[el2] = tmp;
         }
         if (location.x == 0 && Drag_state.position.x == 0 && location.y != 0) {
            swap(Drag_state.position.y, location.y);
         } else if (location.y == 0 && Drag_state.position.y == 0 && location.x != 0) {
            swap(Drag_state.position.x, location.x);
         }
         emitStateChange();
      }
   }
   Drag_state.position = undefined;
   resizeGraphic();
}

/* Highlighting routines */
function highlightByBackground(elements) {
   multtable.highlightByBackground(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function highlightByBorder(elements) {
   multtable.highlightByBorder(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function highlightByCorner(elements) {
   multtable.highlightByCorner(elements);
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}

function clearHighlights() {
   multtable.clearHighlights();
   emitStateChange();
   graphicContext.showLargeGraphic(multtable);
}
