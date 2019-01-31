SSD.Subset = class Subset extends SSD.BasicSubset {
   constructor (elements) {
      super();
      
      if (elements === undefined) {
         this.elements = new BitSet(group.order);
      } else if (Array.isArray(elements)) {
         this.elements = new BitSet(group.order, elements);
      } else {
         this.elements = elements;
      }
      this.subsetIndex = SSD.nextSubsetIndex++;
      $('#subsets_placeholder').hide();
      $('#subsets').append(this.displayLine).show();
   }

   get name() {
      return MathML.sub('S', this.subsetIndex);
   }

   get displayLine() {
      const numElements = this.elements.popcount();
      let items = this.elements
                      .toArray()
                      .slice(0, 3)
                      .map( (el) => window.group.representation[el] );
       if (numElements > 3) {
         items.push('<mtext>...</mtext>');
      }
      return eval(Template.HTML('subset_template'));
   }

   get menu() {
      const $menu = $(eval(Template.HTML('subsetMenu_template')));
      $('template.subset-extension').each( (_, template) => $menu.append(eval('`' + $(template).html() + '`')) );
      return $menu;
   }

   destroy() {
      super.destroy();
      if ($('#subsets li').length == 0) {
         $('#subsets_placeholder').show();
      }
   }

   static nextName() {
      return MathML.sub('S', SSD.nextSubsetIndex);
   }
}
