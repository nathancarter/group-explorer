
DC.DiagramChoice = class {
   
   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      group.cayleyDiagrams.forEach( (diagram) => {
         $('#diagram-select').append(eval(Template.HTML('diagram-choice-template')));
      } );
      $(`#diagram-select option[value='${(Diagram_name === undefined) ? '' : Diagram_name}']`).attr('selected', 'selected')
   }

   /* Display control routines */
   static selectDiagram(event) {
      Diagram_name = $('#diagram-select')[0].value;
      if (Diagram_name == "") {
         Diagram_name = undefined;
         DC.Generator.enable();
         DC.Chunking.enable();
      } else {
         DC.Generator.disable();
         DC.Chunking.disable();
      }
      
      displayGraphic();
   }
}
