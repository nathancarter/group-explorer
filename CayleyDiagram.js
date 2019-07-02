/* Global variables */
var group,		// group about which information will be displayed
    Diagram_name,	// name of Cayley diagram, or undefined if generated
    Cayley_diagram,	// data being displayed in large diagram
    Graphic_context,	// graphic context for large diagram
    canEmit = true;  // flag: whether to notify parent window of table changes
const HELP_PAGE = 'help/rf-um-cd-options/index.html';

const myDomain = new URL(window.location.href).origin;

/* Initial entry to javascript, called once after document load */
$(window).one('load', load);

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   $('#subset-button').on('click', () => VC.showPanel('#subset-control') );
   $('#view-button').on('click', () => VC.showPanel('#view-control') );
   $('#diagram-button').on('click', () => VC.showPanel('#diagram-control') );
   $('#graphic').on('click', tooltip);

   $(window).off('resize', resizeBody).on('resize', resizeBody);
}

/* Load the static components of the page */
function load() {
   // Promise to load group from invocation URL
   const group_load = Library
      .loadFromURL()
      .then( (_group) => {
         group = _group;
         setDiagramName()
      } )
      .catch( console.error );

   // Promise to load visualizer framework around visualizer-specific code in this file
   const body_load = VC.load();

   // When group and framework are loaded, load panels and complete setup
   Promise.all([group_load, body_load])
          .then( () =>
             // Preload MathML cache for subsetDisplay, diagramControl
             MathML.preload().then( loadPanels )
          )
          .catch( console.error );
}

function loadPanels() {
   const subset_display_load = SSD.load($('#subset-control'));
   const view_controller_load = CVC.load($('#view-control'));
   const diagram_controller_load = DC.load($('#diagram-control'));
   Promise.all([subset_display_load, view_controller_load, diagram_controller_load])
          .then(completeSetup)
          .catch( console.error );
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
   $('#vert-container').resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   });

   // Register event handlers
   registerCallbacks();

   VC.showPanel('#subset-control');

   window.addEventListener( 'message', function ( event ) {
      if ( event.data.source == 'external' ) {
         canEmit = false; // don't spam notifications of changes about to happen
         Diagram_name = event.data.json.hasOwnProperty( '_diagram_name' ) ?
                        event.data.json._diagram_name :
                        group.cayleyDiagrams.length > 0 ?
                        group.cayleyDiagrams[0].name : undefined;
         DC.DiagramChoice.selectDiagram( Diagram_name, false );
         Cayley_diagram = new CayleyDiagram(group, Diagram_name);
         if ( event.data.json.hasOwnProperty( '_use_fog' ) )
            $( '#use-fog' ).prop( 'checked', event.data.json._use_fog );
         if ( event.data.json.hasOwnProperty( '_fog_level' ) )
            $( '#fog-level' ).val( event.data.json._fog_level );
         if ( event.data.json.hasOwnProperty( '_show_labels' ) )
            $( '#show-labels' ).prop( 'checked', event.data.json._show_labels );
         if ( event.data.json.hasOwnProperty( '_label_size' ) )
            $( '#label-size' ).val( event.data.json._label_size );
         Graphic_context.fromJSON( event.data.json, Cayley_diagram );
         $( '#zoom-level' ).val( 10 * Math.log( Cayley_diagram.zoomLevel ) );
         $( '#line-thickness' ).val( Cayley_diagram.lineWidth );
         $( '#node-radius' ).val( 10 * Math.log( Cayley_diagram.nodeScale ) );
         $( '#arrowhead-placement' ).val( 20 * Cayley_diagram.arrowheadPlacement );
         canEmit = true; // restore default behavior
         Graphic_context.showGraphic(Cayley_diagram);
         DC.update();
         window.postMessage( 'state loaded', myDomain );
      }
   }, false );
   // let any GE window that spawned this know that we're ready to receive signals
   window.postMessage( 'listener ready', myDomain );
   // or if any external program is using GE as a service, let it know we're ready, too
   window.parent.postMessage( 'listener ready', '*' );
   // the following code emits a state change if any of our view's data has changed
   // in ways for which we don't currently have event handlers/signals set up.
   // these include camera position, node position, node radius, and arrow positions.
   var lastKey = null;
   setInterval( function () {
      const camera = Graphic_context.camera.matrix.toArray();
      const nodes = Cayley_diagram.nodes.map( n => `${n.point.toArray()}` ).join( ';' );
      const radii = Cayley_diagram.nodes.map( n => `${n.radaius}` ).join( ',' );
      const arrows = Cayley_diagram.lines.map( a => `${a.style},${a.offset}` ).join( ';' );
      const thisKey = `${camera} ${nodes} ${radii} ${arrows}`;
      if ( lastKey != thisKey ) emitStateChange();
      lastKey = thisKey;
   }, 1000 );

   // No need to keep the "find group" icon visible if the group was loaded from a URL
   if ( group.URL ) $( '#find-group' ).hide();
}

function emitStateChange () {
   if ( !canEmit ) return;
   var json = Graphic_context.toJSON( Cayley_diagram );
   json._use_fog = $( '#use-fog' ).prop( 'checked' );
   json._fog_level = $( '#fog-level' ).val();
   json._show_labels = $( '#show-labels' ).prop( 'checked' );
   json._label_size = $( '#label-size' ).val();
   window.postMessage( {
      source : 'editor',
      json : json
   }, myDomain );
   // console.log( 'SENT:', JSON.stringify( json, null, 4 ) );
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

function tooltip(event) {
   // clear existing tooltip on any click, even if it's not to show a new tooltip
   $('#tooltip').remove();

   // if event has shift key, etc., this click isn't to show a tooltip; just return
   if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return;
   }

   event.preventDefault();
   event.stopPropagation();

   // find where click is and show a new tooltip
   const canvas = Graphic_context.renderer.domElement;
   const bounding_box = canvas.getBoundingClientRect();
   const x = ( (event.clientX - bounding_box.x) / canvas.width) * 2 - 1;
   const y = -( (event.clientY - bounding_box.y) / canvas.height) * 2 + 1;

   const objs = Graphic_context.getObjectsAtPoint(x, y);
   if (objs.length != 0) {
      // create, place tooltip
      const first = MathML.sans(objs[0].name);
      const others = objs.filter( (_,inx) => inx != 0 )
                         .map( (obj) => MathML.sans(obj.name) );
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

      $('#graphic').append(tooltip);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'tooltip']);
      Menu.setMenuLocations(event, tooltip);
   }
}

/* Highlighting routines */
function highlightByNodeColor(elements) {
   Cayley_diagram.highlightByNodeColor(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function highlightByRingAroundNode(elements) {
   Cayley_diagram.highlightByRingAroundNode(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function highlightBySquareAroundNode(elements) {
   Cayley_diagram.highlightBySquareAroundNode(elements);
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}

function clearHighlights() {
   Cayley_diagram.clearHighlights();
   Graphic_context.updateHighlights(Cayley_diagram);
   emitStateChange();
}
