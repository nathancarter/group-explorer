// @flow
/*::
import MathML from '../js/MathML.js';

import SSD from './subsets.js';

export default
 */
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = window.group.conjugacyClasses.map( (conjugacyClass, inx) => 
         new SSD.PartitionSubset(this, inx, conjugacyClass, MathML.sub('CC', inx), 'conjugacyClass') );
      
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
