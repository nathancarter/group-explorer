// @flow

import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import * as SSD from './subsets.js';

export default class OrderClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = SSD.group
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
