// @flow
/*::
import MathML from '../js/MathML.md';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.OrderClasses = class OrderClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = group
         .orderClasses
         .filter( (orderClass) => orderClass.popcount() != 0 )
         .map( (orderClass, inx) => 
            new SSD.PartitionSubset(this, inx, orderClass, MathML.sans(MathML.sub('OC', inx)), 'order-class')
         );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $('#partitions li.orderClass').remove();
      super.destroy();
   }
}
