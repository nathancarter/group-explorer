
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.Partition {
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
