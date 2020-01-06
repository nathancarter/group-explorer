// @flow

import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import * as SSD from './subsets.js';

export default class ConjugacyClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = SSD.group.conjugacyClasses.map( (conjugacyClass, inx) =>
          new SSD.PartitionSubset(this, inx, conjugacyClass, MathML.sans(MathML.sub('CC', inx)), 'conjugacy-class') );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $('#partitions li.conjugacyClass').remove();
      super.destroy();
   }
}
