// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group : XMLGroup;

export default
 */
SSD.Subset = class Subset extends SSD.AbstractSubset {
/*::
   subsetIndex : number;
 */
   constructor(elements /*: void | Array<groupElement> | BitSet */) {
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

   static nextName() /*: string */ {
      return MathML.sub('S', SSD.nextSubsetIndex);
   }
}
