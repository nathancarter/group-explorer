
/*
 * SSD.BasicSubset --
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
 *   (BasicSubset would be an abstract superclass in another language.)
 */

SSD.BasicSubset = class BasicSubset {
   constructor () {
      this.id = SSD.nextId++;
      SSD.displayList[this.id] = this;
   }

   get closure() {
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
   union(other) {
      return new SSD.Subset(BitSet.union(this.elements, other.elements));
   }

   intersection(other) {
      return new SSD.Subset(BitSet.intersection(this.elements, other.elements));
   }

   elementwiseProduct(other) {
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
   
   menuItems(operation) {
      const printOp = operation == 'elementwiseProduct' ? 'elementwise product' : operation;
      const action = (other) => `SSD.displayList[${this.id}].${operation}(SSD.displayList[${other.id}])`;      
      const li = (other) => eval('`' + `<li action="${action(other)}">the ${printOp} of ` +
                                    `${math(this.name)} with ${math(other.name)}</li>` + '`');

      const otherSubsets = SSD.displayList.filter( (el) => el != this );
      const frag =
         otherSubsets.filter( (el) => el instanceof SSD.Subgroup )
                     .reduce( (frag, el) => frag += li(el), '' ) +
         otherSubsets.filter( (el) => el instanceof SSD.Subset )
                     .reduce( (frag, el) => frag += li(el), '' ) +
         otherSubsets.filter( (el) => el instanceof SSD.PartitionSubset )
                     .reduce( (frag, el) => frag += li(el), '' );
      return frag;
   }
}
