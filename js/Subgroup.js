// @flow
/*
 *   subgroup structure -- containing group, and generator, member, contains, containedIn bitsets
 */
import BitSet from './BitSet.js';
import BasicGroup from './BasicGroup.js';

/*::
import type {BitSetJSON} from './BitSet.js';

export type SubgroupJSON = {
   generators: BitSetJSON,
   members: BitSetJSON,
   _isNormal: boolean,
   contains: BitSetJSON,
   containedIn: BitSetJSON
};
*/

export default
class Subgroup {
/*::
   group: BasicGroup;
   generators: BitSet;
   members: BitSet;
   _isNormal: boolean;
   contains: BitSet;
   containedIn: BitSet;
 */
   constructor(group /*: ?BasicGroup */,
               generators /*: Array<number> */ = [],
               members /*: Array<number> */ = []) {
      // just make an empty Subgroup if called with undefined arguments
      if (group != undefined) {
         this.group = group;
         this.generators = new BitSet(group.order, generators);
         this.members = new BitSet(group.order, members);
      }
   }

   // reference to containing group is useful,
   //   but it creates a circular data structure that can't be serialized in JSON
   //   we skip that reference here, and then re-insert it in BasicGroup.parseJSON
   toJSON() /*: Subgroup */ {
      const result = Object.assign(new Subgroup, ((this /*: any */) /*: Obj */));
      delete result.group;
      return result;
   }

   static parseJSON(jsonObject /*: SubgroupJSON */) /*: Subgroup */ {
      const subgroup = new Subgroup();
      subgroup.generators = BitSet.parseJSON(jsonObject.generators);
      subgroup.members = BitSet.parseJSON(jsonObject.members);
      subgroup._isNormal = jsonObject._isNormal;
      if (jsonObject.contains != undefined) {
         subgroup.contains = BitSet.parseJSON(jsonObject.contains);
         subgroup.containedIn = BitSet.parseJSON(jsonObject.containedIn);
      }
      return subgroup;
   }

   setAllMembers() /*: Subgroup */ {
      this.members.setAll();
      return this;
   }

   toString() /*: string */ {
      return `generators: ${this.generators.toString()}; ` +
             `members: ${this.members.toString()}`;
   }

   get order() /*: number */ {
      return this.members.popcount();
   }

   get index() /*: number */ {
      return this.group.order/this.order;
   }

   get isNormal() /*: boolean */ {
      if (this._isNormal == undefined) {
         this._isNormal = this.group.isNormal(this);
      }
      return this._isNormal;
   }

  // clone/copy all fields except group reference
   clone () /*: Subgroup */ {
      const clone = new Subgroup()
      const klone = ((clone /*: any */) /*: {[string]: ?mixed} */)
      for (const [key, value] of Object.entries(this)) {
         if (value === undefined) {
            klone[key] = undefined
         } else if (key === 'group') {  // avoid circular reference
            klone[key] = value
         } else if (typeof value === 'object') {  // copy objects
            klone[key] = (value /*: any */).clone()
         } else {
            klone[key] = value
         }
      }
      return clone
   }
}
