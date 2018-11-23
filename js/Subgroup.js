
/*
 *   subgroup structure -- containing group, and generator, member, contains, containedIn bitsets
 */

class Subgroup {
   constructor(group, generators, members) {
      // just make an empty Subgroup if called with undefined arguments
      if (group === undefined) {
         return;
      }

      this.group = group;
      this.generators = new BitSet(group.order, generators);
      this.members = new BitSet(group.order, members);
   }

   // reference to containing group is useful,
   //   but it creates a circular data structure that can't be serialized in JSON
   //   we skip over it here, and then re-insert it in BasicGroup.parseJSON
   toJSON(arg) {
      const nonCircularCopy = new Subgroup();
      // copy (not clone!) all the properties except 'group'
      for (const prop in this) {
         if (prop != 'group') {
            nonCircularCopy[prop] = this[prop];
         }
      }
      return nonCircularCopy;
   }

   setAllMembers() {
      this.members.setAll();
      return this;
   }

   toString() {
      return `generators: ${this.generators.toString()}; ` +
             `members: ${this.members.toString()}`;
   }

   toRepString(group) {
      return `generators: ${this.generators.toRepString(group)}; ` +
             `members: ${this.members.toRepString(group)}`;
   }

   get order() {
      return this.members.popcount();
   }

   get index() {
      return this.group.order/this.order;
   }

   get isNormal() {
      if (this._isNormal === undefined) {
         this._isNormal = this.group.isNormal(this);
      }
      return this._isNormal;
   }            

   clone() {
      const other = new Subgroup();
      other.group = this.group;
      for (const prop in this) {
         if (prop != 'group') {
            other[prop] = this[prop].clone();
         }
      }
      return other;
   }
}
