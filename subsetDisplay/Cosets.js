SSD.Cosets = class Cosets extends SSD.Partition {
   constructor(subgroup, side) {
      super();

      this.subgroup = subgroup;
      this.isLeft = side == 'left';
      this.side = side;

      this.subsets = window
         .group
         .getCosets(this.subgroup.elements, this.isLeft)
         .map( (coset, inx) => {
            const rep = math(window.group.representation[coset.first()]);
            const name = this.isLeft ? rep + this.subgroup.name : this.subgroup.name + rep;
            return new SSD.PartitionSubset(this, inx, coset, name, 'cosetClass');
         } );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $(`#partitions li.${this.side}coset${this.subgroupIndex}`).remove();
      super.destroy();
   }
}
