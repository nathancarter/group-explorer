
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.Partition {
   constructor() {
      super([]);

      group.conjugacyClasses.forEach(
         elements => this.items.push(
            new SSD.Partition.item(this,
                                   this.items.length,
                                   elements,
                                   `<i>CC<sub>${this.items.length}</sub></i>`,
                                   'conjugacyClass')
         ));

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete($curr) {
      $('#partitions li.conjugacyClass').remove();
   }
}
