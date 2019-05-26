// @flow
/*
 *   subgroup structure -- containing group, and generator, member, contains, containedIn bitsets
 */
/*::
import BitSet from './BitSet.js';
import type {BitSetJSON} from './BitSet.js';
import BasicGroup from './BasicGroup.js';
import XMLGroup from './XMLGroup.js';

export type SubgroupJSON = {
   generators : BitSetJSON;
   members : BitSetJSON;
   _isNormal : boolean;
   contains : BitSetJSON;
   containedIn : BitSetJSON;
};

export default
 */
class Subgroup {
/*::
   group : BasicGroup;
   generators : BitSet;
   members : BitSet;
   _isNormal : boolean;
   contains : BitSet;
   containedIn : BitSet;
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
      const result = Object.assign(new Subgroup, ((this /*: any */) /*: {(key: string) : mixed} */));
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

   toRepString(group /*: XMLGroup */) /*: string */ {
      return `generators: ${this.generators.toRepString(group)}; ` +
             `members: ${this.members.toRepString(group)}`;
   }

   get order() /*: number */ {
      return this.members.popcount();
   }

   get index() /*: number */ {
      return this.group.order/this.order;
   }

   get isNormal() /*: boolean */ {
      if (this._isNormal === undefined) {
         this._isNormal = this.group.isNormal(this);
      }
      return this._isNormal;
   }            

   // clone all fields except group reference
   clone() /*: Subgroup */ {
      const clone = new Subgroup();
      for (const prop in this) {
         ((clone /*: any */) /*: {(key: string): mixed} */)[prop] =
            (prop == 'group') ? this.group : ((this /*: any */) /*: {(key: string): mixed} */)[prop].clone();
      }
      return clone;
   }
}
