SSD.OrderClasses = class OrderClasses extends SSD.Partition {
   constructor() {
      super([]);

      window.group.orderClasses.forEach(
         elements => this.items.push(
            new SSD.Partition.item(this,
                                   this.items.length,
                                   elements,
                                   `<i>OC<sub>${this.items.length}</sub></i>`,
                                   'orderClass')
         ));

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete($curr) {
      $('#partitions li.orderClass').remove();
   }
}
