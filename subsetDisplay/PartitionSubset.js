// @flow
/*::
import BitSet from '../js/BitSet.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.PartitionSubset = class PartitionSubset extends SSD.AbstractSubset {
/*::
   parent: SSD.AbstractPartition;
   subIndex: number;
   elements: BitSet;
   name: string;
   partitionClass: string;
  +elementRepresentations: Array<string>;
 */
   constructor(parent /*: SSD.AbstractPartition */,
               subIndex /*: number */,
               elements /*: BitSet */,
               name /*: string */,
               partitionClass /*: string */) {
      super();

      this.parent = parent;
      this.subIndex = subIndex;
      this.elements = elements;
      this.name = name;
      this.partitionClass = partitionClass;
   }

   get elementRepresentations() {
      const result = [];
      for (let i = 0; i < this.elements.len && result.length < 3; i++) {
         if (this.elements.isSet(i)) {
            result.push(group.representation[i]);
         }
      }
      if (this.elements.popcount() > 3) {
         result.push('<mtext>...</mtext>');
      }
      return result;
   }

   get menu() {
      return $(eval(Template.HTML('partition-menu-template')));
   }

   get displayLine() /*: html */ {
      return eval(Template.HTML(this.partitionClass + '-template'));
   }
}
