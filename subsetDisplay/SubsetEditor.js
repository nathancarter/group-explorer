
SSD.SubsetEditor = class SubsetEditor {
   static open(displayId) {
      const subset = displayId === undefined ? undefined : SSD.displayList[displayId];
      const elements = subset === undefined ? new BitSet(group.order) : subset.elements;
      const setName = subset === undefined ? SSD.Subset.nextName() : subset.name;
      const $subsetEditor = $('body').append(eval(Template.HTML('#subsetEditor_template')))
                                     .find('#subset_editor').show();
      $subsetEditor.find('.ssedit_setName').html(setName);
      $subsetEditor.find('#ssedit_cancel_button').on('click', SSD.SubsetEditor.close);
      $subsetEditor.find('#ssedit_ok_button').on('click', SSD.SubsetEditor.accept);
      $subsetEditor.find('.ssedit_panel_container').on('dragover', (ev) => ev.preventDefault());
      $subsetEditor.find('#ssedit_elementsIn_container').on('drop', SSD.SubsetEditor.addElement);
      $subsetEditor.find('#ssedit_elementsNotIn_container').on('drop', SSD.SubsetEditor.removeElement);
      
      for (const el of group.elements) {
         const elementHTML =
            `<li element=${el} draggable="true">${math(window.group.representation[el])}</li>`;
         const listName = elements.isSet(el) ? 'elementsIn' : 'elementsNotIn';
         $(elementHTML).appendTo($subsetEditor.find(`#${listName}`))
                       .on('dragstart', (ev) => ev.originalEvent.dataTransfer.setData("text", el));
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

   static addElement(ev) {
      ev.preventDefault();
      const element = ev.originalEvent.dataTransfer.getData("text");
      $(`#elementsNotIn li[element=${element}]`).detach().appendTo($(`#elementsIn`));
   }

   static removeElement(ev) {
      ev.preventDefault();
      const element = ev.originalEvent.dataTransfer.getData("text");
      $(`#elementsIn li[element=${element}]`).detach().appendTo($(`#elementsNotIn`));
   }
}
