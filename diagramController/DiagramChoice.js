
DC.DiagramChoice = class {

   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      let diagram_index = -1;
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      group.cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
         diagram_index = (diagram.name == Diagram_name) ? index : diagram_index;
      } );
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices', () => {
         // check to see if anyone changed the diagram index since this MathJax
         // task was queued; if so, keep their choice, not our old one:
         const index = $('#diagram-choice').is('[index]') ? // does it have that attr?
            $('#diagram-choice').attr('index') : diagram_index;
         $('#diagram-choice')
            .html($(`#diagram-choices > li:nth-of-type(${index+2}`).html())
            .attr('index', index)
            .show();
      } ]);
   }

   /* Display control routines */
   static clickHandler(event) {
      event.preventDefault();

      const $curr = $(event.target).closest('[action]');
      if ($curr != undefined) {
         eval($curr.attr('action'));
         event.stopPropagation();
      }
   }

   static selectDiagram(diagram,andDisplay) {
      if ( typeof( andDisplay ) == 'undefined' ) andDisplay = true;
      const index = ( typeof( diagram ) == 'string' ) ?
         group.cayleyDiagrams.map( x => x.name ).indexOf( diagram ) : diagram;
      if (!diagram || index == -1) {
         Diagram_name = undefined;
         $('#diagram-choice').html($('#diagram-choices > li:first-of-type').html());
         DC.Generator.enable();
         DC.Chunking.enable();
      } else {
         Diagram_name = group.cayleyDiagrams[index].name;
         $('#diagram-choice').html($(`#diagram-choices > li:nth-of-type(${index+2})`).html());
         DC.Generator.disable();
         DC.Chunking.disable();
      }
      $('#diagram-choice').attr('index', index);
      $('#diagram-choices').hide();

      if ( andDisplay ) displayGraphic();
   }
}
