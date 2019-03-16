
DC.ArrowMult = class {
   static setMult(rightOrLeft) {
      Cayley_diagram.right_multiplication = (rightOrLeft == 'right');
      Graphic_context.showGraphic(Cayley_diagram);
   }
}
