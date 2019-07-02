/* Global variables */
var group,		// group about which information will be displayed
    diagramName,		// name of Cayley diagram, or undefined if generated
    graphicData,		// data being displayed in large diagram
    graphicContext;	// graphic context for large diagram
const HELP_PAGE = 'help/rf-um-os-options/index.html';

/* Initial entry to javascript, called once after document load */
$(window).one('load', load);

/* Register static event managers (called after document is assembled) */
function registerCallbacks() {
   $('#zoom-level').off('input', set_zoom_level).on('input', set_zoom_level);
   $('#line-thickness').off('input', set_line_thickness).on('input', set_line_thickness);
   $('#node-radius').off('input', set_node_radius).on('input', set_node_radius);
   $('#fog-level').off('input', set_fog_level).on('input', set_fog_level);
   $('#use-fog').off('input', set_fog_level).on('input', set_fog_level);
   $(window).off('click', diagramClickHandler).on('click', diagramClickHandler);
   $(window).off('resize', resizeBody).on('resize', resizeBody);
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
          .then( () => {
             diagramName = getDiagramName();
             if (diagramName != undefined) {
                completeSetup();
             }} )
          .catch( console.error );
}

/* Get diagramName from URL (undefined => error, no symmetry group) */
function getDiagramName() {
   let name = new URL(window.location.href).searchParams.get('diagram');

   // Check that this group has a symmetry object at all
   if (group.symmetryObjects.length == 0) {
      alert(`The group ${mathml2text(group.name)} has no symmetry objects.`);
      name = undefined;
   } else {
      // Check that name matches some symmetryObject
      if (!group.symmetryObjects.some( (symmetryObject) => symmetryObject.name == name )) {
         if (name != null) {
            // If a name is passed but there is no matching symmetryObject, alert user
            alert(`The group ${mathml2text(group.name)} has no symmetry object named ${name}. ` +
                  `Using ${group.symmetryObject[0].name} instead.`);
         }
         // Name doesn't match any symmetry object, default to first symmetryObject
         name = group.symmetryObjects[0].name;
      }
   }
   return name;
}

/* Now that group has loaded, complete the setup */
function completeSetup() {
   // Register event handlers
   registerCallbacks();

   // Create header from group name and queue MathJax to typeset it
   $('#header').html(MathML.sans('<mtext>Object of Symmetry for&nbsp;</mtext>' + group.name));
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);

   // Create list of symmetry object option for faux-select
   for (let index = 0; index < group.symmetryObjects.length; index++) {
      $('#diagram-choices').append(eval(Template.HTML('diagram-choice-template'))).hide();
   };
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices',
                      () => $('#diagram-choice').html($('#diagram-choices > li:first-of-type').html())]);

   // Draw symmetry object in graphic
   graphicContext = new DisplayDiagram({container: $('#graphic'), trackballControlled: true});
   displaySymmetryObject();

   $('#vert-container').resizable({
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left',
      onDrag: resizeGraphic,
   })
}

// Resize the body, including the graphic
function resizeBody() {
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);

   resizeGraphic();
};

/* Displays symmetry object -- called during setup, and upon changing symmetry object */
function displaySymmetryObject() {
   graphicData = SymmetryObject.generate(group, diagramName);
   graphicData.lineWidth = 10;
   graphicContext.showGraphic(graphicData);
}

/*
 * Resize the 3D scene from the freshly re-sized graphic
 *   (detach the canvas containing the 3D scene from the DOM,
 *    change camera parameters and renderer size, and then re-attach it)
 */
function resizeGraphic() {
   if (graphicContext.camera !== undefined) {
      $('#graphic > canvas').remove();
      graphicContext.camera.aspect = $('#graphic').width() / $('#graphic').height();
      graphicContext.camera.updateProjectionMatrix();
      graphicContext.renderer.setSize($('#graphic').width(), $('#graphic').height());
      $('#graphic').append(graphicContext.renderer.domElement);
   }
}

/* Change diagram */
function diagramClickHandler(event) {
   const $curr = $(event.target).closest('[action]');
   if ($curr.length == 0) {
      $('#diagram-choices').hide();
   } else {
      eval($curr.attr('action'));
   }
}

function set_diagram_name(index) {
   diagramName = group.symmetryObjects[index].name;
   $('#diagram-choice').html($(`#diagram-choices > li:nth-of-type(${index+1})`).html());
   $('#diagram-choices').hide();
   displaySymmetryObject();
}

/* Slider handlers */
function set_zoom_level() {
   graphicData.zoomLevel = Math.exp( $('#zoom-level')[0].valueAsNumber/10 );
   graphicContext.updateZoomLevel(graphicData);
}

/* Set line thickness from slider value
 *   slider is in range [1,20], maps non-linearly to [1,15] so that:
 *   1 -> 1, using native WebGL line
 *   2 -> [4,15] by 4*exp(0.07*(slider-2)) heuristic, using THREE.js mesh line
 */
function set_line_thickness() {
   const slider_value = $('#line-thickness')[0].valueAsNumber;
   const lineWidth = (slider_value == 1) ? 1 : 4*Math.exp(0.0734*(slider_value-2));
   graphicData.lineWidth = lineWidth;
   graphicContext.updateLineWidth(graphicData);
}

function set_node_radius() {
   graphicData.nodeScale = Math.exp( $('#node-radius')[0].valueAsNumber/10 );
   graphicContext.updateNodeRadius(graphicData);
}

function set_fog_level() {
   graphicData.fogLevel = $('#use-fog')[0].checked ? $('#fog-level')[0].valueAsNumber/10 : 0;
   graphicContext.updateFogLevel(graphicData);
}
