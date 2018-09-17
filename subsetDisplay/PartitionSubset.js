SSD.PartitionSubset = class PartitionSubset extends SSD.BasicSubset {
   constructor(parent, subIndex, elements, name, partitionClass) {
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
            result.push(math(group.representation[i]));
         }
      }
      return result.join(', ') + (this.elements.popcount() > 3 ? ', ...' : '');
   }

   get menu() {
      return eval(Template.HTML('partitionMenu_template'));
   }

   get displayLine() {
      return eval(Template.HTML(this.partitionClass + '_template'));
   }
}
