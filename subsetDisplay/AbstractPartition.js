// @flow
/*::
import MathML from '../js/MathML.js';

import SSD from './subsets.js';

export default
 */
SSD.AbstractPartition = class AbstractPartition {
/*::
  +destroy: () => void;   
  +name: string;
   subsets: Array<SSD.PartitionSubset>;
  +allElementString: string;
 */   
   constructor() {
      this.subsets = [];
   }

   get name() {
      return [MathML.sans('<mtext>{</mtext>'),
              this.subsets[0].name,
              MathML.sans('<mtext>...</mtext>'), 
              this.subsets[this.subsets.length - 1].name,
              MathML.sans('<mtext>}</mtext>')]
         .join('&nbsp;');
   }

   destroy() {
      this.subsets.forEach( (subset) => subset.destroy() );
      if ($('#partitions li').length == 0) {
         $('#partitions_placeholder').show();
      }
   }

   get allElementString() {
      return '[[' + this.subsets.map( (el) => el.elements.toString() ).join('],[') + ']]';
   }
}
