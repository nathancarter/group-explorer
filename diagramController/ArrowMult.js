
DC.ArrowMult = class {
   static clickHandler(event) {
      event.preventDefault();

      Cayley_diagram.right_multiplication = (event.target.value == 'right');
      Graphic_context.showGraphic(Cayley_diagram);

      event.stopPropagation();
   }

}
  
