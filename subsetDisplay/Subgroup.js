
SSD.Subgroup = class Subgroup extends SSD.BasicSubset {
   constructor (subgroupIndex) {
      super();

      this.subgroupIndex = subgroupIndex;
      this.elements = window.group.subgroups[subgroupIndex].members;
   }

   get name() {
      return `<i>H<sub>${this.subgroupIndex}</sub></i>`;
   }

   get displayLine() {
      const generators = window.group.subgroups[this.subgroupIndex].generators.toArray()
                               .map( el => math(group.representation[el]) ).join(', ');
      let templateName;
      switch (this.subgroupIndex) {
         case 0:
            templateName = '#firstSubgroup_template';	break;
         case window.group.subgroups.length - 1:
            templateName = '#lastSubgroup_template';	break;
         default:
            templateName = '#subgroup_template';	break;
      }
      return eval(Template.HTML(templateName));
   }

   get menu() {
      return eval(Template.HTML('#subgroupMenu_template'));
   }

   get normalizer() {
      new SSD.Subset(
         new SubgroupFinder(window.group)
            .findNormalizer(window.group.subgroups[this.subgroupIndex]).members );
   }

   get leftCosets() {
      return new SSD.Cosets(this, 'left');
   }

   get rightCosets() {
      return new SSD.Cosets(this, 'right');
   }

   static displayAll() {
      $('#subgroups').html(
         window.group
               .subgroups
               .reduce( (frag, _, inx) => frag.append(new SSD.Subgroup(inx).displayLine),
                        $(document.createDocumentFragment()) )
      );
   }
}
