SSD.OrderClasses = class OrderClasses extends SSD.Partition {
   constructor() {
      super();

      this.subsets = window
         .group
         .orderClasses
         .filter( (orderClass) => orderClass != undefined )
         .map( (orderClass, inx) => 
            new SSD.PartitionSubset(this, inx, orderClass, MathML.sub('OC', inx), 'orderClass')
         );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy($curr) {
      $('#partitions li.orderClass').remove();
      super.destroy();
   }
}
