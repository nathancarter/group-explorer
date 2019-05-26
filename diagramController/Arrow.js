// @flow
/* This class brings together the functions used in managing the "Show these arrows:" arrow-list display and its side effects

   The central actions here are to add and remove arrows from the arrow-list display and the Cayley diagram

   Adding an arrow is done by left-clicking the 'Add' button, which display a menu of addable arrows (those not already in the diagram)
   and then left-clicking an arrow to add from the menu. Left-clicking anywhere else in the window will remove the menu.

   Removing an arrow is done by left-clicking one of the lines in the arrow-list display to highlight it,
   and then left-clicking the 'Remove' button to remove it.

   All of these events are fielded by a single event handler, Arrow.clickHandler(), which
 */
/*::
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import Menu from '../js/Menu.js';
import XMLGroup from '../js/XMLGroup.js';
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';

import DC from './diagram.js';

var emitStateChange : () => void;
var group : XMLGroup;
var Cayley_diagram : CayleyDiagram;
var Graphic_context : DisplayDiagram;

export default
 */
DC.Arrow = class {
   // actions:  show menu; select from menu; select from list; remove
   // utility function add_arrow_list_item(element) to add arrow to list (called from initialization, select from menu)
   // utility function clearArrowList() to remove all arrows from list (called during reset)

   // arrow-control click handler
   //   find closest element with action and execute action
   static clickHandler(event /*: JQueryEventObject */) {
      event.stopPropagation();
      eval($(event.target).closest('[action]').attr('action'));
   }

   // Row selected in arrow-list:
   //   clear all highlights
   //   highlight row (find arrow-list item w/ arrow = ${element})
   //   enable remove button
   static selectArrow(element /*: number */) {
      $('#arrow-list li').removeClass('highlighted');
      $(`#arrow-list li[arrow=${element}]`).addClass('highlighted');
      $('#remove-arrow-button').attr('action', `DC.Arrow.removeArrow(${element})`);
      $('#remove-arrow-button').prop('disabled', false);
   }

   // returns all arrows displayed in arrow-list as an array
   static getAllArrows() /*: Array<number> */ {
      return $('#arrow-list li').toArray().map( (list_item) => parseInt(list_item.getAttribute('arrow')) );
   }

   // Add button clicked:
   //   Clear (hidden) menu
   //   Populate menu (for each element not in arrow-list)
   //   Position, expose menu
   static showArrowMenu(event /*: JQueryMouseEventObject */) {
      DC.clearMenus();
      const $menu = $(eval(Template.HTML('arrow-menu-template')));
      group.elements.forEach( (element) => {
         if (element != 0 && $(`#arrow-list li[arrow=${element}]`).length == 0) {
            $menu.append(
               $(eval(Template.HTML('arrow-menu-item-template')))
                  .html(MathML.sans(group.representation[element])));
         }
      } );
      // $('#add-arrow-button').append($menu);
      $(event.target).closest('button').append($menu);
      Menu.setMenuLocations(event, $menu);
   }

   // Add button menu element clicked:
   //   Hide menu
   //   Add lines to Cayley_diagram
   //   Update lines, arrowheads in graphic, arrow-list
   static addArrow(element /*: number */) {
      DC.clearMenus();
      Cayley_diagram.addLines(element);
      DC.Arrow.updateArrows();
   }

   // Remove button clicked
   //   Remove highlighted row from arrow-list
   //   Disable remove button
   //   Remove line from Cayley_diagram
   //   Update lines in graphic, arrow-list
   static removeArrow(element /*: number */) {
      $('#remove-arrow-button').prop('disabled', true);
      Cayley_diagram.removeLines(element);
      DC.Arrow.updateArrows()
   }

   // clear arrows
   // set line colors in Cayley_diagram
   // update lines, arrowheads in CD
   // add rows to arrow list from line colors
   static updateArrows() {
      $('#arrow-list').children().remove();
      Cayley_diagram.setLineColors();
      Graphic_context.updateLines(Cayley_diagram);
      Graphic_context.updateArrowheads(Cayley_diagram);
      // ES6 introduces a Set, but does not provide any way to change the notion of equality among set members
      // Here we work around that by joining a generator value from the line.arrow attribute ("27") and a color ("#99FFC1")
      //   into a unique string ("27#99FFC1") in the Set, then partitioning the string back into an element and a color part
      const arrow_hashes = new Set(Cayley_diagram.lines.map( (line) => '' + line.arrow + (line.color).toString() ));
      arrow_hashes.forEach( (hash) => {
         const element = hash.slice(0,-7);
         const color = hash.slice(-7);
         $('#arrow-list').append(eval(Template.HTML('arrow-list-item-template')));  // make entry in arrow-list
      } );
      if (arrow_hashes.size == group.order - 1) {  // can't make an arrow out of the identity
         DC.Arrow.disable()
      } else {
         DC.Arrow.enable()
      }
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'arrow-control']);
      emitStateChange();
   }

   // disable Add button
   static enable() {
      $('#add-arrow-button').prop('disabled', false);
   }

   // enable Add button
   static disable() {
      $('#add-arrow-button').prop('disabled', true);
   }
}
