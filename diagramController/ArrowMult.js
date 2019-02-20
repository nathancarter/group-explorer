
DC.ArrowMult = class {
   static clickHandler(event) {
      event.preventDefault();

      const $curr = $(event.target).closest('[multiplication]');
      if ($curr.length != 0) {
         Cayley_diagram.right_multiplication = ($curr.attr('multiplication') == 'right');
         $curr.children('input')[0].checked = true;
         Graphic_context.showGraphic(Cayley_diagram);
      }
      event.stopPropagation();
   }
}
