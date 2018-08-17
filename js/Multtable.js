
class Multtable {
   constructor(group) {
      this.group = group;
      this.reset();
   }

   static _init() {
      Multtable.COLORATION_RAINBOW = 'Rainbow';
      Multtable.COLORATION_GRAYSCALE = 'Grayscale';
      Multtable.COLORATION_NONE = 'None';
      Multtable.COLORATIONS = [Multtable.COLORATION_RAINBOW,
                               Multtable.COLORATION_GRAYSCALE,
                               Multtable.COLORATION_NONE];
   }

   reset() {
      this.elements = this.group.elements.slice();
      this.separation = 0;
      this.coloration = Multtable.COLORATION_RAINBOW;
      this._stride = this.group.order;
   }

   organizeBySubgroup(subgroup) {
      this.elements = [];
      const cosets = this.group.getCosets(subgroup.members);
      cosets.forEach( (coset) => this.elements.push(...coset.toArray()) );
      this._stride = subgroup.order;
      return this;
   }

   get coloration() {
      return this._coloration;
   }

   set coloration(color) {
      if (Multtable.COLORATIONS.includes(color)) {
         this._coloration = color;
      }
   }

   get stride() {
      return this._stride;
   }
}

Multtable._init();
