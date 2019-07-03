// @flow
/*
 * SSD.AbstractSubset --
 *   Direct superclass of SSD.Subgroup, SSD.Subset, and SSD.Partition
 *   Assigns an id to every element displayed in the subsetDisplay,
 *     and adds it to SSD.displayList
 *   Implements set operations unions, intersection, and elementwise product
 *
 *   Subclasses must implement name, elements, displayLine, and menu properties
 *     name - subset name for display (e.g., "H₂" or "S₃")
 *     elements - elements of subset (as bitset)
 *     displayLine - line for this subset in display (e.g., "H₁ = < f > is a subgroup of order 2.")
 *     menu - context menu brought up by this element in display
 *
 *   (AbstractSubset would be an abstract superclass in another language.)
 */
/*::
import BitSet from '../js/BitSet.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.AbstractSubset = class AbstractSubset {
/*::
   id: number;
   elements: BitSet;
  +name: string;	// implemented in subclass
  +menu: JQuery;	// implemented in subclass
  +displayLine: string; // implemented in subclass
 */  
   constructor() {
      this.id = SSD.nextId++;
      SSD.displayList[this.id] = this;
   }

   get closure() /*: SSD.Subset */ {
      return new SSD.Subset(group.closure(this.elements));
   }

   // delete is a javascript keyword...
   destroy() {
      delete(SSD.displayList[this.id]);
      $(`#${this.id}`).remove();
   }


   /*
    * Operations that create new SSD.Subsets by performing
    *   union, intersection, and elementwise product on this set
    */
   union(other /*: SSD.AbstractSubset */) /* SSD.Subset */ {
      return new SSD.Subset(BitSet.union(this.elements, other.elements));
   }

   intersection(other /*: SSD.AbstractSubset */) /*: SSD.Subset */ {
      return new SSD.Subset(BitSet.intersection(this.elements, other.elements));
   }

   elementwiseProduct(other /*: SSD.AbstractSubset */) /*: SSD.Subset */{
      const newElements = new BitSet(group.order);
      for (let i = 0; i < this.elements.len; i++) {
         if (this.elements.isSet(i)) {
            for (let j = 0; j < other.elements.len; j++) {
               if (other.elements.isSet(j)) {
                  newElements.set(group.multtable[i][j]);
               }
            }
         }
      }
      return new SSD.Subset(newElements);      
   }

   get elementString() /*: string */ {
      return '[' + this.elements.toString() + ']';
   }
}
