// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.SubsetEditor = class SubsetEditor {
   static open(displayId /*: number */) {
      const subset = displayId === undefined ? undefined : SSD.displayList[displayId];
      const elements = subset === undefined ? new BitSet(group.order) : subset.elements;
      const setName = subset === undefined ? SSD.Subset.nextName() : subset.name;
      const $subsetEditor = $('body').append(eval(Template.HTML('subsetEditor_template')))
                                     .find('#subset_editor').show();
      $subsetEditor.find('.ssedit_setName').html(setName);
      $subsetEditor.find('#ssedit_cancel_button').on('click', SSD.SubsetEditor.close);
      $subsetEditor.find('#ssedit_ok_button').on('click', SSD.SubsetEditor.accept);
      $subsetEditor.find('.ssedit_panel_container').on('dragover', (ev /*: JQueryEventObject */) => ev.preventDefault());
      $subsetEditor.find('#ssedit_elementsIn_container').on('drop', SSD.SubsetEditor.addElement);
      $subsetEditor.find('#ssedit_elementsNotIn_container').on('drop', SSD.SubsetEditor.removeElement);

      for (const el of group.elements) {
         const elementHTML =
            `<li element=${el} draggable="true">${MathML.sans(group.representation[el])}</li>`;
         const listName = elements.isSet(el) ? 'elementsIn' : 'elementsNotIn';
         $(elementHTML).appendTo($subsetEditor.find(`#${listName}`))
                       .on('dragstart', (event /*: JQueryEventObject */) => {
                          const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
                          if (dragEvent.dataTransfer != undefined) {
                             dragEvent.dataTransfer.setData("text", el.toString());
                          }
                       });
      }

      MathJax.Hub.Queue(['Typeset', MathJax.Hub, "subset_editor"]);
   }

   // Create new subset from elementsIn list, make sure it's formatted, and close editor
   static accept() {
      new SSD.Subset(
         $('#elementsIn > li')
            .map( (_, el) => parseInt($(el).attr('element')) )
            .toArray()
      );
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'subsets']);
      SubsetEditor.close()
   }

   static close() {
      $('#subset_editor').remove();
   }

   static addElement(event /*: JQueryEventObject */) {
      event.preventDefault();
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      if (dragEvent != undefined && dragEvent.dataTransfer != undefined) {
         const element = dragEvent.dataTransfer.getData("text");
         $(`#elementsNotIn li[element=${element}]`).detach().appendTo($(`#elementsIn`));
      }
   }

   static removeElement(event /*: JQueryEventObject */) {
      event.preventDefault();
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      if (dragEvent != undefined && dragEvent.dataTransfer != undefined) {
         const element = dragEvent.dataTransfer.getData("text");
         $(`#elementsIn li[element=${element}]`).detach().appendTo($(`#elementsNotIn`));
      }
   }
}
