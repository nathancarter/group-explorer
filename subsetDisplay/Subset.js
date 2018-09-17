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
      return `<i>S<sub>${this.subsetIndex}</sub></i>`;
   }

   get displayLine() {
      const numElements = this.elements.popcount();
      let items = this.elements
                      .toArray()
                      .slice(0, 3)
                      .map( (el) => math(window.group.representation[el]) )
                      .join(', ');
      if (numElements > 3) {
         items += ', ...';
      }
      return eval(Template.HTML('subset_template'));
   }

   get menu() {
      return eval(Template.HTML('subsetMenu_template'));
   }

   destroy() {
      super.destroy();
      if ($('#subsets li').length == 0) {
         $('#subsets_placeholder').show();
      }
   }

   static nextName() {
      return `<i>S<sub>${SSD.nextSubsetIndex}</sub></i>`;
   }
}
