// @flow
/*
 * bitset as array of (32-bit) ints
 */

/*:: 
import XMLGroup from './XMLGroup.js';

export type BitSetJSON = {
   len: number,
   arr : Array<number>,
};

export default
 */
class BitSet {
/*::
   len : number;
   arr : Array<number>;
 */
   constructor (length /*: number */, init /*:: ?: Array<groupElement> */ = []) {
      this.len = length;
      this.arr = new Array(length == 0 ? 0 : (((length - 1) >>> 5) + 1));
      this.arr.fill(0);
      for (let i = 0; i < init.length; i++) {
         this.set(init[i]);
      }
   }

   static parseJSON(jsonObject /*: BitSetJSON */) /*: BitSet */ {
      return Object.assign(new BitSet(0), jsonObject);
   }

   static intersection(a /*: BitSet */, b /*: BitSet */) {
      return (a.clone()).intersection(b);
   }

   intersection(other /*: BitSet */) /*: BitSet */ {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] & other.arr[i];
      }
      return this;
   }

   static union(a /*: BitSet */, b /*: BitSet */) /*: BitSet */ {
      return (a.clone()).union(b);
   }

   union(other /*: BitSet */) /*: BitSet */ {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] | other.arr[i];
      }
      return this;
   }

   static difference(a /*: BitSet */, b /*: BitSet */) /*: BitSet */ {
      return (a.clone()).difference(b);
   }

   difference(other /*: BitSet */) /*: BitSet */ {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] & (~ other.arr[i]);
      }
      return this;
   }

   complement() /*: BitSet */ {
      const mask = 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = (~ this.arr[i]) & mask;
      }
      return this;
   }

   clone() /*: BitSet */ {
      let other = new BitSet(this.len);
      for (let i = 0; i < this.arr.length; i++) {
	 other.arr[i] = this.arr[i];
      }
      return other;
   }

   clearAll() /*: BitSet */ {
      this.arr.fill(0);
      return this;
   }

   setAll() /*: BitSet */ {
      this.arr.fill(0xFFFFFFFF);
      this.arr[this.arr.length - 1] = 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      return this;
   }

   get(pos /*: number */) /*: number */ {
      return (this.arr[pos >>> 5] & (1 << (pos & 0x1F))) >>> (pos & 0x1F);
   }

   // accept an array too?
   set(pos /*: number */) /*: BitSet */ {
      this.arr[pos >>> 5] = (this.arr[pos >>> 5] | (1 << (pos & 0x1F))) >>> 0;
      return this;
   }

   clear(pos /*: number */) /*: BitSet */ {
      this.arr[pos >>> 5] &= ~(1 << (pos & 0x1F));
      return this;
   }

   isEmpty() /*: boolean */ {
      for (let i = 0; i < this.arr.length - 1; i++) {
	 if (this.arr[i] != 0) {
	    return false;
	 }
      };
      return (this.arr[this.arr.length - 1] & (0xFFFFFFFF >>> (0x20 - (this.len & 0x1F)))) == 0;
   }

   isSet(pos /*: number */) /*: boolean */ {
      return (this.arr[pos >>> 5] & (1 << (pos & 0x1F))) !== 0;
   }

   pop() /*: ?number */ {
      const first = this.first();
      if (first != undefined) {
         this.clear(first);
      }
      return first;
   }

   first() /*: ?number */ {
      for (let i = 0; i < this.arr.length; i++) {
         if (this.arr[i] != 0) {
            for (let j = i << 5; j < (i+1) << 5; j++) {
               if (this.isSet(j)) {
                  return j;
               }
            }
         }
      }

      return undefined;
   }

   equals(other /*: BitSet */) /*: boolean */ {
      if (this.len != other.len) {
         return false;
      }
      for (let i = 0; i < this.arr.length; i++) {
         if (this.arr[i] != other.arr[i]) {
            return false;
         }
      }
      return true;
   }

   popcount() /*: number */ {
      let count = 0;
      for (let i = 0; i < this.arr.length; i++) {
	 let v = this.arr[i];
	 v = v - ((v>>1) & 0x55555555);
	 v = (v & 0x33333333) + ((v>>2) & 0x33333333);
	 count += ((v + (v>>4) & 0xF0F0F0F) * 0x1010101) >> 24;
      };
      return count;
   }

   // contains: intersection == other
   contains(other /*: BitSet */) /*: boolean */ {
      for (let i = 0; i < this.arr.length; i++) {
	 if (((this.arr[i] & other.arr[i]) >>> 0) != (other.arr[i] >>> 0)) {
	    return false;
	 }
      };
      return true;
   }

   add(other /*: BitSet */) /*: BitSet */ {
      for (let i = 0; i < this.arr.length; i++) {
	 this.arr[i] |= other.arr[i];
      };
      return this;
   }

   subtract(other /*: BitSet */) /*: BitSet */ {
      for (let i = 0; i < this.arr.length; i++) {
	 this.arr[i] &= ~other.arr[i];
      };
      this.arr[this.arr.length - 1] &= 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      return this;
   }

   toArray() /*: Array<number> */ {
      let arr = [];
      for (let i = 0; i < this.len; i++) {
	 if (this.isSet(i)) {
	    arr.push(i);
	 }
      };
      return arr;
   }

   toString() /*: string */ {
      return this.toArray().toString();
   }

   toBitString() /*: string */ {
      let str = '';
      for (let i = 0; i < this.len; i++) {
	 if (i % 5 == 0)
	    str += ' ';
	 str += this.get(i);
      }
      return str;
   }

   toRepString(group /*: XMLGroup */) /*: string */ {
      return this.toArray().map(function (el) { return group.rep[el]; }).join(', ');
   }

   *allElements() /*: Generator<number, void, void> */ {
      let inx = 0;
      while (inx++ < this.len) {
         if (this.isSet(inx)) {
            yield inx;
         }
      }
   }
}
