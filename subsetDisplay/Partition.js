SSD.Partition = class Partition {
   constructor (items) {
      this.partitionIndex = SSD.Partition.list.length;
      SSD.Partition.list.push(this);

      this.items = items;
   }

   static init() {
      SSD.Partition.list = [];
      if (SSD.Partition.item === undefined) {
         SSD.Partition.item = class  {
            constructor(parent, subIndex, elements, name, partitionClass) {
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
               return eval(Template.HTML('#partitionMenu_template'));
            }

            get listItem() {
               return eval(Template.HTML('#' + this.partitionClass + '_template'));
            }
         }
      }
   }

   get listItem() {
      return this.items
                 .map( item => item.listItem )
                 .join('');
   }

   get name() {
      return this.items[0].name +
             ', ..., ' +
             this.items[this.items.length - 1].name;
   }

   static delete($curr, index) {
      SSD.Partition.list[index].delete($curr);
      delete(SSD.Partition.list[index]);
      if (SSD.Partition.list.every( _ => false )) { // no defined elements?
         $('#partitions').hide();
         $('#partitions_placeholder').show();
      }
   }

   static displayAll() {
      if (SSD.Partition.list.every( _ => false )) { // no defined elements?
         $('#partitions_placeholder').show();
         $('#partitions').hide();
      } else {
         $('#partitions_placeholder').hide();
         $('#partitions').html(
            SSD.Partition.list.reduce( ($acc, el) => $acc.append(el.listItem),
                                       $(document.createDocumentFragment()) ))
                         .show();
      }
   }

   static getMenu($curr, index, subIndex) {
      return $(SSD.Partition.list[index].items[subIndex].menu)
   }
}
