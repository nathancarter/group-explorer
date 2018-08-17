SSD.Cosets = class Cosets extends SSD.Partition {
   constructor(index, side) {
      super([]);

      this.subgroupIndex = index;
      this.subgroupName = SSD.Subgroup.list[index].name;
      this.isLeft = side == 'left';
      this.side = side;

      const cosets = group.getCosets(SSD.Subgroup.list[index].elements, this.isLeft);
      for (const coset of cosets) {
         const rep = math(group.representation[coset.first()]);
         const name = this.isLeft ? rep + this.subgroupName : this.subgroupName + rep;
         this.items.push(new SSD.Partition.item(this,
                                                this.items.length,
                                                coset,
                                                name,
                                                'cosetClass'));
      }

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete() {
      $(`#partitions li.${this.side}coset${this.subgroupIndex}`).remove();
   }
}
