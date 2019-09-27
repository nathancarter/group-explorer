// @flow
/*::
import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = group.conjugacyClasses.map( (conjugacyClass, inx) =>
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
