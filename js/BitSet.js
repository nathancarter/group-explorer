/*
 * bitset as array of (32-bit) ints
 */

class BitSet {
   constructor (length, init) {
      this.len = length;
      this.arr = new Array(((length - 1) >>> 5) + 1);
      this.arr.fill(0);
      if (init !== undefined) {
	 for (let i = 0; i < init.length; i++) {
            this.set(init[i]);
	 }
      }
   }

   static intersection(a, b) {
      const intersect = new BitSet(a.len);
      for (let i = 0; i < a.arr.length; i++) {
         intersect.arr[i] = a.arr[i] & b.arr[i];
      }
      return intersect;
   }

   static union(a, b) {
      const union = new BitSet(a.len);
      for (let i = 0; i < a.arr.length; i++) {
         union.arr[i] = a.arr[i] | b.arr[i];
      }
      return union;
   }

   static difference(a, b) {
      const diff = new BitSet(a.len);
      for (let i = 0; i < a.arr.length; i++) {
         diff.arr[i] = a.arr[i] & (~ b.arr[i]);
      }
      return diff;
   }

   clone() {
      let other = new BitSet(this.len);
      for (let i = 0; i < this.arr.length; i++) {
	 other.arr[i] = this.arr[i];
      }
      return other;
   }

   clearAll() {
      this.arr.fill(0);
      return this;
   }

   setAll() {
      this.arr.fill(0xFFFFFFFF);
      this.arr[this.arr.length - 1] = 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      return this;
   }

   get(pos) {
      return (this.arr[pos >>> 5] & (1 << (pos & 0x1F))) >>> (pos & 0x1F);
   }

   set(pos) {
      this.arr[pos >>> 5] = (this.arr[pos >>> 5] | (1 << (pos & 0x1F))) >>> 0;
      return this;
   }

   clear(pos) {
      this.arr[pos >>> 5] &= ~(1 << (pos & 0x1F));
      return this;
   }

   isEmpty() {
      for (let i = 0; i < this.arr.length; i++) {
	 if (this.arr[i] != 0) {
	    return false;
	 }
      };
      return true;
   }

   isSet(pos) {
      return (this.arr[pos >>> 5] & (1 << (pos & 0x1F))) !== 0;
   }

   pop() {
      const first = this.first();
      if (first !== undefined) {
         this.clear(first);
      }
      return first;
   }

   first() {
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

   equals(other) {
      for (let i = 0; i < this.arr.length; i++) {
         if (this.arr[i] != other.arr[i]) {
            return false;
         }
      }
      return true;
   }

   popcount() {
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
   contains(other) {
      for (let i = 0; i < this.arr.length; i++) {
	 if (((this.arr[i] & other.arr[i]) >>> 0) != (other.arr[i] >>> 0)) {
	    return false;
	 }
      };
      return true;
   }

   add(other) {
      for (let i = 0; i < this.arr.length; i++) {
	 this.arr[i] |= other.arr[i];
      };
      return this;
   }

   subtract(other) {
      for (let i = 0; i < this.arr.length; i++) {
	 this.arr[i] &= ~other.arr[i];
      };
      this.arr[this.arr.length - 1] &= 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      return this;
   }

   toArray() {
      let arr = [];
      for (let i = 0; i < this.len; i++) {
	 if (this.isSet(i)) {
	    arr.push(i);
	 }
      };
      return arr;
   }

   toString() {
      return this.toArray().toString();
   }

   toBitString() {
      let str = '';
      for (let i = 0; i < this.len; i++) {
	 if (i % 5 == 0)
	    str += ' ';
	 str += this.get(i);
      }
      return str;
   }

   toRepString(group) {
      return this.toArray().map(function (el) { return group.rep[el]; }).join(', ');
   }

   *allElements() {
      let inx = 0;
      while (inx++ < this.len) {
         if (this.isSet(inx)) {
            yield inx;
         }
      }
   }

   [Symbol.iterator]() {
      const ref = this;
      return {
         inx: 0,
         bs: ref,
         next() {
            while (this.inx++ < this.bs.len) {
               if (this.bs.isSet(this.inx)) {
                  return { value: this.inx }
               }
            }
            return { done: true }
         }
      }
   }
}
