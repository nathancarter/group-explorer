// @flow

import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import SubgroupFinder from '../js/SubgroupFinder.js';
import XMLGroup from '../js/XMLGroup.js';

import * as SSD from './subsets.js';

export default class Subgroup extends SSD.AbstractSubset {
/*::
   subgroupIndex: number;
  +normalizer: SSD.Subset;
  +leftCosets: SSD.Cosets;
  +rightCosets: SSD.Cosets;
 */
   constructor(subgroupIndex /*: number */) {
      super();

      this.subgroupIndex = subgroupIndex;
      this.elements = SSD.group.subgroups[subgroupIndex].members;
   }

   get name() {
      return MathML.sans(MathML.sub('H', this.subgroupIndex));
   }

   get displayLine() {
      const generators = SSD.group.subgroups[this.subgroupIndex].generators.toArray()
                               .map( el => SSD.group.representation[el] );
      let templateName;
      switch (this.subgroupIndex) {
         case 0:
            templateName = 'first-subgroup-template';	break;
         case SSD.group.subgroups.length - 1:
            templateName = 'last-subgroup-template';	break;
         default:
            templateName = 'subgroup-template';	break;
      }
      return eval(Template.HTML(templateName));
   }

   get menu() {
      return $(eval(Template.HTML('subgroup-menu-template')));
   }

   get normalizer() {
      return new SSD.Subset(
         new SubgroupFinder(SSD.group)
            .findNormalizer(SSD.group.subgroups[this.subgroupIndex]).members );
   }

   get leftCosets() {
      return new SSD.Cosets(this, 'left');
   }

   get rightCosets() {
      return new SSD.Cosets(this, 'right');
   }

   static displayAll() {
      $('#subgroups').html('').append(
         SSD.group.subgroups.reduce( (frag, _, inx) => frag.append(new SSD.Subgroup(inx).displayLine),
                                 $(document.createDocumentFragment()) ));
   }
}
