
SSD.Subgroup = class Subgroup {
   constructor (index) {
      this.index = index;
      this.elements = group.subgroups[index].members;
      SSD.Subgroup.list[index] = this;
   }

   get name() {
      return `<i>H<sub>${this.index}</sub></i>`;
   }

   get listItem() {
      const index = this.index,
            items = window.group.subgroups[index].generators.toArray()
                          .map( el => math(group.representation[el]) ).join(', ');
      switch (index) {
         case 0:
            return eval(Template.HTML('#firstSubgroup_template'));
         case window.group.subgroups.length - 1:
            return eval(Template.HTML('#lastSubgroup_template'));
         default:
            return eval(Template.HTML('#subgroup_template'));
      }
   }

   get menu() {
      return eval(Template.HTML('#subgroupMenu_template'));
   }

   static createNormalizer(index) {
      new SSD.Subset(
         new SubGroupFinder(window.group).findNormalizer(window.group.subgroups[index]).members );
   }


   static displayAll() {
      const $frag = $(document.createDocumentFragment());
      window.group.subgroups.forEach( (_, inx) => $frag.append(new SSD.Subgroup(inx).listItem) );
      $('#subgroups').html($frag);
   }

   static getMenu($curr, index) {
      return $(SSD.Subgroup.list[index].menu);
   }

   static init() {
      SSD.Subgroup.list = [];
   }
}
