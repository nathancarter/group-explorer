
DC.DiagramChoice = class {

   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      let diagram_index = -1;
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      group.cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
         diagram_index = (diagram.name == Diagram_name) ? index : diagram_index;
      } );
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices',
                         () => $('#diagram-choice')
                            .html($(`#diagram-choices > li:nth-of-type(${diagram_index+2}`).html())
                            .attr('index', diagram_index)
                            .show()
      ]);
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

   static selectDiagram(index) {
      if (index == -1) {
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
      $('#diagram-choice').attr('index',  index);
      $('#diagram-choices').hide();
 
     displayGraphic();
   }
}
