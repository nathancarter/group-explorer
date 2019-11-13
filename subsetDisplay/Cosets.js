// @flow
/*::
import MathML from '../js/MathML.md';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.Cosets = class Cosets extends SSD.AbstractPartition {
/*::
  subgroup: SSD.Subgroup;
  isLeft: boolean;
  side: string;
 */
   constructor(subgroup /*: SSD.Subgroup */, side /*: string */) {
      super();

      this.subgroup = subgroup;
      this.isLeft = side == 'left';
      this.side = side;

      this.subsets = group
         .getCosets(this.subgroup.elements, this.isLeft)
         .map( (coset, inx) => {
            const rep = group.representation[((coset.first() /*: any */) /*: groupElement */)];
            const name = this.isLeft ?
                         MathML.sans(rep) + this.subgroup.name :
                         this.subgroup.name + MathML.sans(rep);
            return new SSD.PartitionSubset(this, inx, coset, name, 'coset-class');
         } );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $(`#partitions li.${this.side}coset${this.subgroup.subgroupIndex}`).remove();
      super.destroy();
   }
}
