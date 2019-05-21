
/*
 * This file is compiled by the "make" process in the Group
 * Explorer project at https://github.com/nathancarter/group-explorer.
 * The resulting ge-lib.js file is not used by that project
 * directly, but is just a way for that project to wrapp all of
 * its most important JavaScript code into one file.  Then a
 * separate project (called "ge-lib") imports the latest version
 * of that file, installs several other useful utilities, and
 * packages it up for use as a node.js module.
 *
 * If you're reading this file in the Group Explorer repository,
 * know that it is not used here.  It is built here as part of
 * our build process, but then exported to another poject.
 * That project doesn't yet have its own public repository, but
 * when it does, we will put the link to it here.
 *
 * If you're reading this file in the ge-lib repository, know
 * that this file should NOT be edited in that repository.  It
 * is compiled as part of the Group Explorer build process, so
 * any changes to its content will need to take place by changing
 * source files in that repository, recompiling ge-lib.js, and
 * then re-importing it into the ge-lib project's repository.
 *
 * The ge-lib.js file is built from four files, in this order:
 *  1. js/ge-lib-preamble.js
 *     This declares several global variables that exist in the
 *     browser when running Group Explorer, without which much of
 *     its code will not make sense nor run.
 *  2. build/allGroupExplorer.js
 *     This is the concatenation of most of the code in the
 *     Group Explorer application.
 *  3. groupURLs.js
 *     This is the list of groups in the Group Explorer library
 *     on disk, assigned into a global JavaScript variable.
 *  4. js/ge-lib-endmatter.js
 *     This file copies into the module.exports object all of the
 *     Group Explorer classes and functions that should be
 *     exported by the ge-lib module.  It also tweaks how the
 *     Library object loads groups, to deal with the fact that
 *     it is not using the filesystem rather than AJAX requests.
 */

const LocalStorage = require( 'node-localstorage' ).LocalStorage;
localStorage = new LocalStorage( './tmp' );

const { JSDOM } = require( 'jsdom' );
const { window } = new JSDOM();
const { document } = ( new JSDOM( '' ) ).window;
global.document = document;

var $ = jQuery = require( 'jquery' )( window );

THREE = require( 'three' );
// not sure if adding these Array is an altogether good idea, but it's awfully useful
// at least make the new functions noticable by preceding them with an underscore
//   Alternatives:  move it?  delete it? turn it into a free-standing function somewhere?

// shallow comparison of one array to another
if (Array.prototype._equals === undefined) {
   Array.prototype._equals = function (other) {
      return Array.isArray(other) &&
             (this.length == other.length) &&
             this.every( (el,inx) => el == other[inx] );
   }
}

// recursive flatten of arrays-within-arrays structure
if (Array.prototype._flatten === undefined) {
   Array.prototype._flatten = function () {
      return this.reduce( (flattened, el) => {
         Array.isArray(el) ? flattened.push(...el._flatten()) : flattened.push(el);
         return flattened;
      }, [])
   }
}

// get last element of an array
if (Array.prototype._last === undefined) {
   Array.prototype._last = function () {
      return this[this.length - 1];
   }
}
// simple debug log function

class Log {
   static init(debug) {
      Log.debug = (debug === undefined) ? false : debug;
   }

   static log(msg) {
      if (Log.debug) {
         console.log(msg);
      }
   }
}

// initialize static properties
Log.init();
/*
 * bitset as array of (32-bit) ints
 */

class BitSet {
   constructor (length, init) {
      this.len = length;
      this.arr = new Array(length == 0 ? 0 : (((length - 1) >>> 5) + 1));
      this.arr.fill(0);
      if (init !== undefined) {
	 for (let i = 0; i < init.length; i++) {
            this.set(init[i]);
	 }
      }
   }

   static intersection(a, b) {
      return (a.clone()).intersection(b);
   }

   intersection(other) {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] & other.arr[i];
      }
      return this;
   }

   static union(a, b) {
      return (a.clone()).union(b);
   }

   union(other) {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] | other.arr[i];
      }
      return this;
   }

   static difference(a, b) {
      return (a.clone()).difference(b);
   }

   difference(other) {
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = this.arr[i] & (~ other.arr[i]);
      }
      return this;
   }

   complement() {
      const mask = 0xFFFFFFFF >>> (0x20 - (this.len & 0x1F));
      for (let i = 0; i < this.arr.length; i++) {
         this.arr[i] = (~ this.arr[i]) & mask;
      }
      return this;
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

   // accept an array too?
   set(pos) {
      this.arr[pos >>> 5] = (this.arr[pos >>> 5] | (1 << (pos & 0x1F))) >>> 0;
      return this;
   }

   clear(pos) {
      this.arr[pos >>> 5] &= ~(1 << (pos & 0x1F));
      return this;
   }

   isEmpty() {
      for (let i = 0; i < this.arr.length - 1; i++) {
	 if (this.arr[i] != 0) {
	    return false;
	 }
      };
      return (this.arr[this.arr.length - 1] & (0xFFFFFFFF >>> (0x20 - (this.len & 0x1F)))) == 0;
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

// math functions

class MathUtils {
   static init() {
      MathUtils.primeList =
         new BitSet(200, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41,
                          43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
                          101, 103, 107, 109, 113, 127, 131, 137, 139, 149,
                          151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199]);

      MathUtils.primePowerList =
         new BitSet(200, [2, 3, 4, 5, 7, 8, 9, 11, 13, 16, 17, 19, 23, 25, 27,
                          29, 31, 32, 37, 41, 43, 47, 49, 53, 59, 61, 64, 67,
                          71, 73, 79, 81, 83, 89, 97, 101, 103, 107, 109, 113,
                          121, 125, 127, 128, 131, 137, 139, 149, 151, 157, 163,
                          167, 169, 173, 179, 181, 191, 193, 197, 199]);
   }

   static isPrime(n) {
      return (n < 200) ? MathUtils.primeList.isSet(n) : MathUtils.getFactors(n).length == 1
   }

   static isPrimePower(n) {
      if (n < 200) {
         return MathUtils.primePowerList.isSet(n)
      } else {
         let factors = MathUtils.getFactors(n);
         return factors.every(el => el == factors[0]);
      }
   }

   static getFactors(n) {
      let lim = Math.ceil(Math.sqrt(n+1));
      for (let i = 2; i < lim; i++) {
         if (n % i == 0) {
            let fs = MathUtils.getFactors (n / i);
            fs.push(i);
            return fs;
         }
      }
      return [n];
   }
}

// initialize static properties
MathUtils.init();

/*
 * Class holds group defined only by a multiplication table
 */
/*
```js
*/
class BasicGroup {
   constructor (multtable) {
      if (multtable === undefined) return;

      this.multtable = multtable;
      this.setDerivedProperties();
   }

   setDerivedProperties() {
      this.order = this.multtable.length;
      this.elements = this.multtable[0];
      this.inverses = this.elements.map(el => this.multtable[el].indexOf(0));
      this.nonAbelianExample = this.findNonAbelianExample();
      this.isAbelian = (this.nonAbelianExample === undefined);
      [this.elementPowers, this.elementPrimePowers] = this.getElementPowers(this);
      this.elementOrders = this.elementPowers.map(el => el.popcount());
      this.isCyclic = this.elementOrders.some(el => el == this.order);
      this.orderClasses = this.getOrderClasses(this.elementOrders);
      this.conjugacyClasses = this.getConjugacyClasses(this.elements);
      this._isSolvable = undefined;
      this._subgroups = undefined;
      this._isSimple = undefined;
   }

   static parseJSON(jsonObject, _group) {
      const group = (_group === undefined) ? Object.assign(new BasicGroup, jsonObject) : _group;

      group.multtable = jsonObject.multtable;
      group.setDerivedProperties();

      if (group._subgroups !== undefined) {
         group._subgroups = jsonObject._subgroups.map(
            (el, inx) => {
               const subgroup = new Subgroup();
               subgroup.group = group;
               subgroup.generators =
                  Object.assign(new BitSet, jsonObject._subgroups[inx].generators);
               subgroup.members =
                  Object.assign(new BitSet, jsonObject._subgroups[inx].members);
               if (jsonObject._subgroups[inx].contains !== undefined) {
                  subgroup.contains =
                     Object.assign(new BitSet, jsonObject._subgroups[inx].contains);
                  subgroup.containedIn =
                     Object.assign(new BitSet, jsonObject._subgroups[inx].containedIn);
               }
               return subgroup;
            });
      }

      return group;
   }

   findNonAbelianExample() {
      for (let i = 1; i < this.order; i++) {
         for (let j = i; j < this.order; j++) {
            if (this.multtable[i][j] != this.multtable[j][i]) {
               return [i,j];
            }
         }
      }
   }

   // calculate subgroups on demand -- slows down initial load too much (still true?)
   get subgroups() {
      if (this._subgroups === undefined) {
         [this._subgroups, this._isSolvable] = SubgroupFinder.getSubgroups(this);
      }
      return this._subgroups;
   }

   get isSolvable() {
      if (this._isSolvable === undefined) {
         this.subgroups;
      }
      return this._isSolvable;
   }

   get isSimple() {
      if (this._isSimple === undefined) {
         this._isSimple =
            this.subgroups.length > 2 &&
            !this.subgroups.some(
               (el, inx) => this.isNormal(el) && inx != 0 && inx != (this.subgroups.length - 1) );
      }
      return this._isSimple;
   }

   get generators() {
      return [this.subgroups[this.subgroups.length-1].generators.toArray()];
   }

   get orderClassSizes() {
      if (this._orderClassSizes === undefined) {
         this._orderClassSizes =
            this.orderClasses
                .map(orderClass => orderClass.popcount())
                .filter(orderClassSize => orderClassSize !== undefined);
      }
      return this._orderClassSizes;
   }

   get conjClassSizes() {
      if (this._conjClassSizes === undefined) {
         this._conjClassSizes =
            this.conjugacyClasses
                .reduce( (bySize,cc) => { bySize[cc.popcount()]++; return bySize; },
                         new Array(this.order+1).fill(0) )
                .filter(el => el != 0);
      }
      return this._conjClassSizes;
   }

   get subgroupOrders() {
      if (this._subgroupOrders === undefined) {
         this._subgroupOrders =
            this.subgroups
                .map(subgroup => subgroup.members.popcount())
                .filter(subgroupOrder => subgroupOrder < this.order);
      }
      return this._subgroupOrders;
   }

   isNormal(subgroup) {
      if (this.isAbelian) {
         return true;
      }

      const conj =
         (a,b) => this.multtable[a][this.multtable[b][this.inverses[a]]];

      for (let g of this.generators[0]) {
         for (let h of subgroup.generators.toArray()) {
            if (! subgroup.members.isSet(conj(g, h))) {
               return false;
            }
         }
      }

      return true;
   }

   // takes bitset or array of generators; return bitset
   closure(generators) {
      const mult = (a, b) => this.multtable[a][b];
      const gens = Array.isArray(generators) ? generators.slice() : generators.toArray();
      const rslt = new BitSet(this.order).set(0);
      if (gens.length == 0) {
         return rslt;
      }
      const gensUsed = [gens.pop()];
      for (let g = gensUsed[0], s = g; g != 0; g = mult(g, s)) {
         rslt.set(g);
      }

      while (gens.length != 0) {
         gensUsed.push(gens.pop());
         const prevRslt = rslt.toArray();  // H_{i-1}
         const coset_reps = [0];
         for (const g of coset_reps) {
            for (const s of gensUsed) {
               const g_X_s = mult(g, s);
               if (!rslt.isSet(g_X_s)) {
                  coset_reps.push(g_X_s);
                  for (const h of prevRslt) { // H_{i-1} X (g X s)
                     rslt.set(mult(h, g_X_s));
                  }
               }
            }
         }
      }
      return rslt;
   }

   // needs fixing to work for general set of elements (not just entire group)
   getElementPowers(group) {
      const powers = [], primePowers = [];
      for (let g = 0; g < group.order; g++) {
         const elementPowers = new BitSet(group.order, [0]),
               elementPrimePowers = new BitSet(group.order);
         for (let i = 1, prevAcc = g, acc = g;
            prevAcc != 0;
            i++, prevAcc = acc, acc = group.multtable[g][acc]) {
            elementPowers.set(acc);
            if (MathUtils.isPrime(i)) {
               elementPrimePowers.set(acc);
            }
         }
         powers.push(elementPowers);
         primePowers.push(elementPrimePowers);
      }
      return [powers, primePowers];
   }

   // needs fixing to work for general set of elements (not just entire group)
   getOrderClasses(elementOrders) {
      const orderClasses = [];
      const groupOrder = this.order;
      elementOrders.forEach( (elementOrder, element) => {
         if ( orderClasses[elementOrder] === undefined ) {
            orderClasses[elementOrder] = new BitSet(groupOrder).set(element);
         } else {
            orderClasses[elementOrder].set(element);
         }});
      return orderClasses;
   }

   // creates conjugacy classes for element array, which may be the elements of a subgroup
   getConjugacyClasses(elements) {
      const conj =
         (a,b) => this.multtable[a][this.multtable[b][this.inverses[a]]];

      // create map with key:value where key is sum of values, value is array of bitsets
      const conjugacyClasses = new Map();

      outerLoop: for (let i = 0; i < elements.length; i++) {
         let conjugacyClass = new BitSet(this.order);
         for (let j = 0; j < elements.length; j++) {
            conjugacyClass.set(conj(elements[j],elements[i]));
         }
         // calculate key, add to Map
         let key = conjugacyClass.arr.reduce((sum,el) => sum + el, 0);
         if (conjugacyClasses.has(key)) {
            let vals = conjugacyClasses.get(key);
            for (let j = 0; j < vals.length; j++) {
               if (conjugacyClass.equals(vals[j])) {
                  continue outerLoop;
               }
            }
            vals.push(conjugacyClass);
            conjugacyClasses.set(key, vals);
         } else {
            conjugacyClasses.set(key, [conjugacyClass]);
         }
      }

      const result = [];
      conjugacyClasses.forEach(el => { result.push(...el) });

      return result.sort((a,b) => a.popcount() - b.popcount());
   }

   getCosets(subgroupBitset, isLeft) {
      const mult = isLeft ? (a,b) => this.multtable[a][b] : (a,b) => this.multtable[b][a];
      const cosets = [subgroupBitset];
      const todo = new BitSet(this.order).setAll().subtract(subgroupBitset);
      const subgroupArray = subgroupBitset.toArray();
      while (!todo.isEmpty()) {
         const g = todo.pop();
         const newCoset = new BitSet(this.order);
         subgroupArray.forEach( el => newCoset.set(mult(g,el)) );
         cosets.push(newCoset);
         todo.subtract(newCoset);
      }
      return cosets;
   }

   // assumes subgroup is normal
   getQuotientGroup(subgroupBitset) {
      const cosets = this.getCosets(subgroupBitset, true);
      const quotientOrder = cosets.length;
      const cosetReps = cosets.map( coset => coset.first() );
      const elementMap = [];
      for (let i = 0; i < cosets.length; i++) {
         for (const j of cosets[i].toArray()) {
            elementMap[j] = i;
         }
      }
      const newMult = cosets.map(_ => new Array(quotientOrder));
      for (let i = 0; i < quotientOrder; i++) {
         for (let j = 0; j < quotientOrder; j++) {
            const ii = cosetReps[i],
                  jj = cosetReps[j];
            newMult[i][j] = elementMap[this.multtable[ii][jj]];
         }
      }
      var result = new BasicGroup(newMult);
      result._cosetIndices = elementMap;
      return result;
   }

   // save generators in _loadedGenerators?
   getSubgroupAsGroup(subgroup) {
      const subgroupBitset = subgroup.members;
      const subgroupElements = subgroupBitset.toArray();
      const subgroupOrder = subgroupElements.length;
      const subgroupElementInverse = subgroupElements.reduce(
         (acc,el,inx) => { acc[el] = inx; return acc; }, new Array(this.order)
      );
      const newMult = subgroupElements.map(_ => new Array(subgroupOrder));
      for (let i = 0; i < subgroupOrder; i++) {
         for (let j = 0; j < subgroupOrder; j++) {
            newMult[i][j] = subgroupElementInverse[
               this.multtable[subgroupElements[i]][subgroupElements[j]]];
         }
      }
      var result = new BasicGroup(newMult);
      result._indexInParentGroup = subgroupElements;
      return result;
   }

   mult(a,b) {
      return this.multtable[a][b];
   }

   // returns closure of passed generators as an array of arrays of ...
   // generators may be passed as a bitset, array, or a single element
   closureArray(generators) {
      const deepMultiply = (array, factor, elementsUsed) => array.map( (el) => {
         if (Array.isArray(el)) {
            return deepMultiply(el, factor, elementsUsed);
         } else {
            const product = this.mult(el, factor);
            elementsUsed.set(product);
            return product;
         }
      } );

      const close = (remainingGens, elementsUsed, gensUsed) => {
         if (remainingGens.length == 1) {
            const generator = remainingGens.pop();
            const rslt = [0];
            for (let g = generator, s = g; g != 0; g = this.mult(g, s)) {
               rslt.push(g);
               elementsUsed.set(g);
            }
            gensUsed.push(generator);
            return rslt;
         } else {
            const generator = remainingGens.pop();
            const curr = [close(remainingGens, elementsUsed, gensUsed)];
            gensUsed.push(generator);
            const prevRslt = curr[0].slice();
            const cosetReps = [0];
            for (const g of cosetReps) {
               for (const s of gensUsed) {
                  const gXs = this.mult(g,s);
                  if (!elementsUsed.isSet(gXs)) {
                     cosetReps.push(gXs);
                     curr.push(deepMultiply(prevRslt, gXs, elementsUsed));
                  }
               }
            }
            return curr;
         }
      }

      const gens = ((typeof(generators) == 'object') ?
                    (Array.isArray(generators) ? generators.slice() : generators.toArray()) :
                    [generators]);

      return close(gens, new BitSet(this.order, [0]), []);
   }

   // calculates cosets of the passed group as an array of arrays
   // subgroup is passed as an instance of class Subgroup
   cosetsArray(subgroup, isLeft) {
      const mult = isLeft ? (a,b) => this.multtable[a][b] : (a,b) => this.multtable[b][a];
      const cosets = [subgroup];
      const cosetReps = [subgroup[0]];
      const todo = new BitSet(this.order, subgroup).complement();
      while (!todo.isEmpty()) {
         const g = todo.pop();
         cosetReps.push(g);
         const newCoset = subgroup.map( (el) => mult(g,el) );
         cosets.push(newCoset);
         todo.subtract(new BitSet(this.order, newCoset));
      }
      return cosets;
   }
}
/*
```
*/

/*
 * Class holds group info parsed from xml definition
 *
 * To turn to JSON:
 *      JSON.stringify(instance)
 * To create from JSON:
 *      Object.setPrototypeOf(JSON.parse(string), XMLGroup.prototype)
 *
 * Cayley diagrams are returned as {name, arrows, points} where
 *      arrows are element numbers
 *      points are [x,y,z] arrays
 *
 * Symmetry objects are returned as {name, operations, spheres, paths} where
 *      operations are {element, degrees, point}
 *      spheres are {radius, color, point}
 *      paths are {color, points}
 *      point(s) are [x,y,z] arrays
 */

class XMLGroup extends BasicGroup {
   constructor (text) {
      if (text === undefined) {
         super();
         return;
      }

      let $xml;
      if (typeof(text) == 'string') {
         // Replacing named entities with values ensure that later fragment parsing succeeds...
         const cleanText = text.replace(/&Zopf;/g, "&#8484;")
                               .replace(/&times;/g, "&#215;")
                               .replace(/&ltimes;/g, "&#8905;")
                               .replace(/&rtimes;/g, "&#8906;")
                               .replace(/<br.>/g, "&lt;br/&gt;");  // hack to read fgb notes
         $xml = $($.parseXML(cleanText));
      } else {
         $xml = $(text);
      }

      super(XMLGroup._multtable_from_xml($xml));

      this.$xml = $xml;
      this.name = $xml.find('name').first().html();
      this.gapname = $xml.find('gapname').first().html();
      this.gapid = $xml.find('gapid').first().html();
      this.shortName = $xml.find('name').first().attr('text');
      this.definition = $xml.find('definition').first().html();
      this.phrase = $xml.find('phrase').text();
      this.notes = $xml.find('notes').text();
      this.author = $xml.find('author').text();
      this._XML_generators = XMLGroup._generators_from_xml($xml);
      this.reps = XMLGroup._reps_from_xml($xml);
      this.representations = XMLGroup._representations_from_xml($xml);
      this.userRepresentations = [];
      /*
       * representations and userRepresentations are treated together as a contiguous array,
       *   and representationIndex is the index of the default representation into that virtual array
       *   (representationIndex is an integer and not an object reference so XMLGroup can be easily serialized)
       */
      this.representationIndex = 0;
      this.cayleyDiagrams = XMLGroup._cayley_diagrams_from_xml($xml);
      this.symmetryObjects = XMLGroup._symmetry_objects_from_xml($xml);
   }

   static parseJSON(jsonObject) {
      const defaultValues = [
         {name: 'name', value: '<mrow><mtext>Untitled Group</mtext></mrow>'},
         {name: 'shortName', value: 'Untitled Group'},
         {name: 'author', value: ''},
         {name: 'notes', value: ''},
         {name: 'phrase', value: ''},
         {name: 'representationIndex', value: 0},
         {name: 'cayleyDiagrams', value: []},
         {name: 'symmetryObjects', value: []},
      ];
      const group = BasicGroup.parseJSON(jsonObject, Object.assign(new XMLGroup, jsonObject));
      for (const {name, value} of defaultValues) {
         group[name] = (group[name] === undefined) ? value : group[name];
      }
      if ( group.representations === undefined ) {
         group.representations = [ [ ] ];
         for ( var i = 0 ; i < group.multtable.length ; i++ )
            group.representations[0].push( `<mn>${i}</mn>` );
      }
      return group;
   }

   toJSON () {
      return {
         name : this.name,
         shortName : this.shortName,
         author : this.author,
         notes : this.notes,
         phrase : this.phrase,
         representations : this.representations,
         representationIndex : this.representationIndex,
         cayleyDiagrams : this.cayleyDiagrams,
         symmetryObjects : this.symmetryObjects,
         multtable : this.multtable
      };
   }

   deleteUserRepresentation(userIndex) {
      const savedRepresentation =
         (userIndex + this.representations.length == this.representationIndex) ? this.representations[0] : this.representation;
      this.userRepresentations.splice(userIndex, 1);
      this.representation = savedRepresentation;
   }

   get representation() {
      if (this.representationIndex < this.representations.length) {
         return this.representations[this.representationIndex];
      } else if (this.representationIndex - this.representations.length < this.userRepresentations.length) {
         return this.userRepresentations[this.representationIndex - this.representations.length];
      } else {
         return this.representations[0];
      }
   }

   set representation(representation) {
      let inx = this.representations.findIndex( (el) => el == representation );
      if (inx >= 0) {
         this.representationIndex = inx;
      } else {
         inx = this.userRepresentations.findIndex( (el) => el == representation );
         if (inx >= 0) {
            this.representationIndex = inx + this.representations.length;
         }
      }
   }

   get rep() {
      return (this.representationIndex < this.representations.length) ? this.reps[this.representationIndex] : this.representation;
   }

   get labels() {
      if (this.representationIndex > this.representations.length) {
         return this.representation.map( (rep) => mathml2text(rep) );
      } else {
         if (this._labels === undefined) {
            this._labels = Array(this.representations.length)
         }
         if (this._labels[this.representationIndex] === undefined) {
            this._labels[this.representationIndex] = this.representation.map( (rep) => mathml2text(rep) );
         }
         return this._labels[this.representationIndex];
      }
   }

   get longestLabel() {
      return this.labels.reduce( (longest, label) => (label.length > longest.length) ? label : longest, '' );
   }

   get generators() {
      const calculatedGenerators = super.generators;
      if (this._XML_generators === undefined) {
         return calculatedGenerators;
      } else if (calculatedGenerators[0].length < this._XML_generators[0].length) {
         calculatedGenerators.push(...this._XML_generators);
         return calculatedGenerators;
      } else {
         return this._XML_generators;
      }
   }

   // returns short representations as array of arrays of strings (just debugging)
   static _reps_from_xml($xml) {
      return $xml.find('representation')
                 .map(function () { return this })
                 .toArray()
                 .map(function (el) {
                    return $(el).find('element')
                                .map(function () {
                                   return $(this).attr('text')
                                })
                                .toArray()
                 });
   }

   // returns representations as array of arrays of innerHTML elements
   static _representations_from_xml($xml) {
      return $xml.find('representation')
                 .map(function () { return this })
                 .toArray()
                 .map(function (el) {
                    return $(el).find('element')
                                .map(function () {
                                   return this.innerHTML
                                })
                                .toArray()
                 });
   }

   // returns <multtable> in [[],[]] format
   static _multtable_from_xml($xml) {
      return $xml.find('multtable > row')
                 .map(function (_, el) {
                    return [el
                       .textContent
                       .split(' ')
                       .filter(function (elm) { return elm.length != 0 })
                       .map(function (elm) { return parseInt(elm) })
                    ]
                 })
                 .toArray();
   }

   // returns generators specified in XML, not those derived in subgroup computation
   static _generators_from_xml($xml) {
      const result = $xml.find('generators')
                         .map(function () {
                            return [
                               this.attributes[0].value.split(' ')
                                   .map(function (el) { return parseInt(el) }) ]
                         })
                         .toArray();
      return result.length == 0 ? undefined : result;
   }

   // {name, arrows, points}
   // arrows are element numbers
   // points are [x,y,z] arrays
   static _cayley_diagrams_from_xml($xml) {
      let cayleyDiagrams = [];
      $xml.find('cayleydiagram').each(
         (_, cd) => {
            let name, arrows = [], points = [];
            name = $(cd).find('name').text();
            $(cd).find('arrow').each( (_, ar) => { arrows.push(ar.textContent) } );
            $(cd).find('point').each( (_, pt) => {
               let x = Number(pt.getAttribute('x')),
                   y = Number(pt.getAttribute('y')),
                   z = Number(pt.getAttribute('z'));
               points.push([x,y,z]);
            } );
            cayleyDiagrams.push({name: name, arrows: arrows, points: points});
         }
      )
      return cayleyDiagrams;
   }

   static _symmetry_objects_from_xml($xml) {
      let getPoint = function(pt) {
         return [Number(pt.getAttribute('x')), Number(pt.getAttribute('y')), Number(pt.getAttribute('z'))];
      };
      let symmetryObjects = [];
      $xml.find('symmetryobject').each(
         (_, so) => {
            let name = so.getAttribute('name'),
                operations = [],
                spheres = [],
                paths = [];
            $(so).find('operation').each(
               (_, op) => {
                  let element = op.getAttribute('element'),
                      degrees = op.getAttribute('degrees'),
                      point = getPoint(op.children[0]);
                  operations.push({element: element, degrees: degrees, point: point});
               }
            );
            $(so).find('sphere').each(
               (_, sp) => {
                  let radius = Number(sp.getAttribute('radius')),
                      color = sp.getAttribute('color'),
                      point = getPoint(sp.children[0]);
                  spheres.push({radius: radius, color: color, point: point});
               }
            );
            $(so).find('path').each(
               (_, pa) => {
                  let color = pa.getAttribute('color'),
                      points = [];
                  $(pa).find('point').each(
                     (_, pt) => {
                        points.push(getPoint(pt));
                     }
                  );
                  paths.push({color: color, points: points});
               }
            );
            symmetryObjects.push(
               {name: name, operations: operations, spheres: spheres, paths: paths}
            )
         }
      )
      return symmetryObjects;
   }
}

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
/*
 * Function returns subgroups of group as array of BitSets
 */

class SubgroupFinder {
   constructor (group) {
      this.group = group;
      this.z_generators = new BitSet(group.order);
      for (let i = 1; i < group.order; i++) {
         if (MathUtils.isPrimePower(group.elementOrders[i])) {
            this.z_generators.set(i);
         }
      }
   }

   static getSubgroups(group) {
      let allSubgroups,
          isSolvable = true,
          subGroupFinder = new SubgroupFinder(group);

      // special case cyclic groups, trivial group
      if (group.order == 1) {
         allSubgroups = [ new Subgroup(group, [0], [0]) ];
      } else if (MathUtils.isPrime(group.order)) {
         allSubgroups = [
            new Subgroup(group, [0], [0]),
            new Subgroup(group, [1]).setAllMembers(),
         ];
      } else {
         allSubgroups = subGroupFinder.findAllSubgroups();
      }

      allSubgroups.sort((a,b) => a.members.popcount() - b.members.popcount());
      const last_subgroup_found = allSubgroups[allSubgroups.length - 1];
      if (last_subgroup_found.members.popcount() != group.order) {
         isSolvable = false;
         // take generators from the next-smallest subgroup, add an element not in that group, and minimize generators
         const new_subgroup = new Subgroup(group, last_subgroup_found.generators.toArray()).setAllMembers();
         const new_element = BitSet.difference(new_subgroup.members, last_subgroup_found.members).first();
         subGroupFinder.minimizeGenerators(new_subgroup, new_element);
         allSubgroups.push(new_subgroup);
      }

      SubgroupFinder.addSubgroupLattice(allSubgroups);

      return [allSubgroups, isSolvable];
   }

   // Add subgroup containment lattice to subgroups
   // contains/containedIn are fields in the Sugroup object
   // of BitSets of indexes into the group.subgroups array
   // indicating subgroups immediately contained by/containing this subgroup
   static addSubgroupLattice(subgroups) {
      const numSubgroups = subgroups.length;

      // initialize contains, containedIn fields
      subgroups.forEach( (h) => {
         h.contains = new BitSet(numSubgroups);
         h.containedIn = new BitSet(numSubgroups);
      } )

      // Set fields to indirect as well as direct containment
      // Note the starting index of the inner loop: subgroups are ordered by increasing size,
      //   and containers are bigger than containees
      for (let containeeIndex = 0; containeeIndex < numSubgroups; containeeIndex++) {
         const containee = subgroups[containeeIndex];
         for (let containerIndex = containeeIndex + 1; containerIndex < numSubgroups; containerIndex++) {
            const container = subgroups[containerIndex];
            if (container.members.contains(containee.members)) {
               container.contains.set(containeeIndex);
               containee.containedIn.set(containerIndex);
            }
         }
      }

      // Clear indirect containment
      for (let containeeIndex = 0; containeeIndex < numSubgroups; containeeIndex++) {
         const containee = subgroups[containeeIndex];
         for (let containerIndex = containeeIndex + 1; containerIndex < numSubgroups; containerIndex++) {
            const container = subgroups[containerIndex];
            if (container.contains.isSet(containeeIndex)) {
               container.contains.subtract(containee.contains);
            }
         }
      }
   }


   findAllSubgroups() {
      const subgroups = [];

      let currLayer = [new Subgroup(this.group, [0], [0])];  // 0-th layer is trivial group
      for (;;) {
         let nextLayer = this.findNextLayer(currLayer);
         subgroups.push(...currLayer);
         if (nextLayer.length == 0) {
            break;
         }
         currLayer = nextLayer;
      }

      return subgroups;
   }

   /*
      Cyclic extension algorithm from
      "Fundamental Algorithms for Permutation Groups" by Greg Butler (1991)
    */
   findNextLayer(currLayer) {
      const nextLayer = [];

      for (let i = 0; i < currLayer.length; i++) {
         const currSubgroup = currLayer[i];
         const normalizer = this.findNormalizer(currSubgroup);
         const todo = BitSet.intersection(
            this.z_generators,
            BitSet.difference(normalizer.members, currSubgroup.members));
         for (let j = 0; j < nextLayer.length; j++) {
            if (nextLayer[j].members.contains(currSubgroup.members)) {
               todo.subtract(nextLayer[j].members);
            }
         }

         while (! todo.isEmpty()) {
            const g = todo.pop();
            if (! BitSet.intersection(this.group.elementPrimePowers[g],
                                      currSubgroup.members)
                        .isEmpty()) {
               let nextSubgroup = currSubgroup.clone();
               this.extendSubgroup(nextSubgroup, g);
               this.minimizeGenerators(nextSubgroup, g);
               nextLayer.push(nextSubgroup);
               todo.subtract(nextSubgroup.members);
            }
         }
      }

      return nextLayer;
   }

   /*
      Input: group G, subgroup U

      Output: normalizer H of U in G

      H = U
      gamma = G - H
      while gamma is not empty
      choose a g from gamma
      if g normalizes H then
      H = < H, g >
      gamma = gamma - H
      else
      gamma = gamma - (H x g)
      end if
      end while
    */
   findNormalizer(subgroup) {
      let normalizer = subgroup.clone(),
          todo = new BitSet(this.group.order).setAll().subtract(subgroup.members);

      while (! todo.isEmpty()) {
         let g = todo.pop();
         if (this.normalizes(subgroup, g)) {
            this.extendSubgroup(normalizer, g);
            todo.subtract(normalizer.members);
         } else {
            for (let i = 0; i < this.group.order; i++) {
               if (normalizer.members.isSet(i)) {
                  todo.clear(this.group.multtable[i][g]);
               }
            }
         }
      }

      return normalizer;
   }

   normalizes(subgroup, g) {
      const mult = (a,b) => this.group.multtable[a][b];
      const g_inverse = this.group.inverses[g];
      for (let i = 0; i < this.group.order; i++) {
         if (subgroup.generators.isSet(i)) {
            if (! subgroup.members.isSet(mult(mult(g, i), g_inverse))) {
               return false;
            }
         }
      }
      return true;
   }

   extendSubgroup(subgroup, normalizer) {
      const todo = this.group.elementPowers[normalizer];
      for (let i = 0; i < subgroup.members.len; i++) {
         if (subgroup.members.isSet(i)) {
            for (let j = 0; j < todo.len; j++) {
               if (todo.isSet(j)) {
                  subgroup.members.set(this.group.multtable[i][j]);
               }
            }
         }
      }
   }

   minimizeGenerators(subgroup, extension) {
      // 1) find an element that will generate what extension and an existing generator do now
      const generators = subgroup.generators.toArray();
      for (let i = 0; i < generators.length; i++) {
         const closure = this.group.closure([extension, generators[i]]);
         const order_classes = this.group.orderClasses[closure.popcount()];
         if (order_classes !== undefined) {
            const cyclic_generator =
               order_classes.toArray().find( (element) => this.group.elementPowers[element].equals(closure) );
            if (cyclic_generator !== undefined) {
               subgroup.generators
                       .clear(generators[i])
                       .set(cyclic_generator);
               return;
            }
         }
      }

      // 2) see if we can't remove one of the existing generators and still get the entire subgroup
      generators.push(extension);
      for (let i = 0; i < generators.length - 1; i++) {
         const gens = generators.slice();
         gens.splice(i,1);
         const closure = this.group.closure(gens);
         if (closure.equals(subgroup.members)) {
            subgroup.generators
                    .clear(generators[i])
                    .set(extension);
            return;
         }
      }

      subgroup.generators.set(extension);
      return;
   }
}

class IsomorphicGroups {
   static init() {
      if (IsomorphicGroups.map !== undefined) {
         return;
      }

      IsomorphicGroups.map = Library.getAllLocalGroups()
                                    .reduce(
                                       (map, group) => {
                                          if (!map.has(group.order)) {
                                             map.set(group.order, []);
                                          }
                                          map.get(group.order).push(group);
                                          return map;
                                       },
                                       new Map() );
   }

   static findForSubgroup(group, subgroup) {
      const subgroupAsGroup = group.getSubgroupAsGroup(subgroup);
      const isomorphicGroup = (group.order == subgroup.members.popcount()) ?
                              group :
                              IsomorphicGroups.find(subgroupAsGroup);
      return isomorphicGroup;
   }

   static find(G) {
      IsomorphicGroups.init();

      // check that groups of the right size are even in the map
      if (!IsomorphicGroups.map.has(G.order)) {
         return undefined;
      }

      // filter by candidate group properties, isomorphism
      return IsomorphicGroups.map
                             .get(G.order)
                             .filter( H => G.orderClassSizes._equals(H.orderClassSizes) )
                             // .filter( H => G.subgroupOrders._equals(H.subgroupOrders) )
                             // .filter( H => G.conjClassSizes._equals(H.conjClassSizes) )
                             .find( H => IsomorphicGroups.isomorphism(H, G) !== undefined );
   }

   // returns isomorphism from G to H, or undefined if none can be found
   static isomorphism(G, H) {
      if (G.order != H.order) {
         return undefined;
      }

      if (G.order == 1) {
         return [0];
      }

      // returns arrays of generators for H that match orders in req
      const matchingGenerators = function* (req, avail, _sel) {
         const sel = _sel === undefined ? [] : _sel;
         if (req.length == 0) {
            yield sel;
         } else if (!avail[req[0]].isEmpty()) {
            // pick one from avail according to order in req and add it to sel
            for (const el of avail[req[0]].allElements()) {
               const newReq = req.slice(1);
               const newAvail = avail.slice();
               newAvail[req[0]] = newAvail[req[0]].clone();
               const newSel = sel.slice();
               newSel.push(el);
               newAvail[req[0]].clear(el);
               yield *matchingGenerators(newReq, newAvail, newSel);
            }
         }
      }

      // ToDo: pick the G or H with fewer known generators
      //   or maybe lower gen*orderClassSize product?
      const G_gens = G.generators[0];
      const requiredOrders = G_gens.map(el => G.elementOrders[el]);
      const availableElements = H.elementOrders.reduce(
         (acc, order, el) => {
            if (acc[order] === undefined) {
               acc[order] = new BitSet(G.order);
            }
            acc[order].set(el);
            return acc;
         },
         []
      );

      bigLoop:
      for (const h_gens of matchingGenerators(requiredOrders, availableElements)) {
         const g_gens = G_gens.slice();

         // create map, add identity
         const g2h = new Array(G.order);
         g2h[0] = 0;

         // map generators
         g_gens.forEach( (_,inx) => g2h[g_gens[inx]] = h_gens[inx] );

         const rslt = new BitSet(G.order).set(0);

         const gensUsed = [g_gens.pop()];
         for (let g = gensUsed[0], s = g; g != 0; g = G.mult(g, s)) {
            rslt.set(g);
            g2h[G.mult(g, s)] = H.mult(g2h[g], g2h[s]);
         }

         let rsltArray = rslt.toArray();
         while (g_gens.length != 0) {
            gensUsed.push(g_gens.pop());
            const prevRslt = rslt.toArray();  // H_{i-1}
            const coset_reps = [0];
            for (const g of coset_reps) {
               for (const s of gensUsed) {
                  const gXs = G.mult(g, s);
                  g2h[G.mult(g, s)] = H.mult(g2h[g], g2h[s]);
                  if (!rslt.isSet(gXs)) {
                     coset_reps.push(gXs);
                     for (const h of prevRslt) { // H_{i-1} X (g X s)
                        rslt.set(G.mult(h, gXs));
                        rsltArray = rslt.toArray();
                        g2h[G.mult(h, gXs)] = H.mult(g2h[h], g2h[gXs]);
                     }
                  }
               }
            }
         }

         // check that g_gens really generates group
         if (rslt.popcount() != G.order) {
            continue bigLoop;
         }

         // check that g2h is a mapping
         if (!g2h.slice().sort( (a,b) => a - b )._equals(G.elements)) {
            continue bigLoop;
         }

         // check that mapping is a homomorphism
         for (const i of G.elements) {
            for (const j of G.elements) {
               if (g2h[G.mult(i, j)] != H.mult(g2h[i], g2h[j])) {
                  continue bigLoop;
               }
            }
         }

         return g2h;
      }

      return undefined;
   }

   // findEmbedding(G,H), with H a subgroup of G, returns a pair [H',f]
   // such that H' is in the groups library and f is an embedding of H'
   // into G and onto H.  f is stored as an array such that f[i] means f(i),
   // for all i in H'.  If this computation can't be done, return null.
   // The most common reason that this might fail is not having sufficient
   // groups loaded into the Library.  You may want to run a call to
   // Library.getAllLocalGroups() first.
   static findEmbedding ( G, H ) {
      const groupH = G.getSubgroupAsGroup( H ),
            libraryH = IsomorphicGroups.find( groupH );
      if ( !libraryH ) return null;
      const almostF = IsomorphicGroups.isomorphism( libraryH, groupH );
      if ( !almostF ) return null;
      return [ libraryH, almostF.map( elt => groupH._indexInParentGroup[elt] ) ];
   }

   // findQuotient(G,N), with N a normal subgroup of G, returns a pair [Q,q]
   // such that Q is in the groups library and q is an onto map from G to Q
   // with kernel K.  q is stored as an array such that q[i] means q(i),
   // for all i in G.  If this computation can't be done, return null.
   // The most common reason for failure would be passing a non-normal subgroup.
   // Alternatively, this might fail without enough groups loaded into the Library.
   // You may want to run a call to Library.getAllLocalGroups() first.
   static findQuotient ( G, N ) {
      if ( !G.isNormal( N ) ) return null;
      const groupQ = G.getQuotientGroup( N.members ),
            libraryQ = IsomorphicGroups.find( groupQ );
      if ( !libraryQ ) return null;
      const almostMap = IsomorphicGroups.isomorphism( groupQ, libraryQ );
      if ( !almostMap ) return null;
      return [ libraryQ, G.elements.map( elt => almostMap[groupQ._cosetIndices[elt]] ) ];
   }
}
/*
# Templates

Most of what appears on the screen in GE3 is dynamic HTML, created at runtime by javascript and formatted by CSS stylesheets. This is often the result of a complex combination of HTML, CSS, and javascript, and it can difficult to read the code behind a web page to understand how the displayed data is derived and how it will appear. Every GE3 web page uses this 'template' pattern (though it may use others, too), making a template from a section of HTML with placeholders in it to represent data values that are to be replaced at runtime. This approach makes it easier to separate the layout of the data from the code that generates it. In GE3 this is done on the client side by javascript using HTML5 template tags and ES6 template literals.

## Example

*(Note that example code may be simplified from the actual implementation.)*

The subset display panel in the visualizer pages provides a ready example. The format for a subgroup is given by a template tag like this, similar to those in [subsets.html](../subsetDisplay/subsets.html) (Note: &amp;#x27E8; and &amp;#x27E9; are entity numbers for mathematical left and right angle brackets, &#x27E8; and &#x27e9;.):

```html
<template id="subgroup_template">
   <li id="${this.id}">
      ${this.name} = &#x27E8; ${generators} &#x27E9; is a subgroup of ${subgroupOrder}
   </li>
</template>
```

To use the template it is retrieved with a jQuery call, its HTML extracted as a string, and the result turned into a string literal, as done in the [Template.js](#template-retrieval-caching) code below:

```js
'`' + $('template[id="subgroup_template"]').html() + '`'
```

When executed, `Template.HTML` produces the template contents as a string literal:

```js
`<li id="${this.id}">
     ${this.name} = &#x27E8; ${generators} &#x27E9; is a subgroup of order ${subgroupOrder}
 </li>`
```

Note the back ticks ` at the start and end of the string: this is an ES6 template literal.  When it is eval'd in a scope which has the referenced values defined, as excerpted from [SSD.Subgroups](../subsetDisplay/Subgroup.js):

```js
const generators = this.generators.toArray().map( el => MathML.sans(group.representation[el]) );
const subgroupOrder = this.subgroup.order;
const subgroupLine = eval(Template.HTML('subgroup_template');
```

The expressions enclosed by curly braces ${...} are evaluated and replaced in the string. At this point (for one of the subgroups of <i>D</i><sub>4</sub>), `subgroupLine` will be a string of HTML like the following (using an HTML equivalent of the actual MathML):

```html
<li id="1">
    <i>H<i><sub>1</sub> = &#x27E8; <i>r</i><sup>2</sup> &#x27E9; is a subgroup of order 2.
</li>
```

This can be appended to the list of subgroups in the DOM with a simple jQuery command

```js
$('#subgroups').append(subgroupLine)
```

to give the following line in the list of subgroups:

&nbsp;&nbsp;&nbsp;&nbsp;<i>H</i><sub>1</sub> = &#x27E8; <i>r</i><sup>2</sup> &#x27E9; is a subgroup of order 2.

While this example may seem too simple to provide much justification for introducing a sort of arcane use of HTML5 templates, in practice they get considerably more involved. There are quite a number of three-deep floating menus in `subsetDisplay`, for example.


## Template retrieval caching

Since template retrieval is done repeatedly, the actual template retrieval code caches results by template id in a class static variable, as you can see here: [Template.js](../js/Template.js).

```js
*/

/*
 * Caching template fetch --
 *   returns the html of template with id = templateId as a `string literal` for subsequent eval'ing
 *   returns the value undefined if template does not exist
 */

class Template {
   static HTML(templateId) {

      Template._map = (Template._map === undefined) ? new Map() : Template._map;

      if (!Template._map.has(templateId)) {
         const $template = $(`template[id="${templateId}"]`);
         Template._map.set(templateId,  ($template.length == 0) ? undefined : '`' + $template.html() + '`');
      };

      return Template._map.get(templateId);
   }
}

/*
```
 */
/*
 * Class manages group definitions stored in localStorage
 *
 * Group definitions are stored as JSON strings, keyed by
 *  the URL from which the group was fetched.  (Since there are other
 *  objects in the cache, it is assumed for now that the URL starts
 *  with the characters 'http' -- might have to re-visit this later.)
 *  The group objects created from these JSON strings are cached as
 *  key-value pairs in Library.map.
 *
 * Method overview:
 *   _initializeGroupMap -- initialize Library.map from localStorage
 *   _dataToGroup -- make group object from JSON string, XML string
 *   baseURL -- base URL from window.location.href
 *   clear -- delete all group definitions from Library.map and localStorage
 *   getAllLocalGroups -- return array of groups from Library.map/localStorage
 *   getAllLocalURLs -- return array of URLs from Library.map/localStorage
 *   getGroupOrDownload -- return Promise for group, resolved from localStorage if there
 *   getLatestGroup -- return Promise for current copy of group from server
 *   getLocalGroup -- return group from localStorage,
 *   isEmpty -- true if localStorage contains no groups
 *   loadFromURL -- get groupURL from window.location.href and return Promise to load it (see getGroupOrDownload)
 *   openWithGroupURL -- utility routine to window.open page with ?groupURL=... search string
 *   resolveURL -- get full URL
 *   saveGroup -- serialize and store group by URL in Libary.map/localStorage
 */

class Library {
   // initialize Library.map from localStorage
   //   called once after class is defined
   static _initializeGroupMap() {
      Library.map = new Map();
      const numGroups = localStorage.length;
      for (let inx = 0; inx < numGroups; inx++) {
         const key = localStorage.key(inx);
         if (key.startsWith('http')) {
            const group = Library._dataToGroup(localStorage.getItem(key));
            Library.map.set(key, group);
         }
      }
   }

   // convert JSON, XML data formats to group object
   //   uses pattern recognition for strings or, if presented with data from ajax call, content-type http header
   //   (note that ajax calls will already have created JSON objects and XML document fragments if indicated by content-type)
   static _dataToGroup(data, contentType) {
      let group = undefined;
      if (typeof(data) == 'string') {
         group = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data));
      } else if (contentType != undefined && contentType.includes('xml')) {
         group = new XMLGroup(data);
      } else if (contentType != undefined && contentType.includes('json')) {
         group = XMLGroup.parseJSON(data);
      }
      return group;
   }

   // get base URL from window.location.href
   //   (maybe we should eliminate the origin field, since all the data in localStorage is common origin?)
   static baseURL() {
      var baseURL;
      if ( typeof window !== "undefined" ) {
         // if running in the browser, extract the base URL from the window
         baseURL = new URL( window.location.href );
         baseURL = baseURL.origin + baseURL.pathname; // trim off search string
         baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      } else if ( typeof __dirname !== "undefined" ) {
         // if running in node.js, find the base dir of the repository
         baseURL = `file://${__dirname}/../`;
      } else {
         throw "No window or __dirname defined; cannot locate groups library.";
      }
      return baseURL;
   }

   // delete all group definitions from Library.map and localStorage
   static clear() {
      const libraryLength = localStorage.length;
      for (let inx = libraryLength-1; inx >= 0; inx--) {
         const key = localStorage.key(inx);
         if (key.startsWith('http')) {
            localStorage.removeItem(key);
            Library.map.delete(key);
         }
      }
   }

   // return array of groups from Library.map/localStorage (no server contact)
   static getAllLocalGroups() {
      return Array.from(Library.map.values());
   }

   // return array of group URLs from Library.map/localStorage
   static getAllLocalURLs() {
      return Array.from(Library.map.keys());
   }

   // returns Promise to get group from localStorage or, if not there, download it from server
   static getGroupOrDownload(url, baseURL) {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.map.get(groupURL);
      return new Promise( (resolve, reject) => {
         if (localGroup === undefined) {
            $.ajax({ url: groupURL,
                     success: (data, textStatus, jqXHR) => {
                        try {
                           if (jqXHR.status == 200) {
                              const remoteGroup = Library._dataToGroup(data, jqXHR.getResponseHeader('content-type'));
                              if (remoteGroup === undefined) {
                                 reject(`Error reading ${groupURL}: unknown data type`);
                              } else {
                                 remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified');
                                 remoteGroup.URL = groupURL;
                                 Library.saveGroup(remoteGroup);
                                 resolve(remoteGroup);
                              }
                           } else {
                              reject(`Error fetching ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status})`);
                           }
                        } catch (err) {
                           reject(`Error parsing ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                        }
                     },
                     error: (jqXHR, textStatus, err) => {
                        reject(`Error loading ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                     }
            });
         } else {
            resolve(localGroup);
         }
      } )
   }

   // replace latest group definition from server in local store and return group
   //   if a local copy exists, download only occurs if server last-modified time
   //   is more recent than that of local copy
   //   returns Promise to load group
   static getLatestGroup(url, baseURL) {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.map.get(groupURL);
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  headers: (localGroup === undefined) ? {} : {'if-modified-since': localGroup.lastModifiedOnServer},
                  success: (data, textStatus, jqXHR) => {
                     try {
                        if (jqXHR.status == 200) {
                           const remoteGroup = Library._dataToGroup(data, jqXHR.getResponseHeader('content-type'));
                           if (remoteGroup === undefined) {
                              reject(`Error reading ${groupURL}: unknown data type`);
                           } else {
                              remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified');
                              remoteGroup.URL = groupURL;
                              // need to copy notes, representation preferences from localGroup, if available
                              Library.saveGroup(remoteGroup);
                              resolve(remoteGroup);
                           }
                        } else if (jqXHR.status == 304) {
                           resolve(localGroup);
                        } else {
                           error_useLocalCopy(`Error fetching ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status})`);
                        }
                     } catch (err) {
                        error_useLocalCopy(`Error parsing ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                     }
                  },
                  error: (jqXHR, textStatus, err) => {
                     error_useLocalCopy(`Error loading ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                  }
         });
         // if there's a local copy available, just log error and satisfy call with local copy
         const error_useLocalCopy = (msg) => {
            if (localGroup === undefined) {
               reject(msg);
            } else {
               console.error(msg);
               resolve(localGroup);
            }
         }
      } )
   }

   // return locally stored copy of group from Library.map/localStorage
   static getLocalGroup(url, baseURL) {
      return Library.map.get(Library.resolveURL(url, baseURL));
   }

   // return 'true' if Library.map/localStorage contains no groups
   static isEmpty() {
      return Library.map.size == 0;
   }

   // get groupURL from page invocation and return promise for resolution from cache or download
   static loadFromURL() {
      const hrefURL = new URL(window.location.href);
      if (hrefURL.searchParams.get('groupURL') !== null) {
         return Library.getGroupOrDownload(hrefURL.searchParams.get('groupURL'));
      } else if (hrefURL.searchParams.get('waitForMessage') !== null) {
         return new Promise( (resolve, reject) => {
            /*
             * When this page is loaded in an iframe, the parent window can
             * indicate which group to load by passing the full JSON
             * definition of the group in a postMessage() call to this
             * window, with the format { type : 'load group', group : G },
             * where G is the JSON data in question.
             */
            addEventListener( 'message', function ( event ) {
               if (event.data.type == 'load group') {
                  try {
                     const group = Library._dataToGroup(event.data.group,'json');
                     Library.map.set(undefined, group);
                     resolve(group);
                  } catch (error) {
                     reject(error);
                  }
               }
            }, false );
         } );
      } else {
         alert('error in URL');
      }
   }

   // utility routine to open web page with "...?groupURL=..." with search string containing groupURL
   //   and options from {a: b, ...} included as '&a=b...',
   static openWithGroupURL(pageURL, groupURL, options = {}) {
      const url = `./${pageURL}?groupURL=${groupURL}` +
                  Object.keys(options).reduce( (url, option) => url + `&${option}=${options[option]}`, '');
      window.open(url);
   }

   // get resolved URL from part (e.g., if called from page invoked as
   //   resolveURL(../group-explorer/groups/Z_2.group) from page invoked as
   //   http://localhost/group-explorer/GroupInfo.html?groupURL=../group-explorer/groups/Z_2.group
   //   it returns http://localhost/group-explorer/groups/Z_2.group)
   static resolveURL(url, baseURL = Library.baseURL()) {
      return new URL(url, baseURL).href;
   }

   // serializes and stores group definition in Library.map/localStorage
   //   throws exception if storage quota is exceeded
   static saveGroup(group, key = group.URL) {
      localStorage.setItem(key, JSON.stringify(group));
      Library.map.set(key, group);
   }
}

Library._initializeGroupMap();
/*
# MathML utilities

Nearly all mathematical text in GE is formatted with MathML and rendered into HTML by MathJax. The MathML class has utility functions for some simple formatting patterns, converting MathML to Unicode text, and caching MathJax output to improve performance.

* [Formatting utilities](#formatting-utilities)

* [Transformation routines](#transformation-routines)

* [Caching](#caching)

* [Initialization](#initialization)

* [Legacy functions](#legacy-functions)
```js
*/
class MathML {
/*
```
## Formatting utilities
<i>(note: examples are HTML approximations to actual MathJax output)</i>

* sans -- format a MathML string in sans-serif font
    <br>&nbsp;&nbsp;`MathML.sans('<mtext>Linear in </mtext><mi>rf</mi>')` => "Linear in <i>rf</i>"
    + All identifiers (&lt;mi&gt; elements) are italicized, including multi-character identifiers.

* sub -- format two character strings as an identifier with a subscript
    <br>&nbsp;&nbsp;`MathML.sans(MathML.sub('CC','3'))` => "<i>CC</i><sub>3</sub>"
    + Arguments are not treated as MathML strings.

* csList -- format a list of MathML strings as a comma-separated list
    <br>&nbsp;&nbsp;`MathML.csList(['<mi>x</mi>', '<mn>3</mn>'])` =>  "<i>x</i>, 3"
    + The resulting list elements are separate top-level MathML constructs, separated by normal HTML. This allows the browser to re-flow the text instead of having MathJax do it.
    + This routine is used internally by setList and genList.

* setList -- format a list of MathML strings as a comma-separated list surrounded by {, } braces
    <br>&nbsp;&nbsp;`MathML.setList(['<mi>r</mi>', '<mi>f</mi>'])` => "{ <i>r</i>, <i>f</i> }"

* genList -- format a list of MathML strings as a comma-separated list surrounded by ⟨, ⟩ brackets
    <br>&nbsp;&nbsp;`MathML.genList(['<mi>r</mi>', '<mi>f</mi>'])` => "⟨ <i>r</i>, <i>f</i> ⟩"
    + Brackets are in bold because the normal font renders them lighter than other characters.

* rowList -- format a list of MathML strings as rows (a &lt;br&gt;-separated list)

```js
*/
    static sans(mathml) {
        mathml = mathml.replace(/<mi>/g, '<mi mathvariant="sans-serif-italic">');
        return '<math xmlns="http://www.w3.org/1998/Math/MathML" mathvariant="sans-serif">' + mathml + '</math>';
    }

    static sub(identifier, subscript) {
        return '<msub><mi>' + identifier + '</mi><mn>' + subscript + '</mn></msub>';
    }

    static csList(elements) {
        return elements
            .map( (el, inx) => MathML.sans(el) + (inx < elements.length-1 ? ',&nbsp;' : '') ).join('');
    }

    static setList(elements) {
        return MathML.sans('<mtext>{&nbsp;</mtext>') +
            MathML.csList(elements) +
            MathML.sans('<mtext>&nbsp;}</mtext>');
    }

    static genList(generators) {
        return MathML.sans('<mtext mathvariant="bold">&#x27E8;&nbsp;&nbsp;</mtext>') +
            MathML.csList(generators) +
            MathML.sans('<mtext mathvariant="bold">&nbsp;&nbsp;&#x27E9;</mtext>');
    }

    static rowList(elements) {
        return elements.map( (el, inx) => MathML.sans(el) + '<br>').join('');
    }
/*
```
## Transformation routines

These routines transform the subset of MathML used in GE .group XML files into HTML5 or Unicode text using XSLT. Only a small subset of MathML capability is used in these files, limited to subscripts and superscripts of signed numeric values.

* toHTML -- transform MathML into an HTML5 document fragment with &lt;sub&gt;...&lt;/sub&gt; and &lt;sup&gt;...&lt;/sup&gt; markup
    <br>&nbsp;&nbsp;`MathML.toHTML('<msub><mi>H</mi><mn>3</mn></msub>')` => `<i>H</i><sub>3</sub>` => "<i>H</i><sub>3</sub>"

* toUnicode -- transform MathML into Unicode text with numeric subscripts and superscripts
    <br>&nbsp;&nbsp;`MathML.toUnicode('<msub><mi>H</mi><mn>3</mn></msub>')` => "H₃"
    + Subscript and superscript characters are defined in `MathML.subscripts` and `MathML.superscripts`.

```js
*/
   static toHTML(mathml) {
       if (MathML.xsltProcessor === undefined) {
           MathML.xsltProcessor = new XSLTProcessor();
           MathML.xsltProcessor.importStylesheet($.parseXML(MathML.MATHML_2_HTML));
       }
       return MathML.xsltProcessor.transformToFragment($($.parseXML(mathml))[0], document);
   }

   static toUnicode(mathml) {
       const $html = $( MathML.toHTML(mathml) );

       $html.find('sub').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.subscripts[ch]).join('')) );
       $html.find('sup').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.superscripts[ch]).join('')));

       return $html.text();
   }
/*
```
## Caching

The subgroup display that is part of many of the visualizers takes a noticeable amount of time to format with MathJax, particularly since it occurs at the same time as the main graphic is being generated and because it must complete before the browser is fully responsive. Since many formatted elements are used repeatedly, caching the results of the formatting operation can be used to improve performance. The approach below is particularly suited to the visualizers' subset display and the diagram control panels.

The approach below has `MathML.sans` consult a cache of already formatted MathML elements and return the HTML generated by a previous MathJax run if a match is found. This HTML can be inserted into the DOM where a MathML expression would otherwise be put, where it needs no further MathJax processing to be displayed in its final form. The cache is initially loaded with the HTML generated by formatting all the element representations, all the subgroup names (<i>H</i><sub>0</sub>, <i>H</i><sub>1</sub>, etc.), all the subgroup orders, and a few static strings commonly used in the indicated displays. These contents are sufficient to generate the entire subgroup display, and show it immediately on construction. In the current implementation the cache is not modified after this initial load: most of the available performance improvements are realized by the choice of initial content, and this ensures that the cache doesn't grow without bound.

Since repeated use of formatted elements does not occur on all pages, use of the cache is optional. Without it every MathML element inserted in the DOM must be transformed by MathJax into HTML that the browser can render; with it, some of that HTML may simply be copied from the cache. In either case, however, the same formatting routines are used (`MathML.sans`, `MathML.sub`, etc.) and the same results are achieved. To enable the cache `MathML.preload` must be called to create and populate it. Since MathJax formatting is done asynchronously to the main javascript thread the cache is not immediately available on return from the call, so the method returns a Javascript `Promise`. The cache is available when the `then` clause executes. In the GE visualizer implementations this is done during the process of loading the page, after the group is loaded (the group is needed to load the cache), but before the subset display (which uses the cache) executes.

The implementation follows: The cache is a `Map` from MathML to the MathJax-generated HTML that the browser renders. The `preload` method places all the MathML representations, strings, etc. in a hidden &lt;div&gt; element, typesets it with MathJax, and on completion gathers the generated HTML into the cache and removes the hidden &lt;div&gt;. A few notes about the process:
* The dummy &lt;div&gt; has id="mathml-cache-preload".
* The &lt;div&gt; can't simply be hidden with `display: none`: MathJax won't size spaces like `<mspace width="0.3em"></mspace>` correctly, rendering permutation representations as `(123)` instead of `(1 2 3)`. In the implementation it's simply written beyond the bottom of the screen.
* The cache keys are derived from the `data-mathml` attributes of all the top-level spans generated by MathJax in the hidden &lt;div&gt; as follows:
   + Remove &lt;math...&gt;...&lt;/math&gt; tags.
   + Translate the entity '&amp;#xA0;' to the more commonly used named entity '&amp;nbsp;'. (This means that '&amp;nbsp;' should be used in MathML expressions, not '&amp;#xA0' or equivalent!)
* The cache values are determined by removing all the `.MJX_Assistive_MathML` spans (which aren't used in GE) and then recovering the outerHTML of every top-level span with a `data-mathml` attribute.

```js
*/
    static preload() {
       // dom fragment in which all MathML elements will be staged
       const $preload = $('<div id="mathml-cache-preload">');

       // cache all subgroup names, and find all subgroup orders
       const orderSet = new Set();
       for (let inx = 0; inx < group.subgroups.length; inx++) {
           $preload.append(MathML.sans(MathML.sub('H', inx)));
           orderSet.add(group.subgroups[inx].order);
       }

       // cache all subgroup orders as MathML numbers <mn>...</mn>
       orderSet.forEach( (el) => $preload.append(MathML.sans(`<mn>${el}</mn>`)) );

       // cache all element representations
       for (let inx = 0; inx < group.representations.length; inx++) {
           for (let jnx = 0; jnx < group.representations[inx].length; jnx++) {
               $preload.append(MathML.sans(group.representations[inx][jnx]));
           }
       }

       // static strings (in addition to previous data-dependent strings)
       const staticStrings = [
           // from subsetDisplay
           '<mtext>is a subgroup of order</mtext>',
           '<mtext>is the group itself.</mtext>',
           '<mtext>is the trivial subgroup</mtext>',
           '<mtext>{&nbsp;</mtext>',
           '<mtext>&nbsp;}</mtext>',
           '<mtext mathvariant="bold">&#x27E8;&nbsp;&nbsp;</mtext>',  // left math bracket, similar to <
           '<mtext mathvariant="bold">&nbsp;&nbsp;&#x27E9;</mtext>',  // right math bracket, similart to >

           // from diagramDisplay
           '<mtext>, a subgroup of order</mtext>',
       ];

       // cache static strings
       for (let inx = 0; inx < staticStrings.length; inx++) {
           $preload.append(MathML.sans(staticStrings[inx]));
       }

       // append fragment to document
       $preload.appendTo('html');

       // and typeset the MathML in the mathml-cache-preload
       return new Promise( (resolve, _reject) => {
           MathJax.Hub.Queue(
               ['Typeset', MathJax.Hub, 'mathml-cache-preload',
                () => {
                    // Create MathML.Cache, and replace MathML.sans function with version that checks it
                    MathML.Cache = new Map();
                    MathML.sans = (mathml_string) => {
                        const mathml = mathml_string.replace(/<mi>/g, '<mi mathvariant="sans-serif-italic">');
                        return MathML.Cache.get(mathml)
                            || '<math xmlns="http://www.w3.org/1998/Math/MathML" mathvariant="sans-serif">' + mathml + '</math>';
                    }

                    // Harvest keys, values from spans generated by MathJax
                    $('#mathml-cache-preload .MJX_Assistive_MathML').remove();
                    $('#mathml-cache-preload > [data-mathml]').each( (_, span) => {
                        const mathml = $(span).attr('data-mathml')
                              .replace(/<\/?math[^>]*>/g, '')     // remove <math...>, </math> tags
                              .replace(/&#xA0;/g, '&nbsp;');      // convert &#xA0; to query-appropriate &nbsp;
                              // .replace(/[ ]*\/>/g, '></mspace>'); // change <mspace.../> to <mspace...></mspace>
                        if (!MathML.Cache.has(mathml)) {
                            MathML.Cache.set(mathml, $(span).attr('fromCache', true)[0].outerHTML);
                        }
                    } )

                    // remove the hidden div and fulfill the Promise
                    $('#mathml-cache-preload').remove();
                    resolve();
                }]);
       });
   }
/*
```
## Initialization
The following items are created during initialization:
* `MathML.subscripts` and `MathML.superscripts` contain the Unicode characters for subscript and superscript numerals.
* `MathML.MATHML_2_HTML` contains XSLT code to transform the MathML subset used in GE into HTML.

```js
*/
   static _init() {
       // Unicode characters for numeric subscripts, superscripts
       MathML.subscripts =
           {0: '\u2080', 1: '\u2081', 2: '\u2082', 3: '\u2083', 4: '\u2084',
            5: '\u2085', 6: '\u2086', 7: '\u2087', 8: '\u2088', 9: '\u2089' };
       MathML.superscripts =
           {0: '\u2070', 1: '\u00B9', 2: '\u00B2', 3: '\u00B3', 4: '\u2074',
            5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079',
            '-': '\u207B'};

       // XSLT to transform MathML subset into HTML
       MathML.xsltProcessor = undefined;
       MathML.MATHML_2_HTML =
`<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

<xsl:template match="math">
   <xsl:apply-templates/>
</xsl:template>

<xsl:template match="mfenced">
   <xsl:value-of select="@open"/>
   <xsl:for-each select="./*">
      <xsl:apply-templates select="."/>
      <xsl:if test="position() != last()">
         <xsl:choose>
            <xsl:when test="../@separators">
               <xsl:value-of select="../@separators"/>
            </xsl:when>
            <xsl:otherwise>
               <xsl:text>,</xsl:text>
            </xsl:otherwise>
         </xsl:choose>
      </xsl:if>
   </xsl:for-each>
   <xsl:value-of select="@close"/>
</xsl:template>

<xsl:template match="msup">
   <xsl:apply-templates select="*[1]"/>
   <sup><xsl:apply-templates select="*[2]"/></sup>
</xsl:template>

<xsl:template match="msub">
   <xsl:apply-templates select="*[1]"/>
   <sub><xsl:apply-templates select="*[2]"/></sub>
</xsl:template>

<xsl:template match="mi">
   <i><xsl:value-of select="."/></i>
</xsl:template>

<xsl:template match="mn">
   <xsl:value-of select="."/>
</xsl:template>

<xsl:template match="mo">
   <xsl:if test=". != ',' and . != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
   <xsl:value-of select="."/>
   <xsl:if test=". != '(' and . != ')'"><xsl:text> </xsl:text></xsl:if>
</xsl:template>

<xsl:template match="mspace">
   <xsl:text> </xsl:text>
</xsl:template>

<xsl:template match="mtext">
   <xsl:value-of select="."/>
</xsl:template>

</xsl:stylesheet>
`;
   }

}

MathML._init();

/*
```
## Legacy functions

These functions are deprecated in favor of their MathML equivalents. They are retained to aid migration.

* math2text -- transforms the MathML subset used in GE into Unicode text with numeric subscripts and superscripts.

```js
*/
   const mathml2text = MathML.toUnicode;
/*
```
 */

class Menu {
   static setMenuLocations(event, $menu) {
      const menuBox = $menu[0].getBoundingClientRect();
      const menuHeight = menuBox.height;
      const windowHeight = 0.99*window.innerHeight;
      // set top edge so menu grows down until it sits on the bottom, up until it reaches the top
      if (menuHeight > windowHeight) {
         $menu.css({top: 0, height: windowHeight, 'overflow-y': 'auto'});    // too tall for window
      } else if (event.clientY + menuHeight > windowHeight) {
         $menu.css({top: windowHeight - menuHeight});    // won't fit below click
      } else {
         $menu.css({top: event.clientY});  // fits below click
      }

      // set left edge location so menu doesn't disappear to the right
      const menuWidth = menuBox.width;
      const windowWidth = window.innerWidth;
      if (event.clientX + menuWidth > windowWidth) {
         $menu.css({left: windowWidth - menuWidth});
      } else {
         $menu.css({left: event.clientX});
      }

      // similarly for submenus (but they also have to avoid covering the main menu)
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, subMenu) => Menu.setSubMenuLocation($menu, $(subMenu)) );
   }

   static setSubMenuLocation($menu, $subMenu) {
      const parentBox = $subMenu.parent()[0].getBoundingClientRect();
      const menuBox = $menu[0].getBoundingClientRect();
      const subMenuBox = $subMenu[0].getBoundingClientRect();
      const windowHeight = 0.99*window.innerHeight;
      const bottomRoom = windowHeight - (parentBox.top + subMenuBox.height);
      if (parentBox.top + subMenuBox.height < windowHeight) {  // subMenu can drop down from parent
         $subMenu.css({top: parentBox.top});
      } else if (subMenuBox.height < windowHeight) {  // subMenu fits in window, but not below parent
         $subMenu.css({top: windowHeight - subMenuBox.height});
      } else {  // subMenu doesn't fit in window
         $subMenu.css({top: 0, height: windowHeight, 'overflow-y': 'auto'})
      }

      const windowWidth = window.innerWidth;
      const rightRoom = windowWidth - (menuBox.right + subMenuBox.width);
      const leftRoom = menuBox.left - subMenuBox.width;
      const overlap = (subMenuBox.width - $subMenu.width())/2;
      if (rightRoom > 0) {
         $subMenu.css({left: menuBox.right - overlap});
      } else if (leftRoom > 0) {
         $subMenu.css({left: menuBox.left - subMenuBox.width + overlap});
      } else if (rightRoom > leftRoom) {
         $subMenu.css({left: window.width - subMenuBox.width});
      } else {
         $subMenu.css({left: 0});
      }

      $subMenu.children('li:has(span.menu-arrow)')
              .children('ul')
              .each( (_, subMenu) => Menu.setSubMenuLocation($subMenu, $(subMenu)) );
   }
}

/*
 * The functions in this script file define how Group Explorer
 * displays and lets users interact with GAP code throughout
 * the application.
 */

/*
 * We give access to live GAP execution online through the
 * Sage Cell Server, at the following URL.
 */
const SageCellURL = 'https://sagecell.sagemath.org/static/embedded_sagecell.js';
/*
 * Define a few text constants for use below.
 */
const showtext = 'Compute this in GAP \u25bc';
const hidetext = 'Hide GAP code \u25b2';
const GAPlink = '<a target="_blank" href="help/rf-um-gap">What is GAP?</a>';

/*
 * Any Group Explorer page can call this function after it has done all
 * the work of setting up the page, including such things as instantiating
 * templates.
 */
function setUpGAPCells () {
    // Import the Sage Cell script and wait until it has loaded.
    // Note that the sequence of calls here is very important;
    // we must create the script element, add it to the document,
    // add its load event listener, then set its src property.
    // Other sequences of these events do not do what you want.
    const script = document.createElement( 'script' );
    $( document.head ).append( script );
    script.addEventListener( 'load', () => {
        // Find all elements marked with the "gapcode" class
        // and process each one as follows.
        $( '.gapcode' ).each( function () {
            const $block = $( this );
            $block.css( { position : 'relative' } );
            // Create a button for revealing the GAP code in the block
            // and place it before the block.
            const $button = $( `<input type="button"/>` );
            $button.get(0).value = showtext;
            $button.css( { margin : '5px 0px 0px 10px' } );
            const $div = $( '<div></div>' );
            $div.append( $button );
            $div.insertBefore( $block );
            // Hide the code, then let the user use the button
            // to show the code and/or hide it again.
            $block.hide();
            $button.on( 'click', event => {
                if ( $button.get(0).value == showtext ) {
                    $block.show();
                    $button.get(0).value = hidetext;
                } else {
                    $block.hide();
                    $button.get(0).value = showtext;
                }
            } );
            // For each .gapcode element, do any pre-processing necessary
            // to generate the code and properties it's supposed to have.
            prepareGAPCodeBlock( this );
            // While the block is hidden, have the Sage Cell script
            // replace it with an editor and Run button that can send
            // the code to the Sage Cell Server for execution.
            sagecell.makeSagecell( {
                inputLocation : $block.get(0),
                evalButtonText : 'Run',
                languages : [ 'gap' ],
                hide : [ 'language', 'fullScreen' ],
                callback : () => {
                    // Style it so that it's obviously separate from
                    // the surrounding content.
                    $block.css( {
                        border : '3px solid blue',
                        borderRadius : '10px',
                        padding : '10px',
                        margin : '0px 10px 10px 10px'
                    } );
                    // Add a heading
                    var heading = 'GAP code';
                    if ( this.dataset.purpose )
                        heading += ' for ' + this.dataset.purpose;
                    const $hdr = $( `<h2>${heading}</h2>` );
                    $hdr.css( { marginTop : 0, marginBottom : '10px' } );
                    $block.prepend( $hdr );
                    // Add a link to the GE help page on GAP integration
                    const $whatIsGAP = $( `<p>${GAPlink}</p>` );
                    $whatIsGAP.css( {
                        position : 'absolute',
                        right : 0,
                        top : 0,
                        margin : '10px',
                        fontSize : '0.7em'
                    } );
                    $block.prepend( $whatIsGAP );
                }
            } );
        } );
    } );
    // Assign the script's src attribute last, as documented at the top.
    script.src = SageCellURL;
}

/*
 * For now, this function is a stub.
 * More later.
 */
function prepareGAPCodeBlock ( elt ) {
    /*
     * Declare some private functions
     */

    // converting an arbitrary string to a JS identifier (not injective)
    function toIdent ( str ) {
        if ( !/^[a-zA-Z_]/.test( str ) ) str = '_' + str;
        return str.replace( /[^a-zA-Z0-9_]/g, '' );
    }
    // convert a permutation represented as \sigma(i)=array[i]
    // into cycle notation as an array of arrays
    function cycleNotation ( array ) {
        var todo = array.map( ( _, index ) => index );
        var result = [ ];
        while ( todo.length > 0 ) {
            var start = todo[0];
            var cycle = [ ];
            for ( var walk = start ; todo.indexOf( walk ) > -1 ; walk = array[walk] ) {
                cycle.push( walk );
                const index = todo.indexOf( walk );
                todo.splice( index, 1 );
            }
            if ( cycle.length > 1 ) result.push( cycle );
        }
        return result;
    }
    // converting an arbitrary group element to a GAP permutation
    function toGAPPerm ( G, g ) {
        return cycleNotation( G.elements.map( e => G.mult( e, g ) ) ).map( cycle =>
            `(${cycle.map( i => i+1 ).join( ',' )})` ).join( '' );
    }
    // create a GAP code string that will construct the group
    function GAPConstructor ( G ) {
        if ( G.order == 1 ) return 'Group( [ () ] )';
        const gens = G.generators[0].map( gen => toGAPPerm( G, gen ) );
        return `Group( [ ${gens.join( ', ' )} ] )`;
    }
    // fill the DIV with text, removing indentation that was here only for
    // making the code look pretty in this file
    function setCode ( code ) {
        const lines = code.split( '\n' );
        while ( /^\s*$/.test( lines[0] ) ) lines.shift();
        while ( /^\s*$/.test( lines[lines.length-1] ) ) lines.pop();
        const indents = lines.map( line =>
            /\S/.test( line ) ? /\S/.exec( line ).index : null
        ).filter( x => x !== null );
        const minIndent = indents.reduce( ( a, b ) => Math.min( a, b ) );
        elt.textContent =
            lines.map( line => line.substr( minIndent ) ).join( '\n' );
    }

    /*
     * Now consider each type of code we know how to generate.
     */
    const G = toIdent( group.shortName );
    // const gens = group.generators[0].map( gen => toGAPPerm( group, gen ) );
    const [ ord, idx ] = group.gapid.split( ',' );
    const gpdef = `SmallGroup( ${ord}, ${idx} )`;
    // window.DUMP = function () {
    //     var strs = [ ];
    //     [...Library.map.keys()].sort().map( ( key ) => {
    //         const G = Library.map.get( key );
    //         const Gname = toIdent( G.shortName );
    //         strs.push( `Print( "${key}\\n" );;` );
    //         strs.push( `tmp := IdGroup( ${GAPConstructor( G )} );;` );
    //         strs.push( `Print( "    <gapid>", tmp[1], ",", tmp[2], "</gapid>\\n" );;` );
    //         strs.push( `tmp := SmallGroup( tmp[1], tmp[2] );;` );
    //         strs.push( `Print( "    <gapname>", StructureDescription( tmp ), "</gapname>\\n" );;` );
    //     } );
    //     console.log( strs.join( '\n' ) );
    // };
    const goal = elt.dataset.builtInCodeType;
    if ( goal == 'create group' ) {
        setCode( `
            # In GAP's Small Groups library, of all the groups
            # of order ${ord}, this one is number ${idx}:
            ${G} := ${gpdef};
        ` );
        elt.dataset.purpose = 'creating this group';
    } else if ( goal == 'is abelian' ) {
        var code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is abelian:
            IsAbelian( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( !group.isAbelian ) code += `
        //     # Ask for example elements that do not commute:
        //     a := First( ${G}, a -> ForAny( ${G}, b -> a*b <> b*a ) );
        //     b := First( ${G}, b -> a*b <> b*a );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is abelian';
    } else if ( goal == 'class equation' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Get the sizes of all conjugacy classes:
            List( ConjugacyClasses( ${G} ), Size );
        ` );
        elt.dataset.purpose = 'computing the numbers in a class equation';
    } else if ( goal == 'is cyclic' ) {
        var code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is cyclic:
            IsCyclic( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( group.isCyclic ) code += `
        //     # Ask for an element that generates the group:
        //     First( ${G}, g -> Order( g ) = Order( ${G} ) );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is cyclic';
    } else if ( goal == 'all subgroups' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask for the list of subgroups:
            AllSubgroups( ${G} );
        ` );
        elt.dataset.purpose = 'getting the list of all subgroups of a group';
    } else if ( goal == 'is normal' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Pick a random subgroup as an example:
            S := Random( AllSubgroups( ${G} ) );

            # Ask whether it is normal:
            IsNormal( ${G}, S );
        ` );
        elt.dataset.purpose = 'checking whether a subgroup is normal';
    } else if ( goal == 'subgroup lattice' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask for the lattice of subgroups:
            LatticeSubgroups( ${G} );

            # (See the GAP manual for how to manipulate the resulting object.)
        ` );
        elt.dataset.purpose = 'getting the lattice of subgroups of a group';
    } else if ( goal == 'is simple' ) {
        var code = `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is simple:
            IsSimple( ${G} );
        `;
        //// omitting this because the name means nothing in GE
        // if ( !group.isSimple ) code += `
        //     # Ask for a normal subgroup:
        //     First( AllSubgroups( ${G} ), S -> IsNormal( ${G}, S ) );
        //     `;
        setCode( code );
        elt.dataset.purpose = 'checking if a group is simple';
    } else if ( goal == 'order classes' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Compute all element orders and make a set of those results:
            Set( ${G}, Order );
        ` );
        elt.dataset.purpose = 'computing how many order classes a group has';
    } else if ( goal == 'is solvable' ) {
        setCode( `
            # Create the group:
            ${G} := ${gpdef};;

            # Ask if it is solvable:
            IsSolvable( ${G} );
        ` );
        elt.dataset.purpose = 'checking if a group is solvable';
    } else if ( goal == 'all computed properties' ) {
        if ( group.isCyclic ) code += `
            # Is it decomposable as a product of smaller cyclic groups?
            # (That is, are there relatively prime n,m with n*m=${group.order}?)
            First( [2..Size(G)-1], n -> Gcd(n,Size(G)/n) = 1 );
            `;
        setCode( code );
        elt.dataset.purpose = 'computing group properties';
    } else {
        console.log( 'Would not prepare this:', elt );
    }
}

/*
 * Structure used to describe Cayley diagram, symmetry object to DrawDiagram
 */

class Diagram3D {
   constructor(group, nodes = [], lines = [], options) {
      this.group = group;
      this.nodes = nodes;
      this.lines = lines;
      this.chunk = undefined;   // subgroup index for chunking
      this._right_multiplication = true;
      this.node_labels = group.representation;
      this.background = undefined;
      this.zoomLevel = 1;
      this.lineWidth = 7;
      this.nodeScale = 1;
      this.fogLevel = 0;
      this.labelSize = 1;
      this.arrowheadPlacement = 1;

      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }

   setNodeColor(color) {
      this._setNodeField('color', this.nodes.map( (node) => node.element ), color);
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setNodeLabels(labels = this.node_labels) {
      this.node_labels = labels;
      if (this.node_labels !== undefined) {
         this.nodes.forEach( (nd) => nd.label = this.node_labels[nd.element] );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   arrowMult(a,b) {
      return this._right_multiplication ? this.group.mult(a,b) : this.group.mult(b,a);
   }

   // set multiplication direction; change lines when changing direction
   set right_multiplication(right_multiplication) {
      if (this._right_multiplication != right_multiplication) {
         this._right_multiplication = right_multiplication;
         this.lines.forEach( (line) => {
            if (line.vertices.length == 2) {
               const product =   this.arrowMult(line.vertices[0].element, line.arrow);
               line.vertices[1] = this.nodes[product];
            }
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   // add a line from each element to arrow*element; set arrow in line
   // if arrow is Array, add all lines
   addLines(arrow) {
      this.group.elements.forEach( (el) => {
         const product = this.arrowMult(el, arrow);
         if (el == this.arrowMult(product, arrow)) {  // no arrows if bi-directional
            if (el < product) {  // don't add 2nd line if bi-directional
               this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]],
                                                  {arrow: arrow, arrowhead: false, style: this.nodes[arrow].lineStyle}))
            }
         } else {
            this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]],
                                               {arrow: arrow, arrowhead: true, style: this.nodes[arrow].lineStyle}))
         }
      } )
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   // remove all lines with indicated arrow; if arrow is undefined, remove all lines
   removeLines(arrow) {
      this.lines = (arrow === undefined) ? [] : this.lines.filter( (line) => line.arrow != arrow );
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setLineColors() {
      const arrows = this.lines.map( x => x.arrow )
         .filter( ( v, i, s ) => s.indexOf( v ) === i ); // incl. each only 1x
      const colors = this.arrowColors
                  || Array.from({length: arrows.length},
                                (_, inx) => '#' + new THREE.Color(`hsl(${360*inx/arrows.length}, 100%, 20%)`).getHexString());
      this.lines.forEach( (line) => line.color = colors[arrows.indexOf( line.arrow )] );
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   deDupAndSetArrows() {
      const hash = (point) => (((10 + point.x)*10 + point.y)*10 + point.z)*10;
      const linesByEndpoints = new Map();
      this.lines.forEach( (line) => {
         const start = hash(line.vertices[0].point);
         const end = hash(line.vertices[1].point);
         const forwardHash = 100000*start + end;
         const reverseHash = 100000*end + start;
         if (linesByEndpoints.has(reverseHash)) {
            linesByEndpoints.get(reverseHash).arrowhead = false;
         } else {
            line.arrowhead = true;
            linesByEndpoints.set(forwardHash, line);
         }
      } );
      this.lines = Array.from(linesByEndpoints.values());
      if ( this.emitStateChange ) this.emitStateChange();
   }

   // Normalize scene: translate to centroid, radius = 1
   normalize() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      const scale = (squaredRadius == 0) ? 1 : 1/Math.sqrt(squaredRadius);  // in case there's only one element
      const translation_transform = (new THREE.Matrix4()).makeTranslation(...centroid.multiplyScalar(-1).toArray());
      const xForm = (new THREE.Matrix4()).makeScale(scale, scale, scale).multiply(translation_transform);

      this.nodes.forEach( (node) => node.point.applyMatrix4(xForm) );
      this.lines.forEach( (line) => line.vertices
                                        .forEach( (vertex) => {
                                           if (vertex.element === undefined) {
                                              vertex.point.applyMatrix4(xForm)
                                           }
                                        } ) );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   get radius() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      return (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
   }

   _setNodeField(field, nodes, value) {
      nodes.forEach( (node) => this.nodes[node][field] = value );
   }

   highlightByNodeColor(elements) {
      this._setNodeField('colorHighlight', group.elements, undefined);
      elements.forEach( (els, colorIndex) => {
         const hue = 360 * colorIndex / elements.length;
         const color = `hsl(${hue}, 53%, 30%)`;
         this._setNodeField('colorHighlight', els, color);
      } );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   highlightByRingAroundNode(elements) {
      this._setNodeField('ringHighlight', group.elements, undefined);
      if (elements.length == 1) {
         this._setNodeField('ringHighlight', elements[0], 'hsl(120, 53%, 30%)');
      } else {
         elements.forEach( (els, colorIndex) => {
            const hue = 360 * colorIndex / elements.length;
            const color = `hsl(${hue}, 53%, 30%)`;
            this._setNodeField('ringHighlight', els, color);
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
   }

   highlightBySquareAroundNode(elements) {
      this._setNodeField('squareHighlight', group.elements, undefined);
      if (elements.length == 1) {
         this._setNodeField('squareHighlight', elements[0], 'hsl(240, 53%, 30%)');
      } else {
         elements.forEach( (els, colorIndex) => {
            const hue = 360 * colorIndex / elements.length;
            const color = `hsl(${hue}, 53%, 30%)`;
            this._setNodeField('squareHighlight', els, color);
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
   }

   clearHighlights() {
      this._setNodeField('colorHighlight', group.elements, undefined);
      this._setNodeField('ringHighlight', group.elements, undefined);
      this._setNodeField('squareHighlight', group.elements, undefined);
      if ( this.emitStateChange ) this.emitStateChange();
   }
}


Diagram3D.STRAIGHT = 0;
Diagram3D.CURVED = 1;

Diagram3D.Point = class Point {
   constructor(point) {
      if (point === undefined) {
         this.point = new THREE.Vector3(0, 0, 0);
      } else if (Array.isArray(point)) {
         this.point = new THREE.Vector3(...point);
      } else {
         this.point = point;
      }
   }
}

/*
 * Node extends point with information about the sphere drawn at this 3D location.
 * Values not used are 'undefined'.
 *   element: group element associated with this node
 *   color: this node's color, if different from the parent diagram's default color
 *   label: label drawn next to node (element label)
 *   radius: radius of the sphere drawn at this location
 *   lineStyle: line style generated by the element at this node
 * Highlight information is kept separate to support 'clear all highlighting' function
 *   colorHighlight: highlight node with this color
 *   ringHighlight: draw ring of this color around node
 *   squareHighlight: draw square of this color around node
 */
Diagram3D.Node = class Node extends Diagram3D.Point {
   constructor(element, point, options) {
      super(point);
      this.element = element;
      this.color = 0xDDDDDD;
      this.label = '';
      this.radius = undefined;
      this.lineStyle = Diagram3D.STRAIGHT;
      this.colorHighlight = undefined;
      this.ringHighlight = undefined;
      this.squareHighlight = undefined;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }
}

Diagram3D.Line = class Line {
   constructor(vertices, options) {
      this.vertices = vertices;
      this.color = undefined;
      this.arrowhead = true;
      this.arrow = undefined;
      this.offset = undefined;
      this.style = Diagram3D.STRAIGHT;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
   }

   get length() {
      const [length, _] = this.vertices.reduce( ([length, prev], vertex) => {
         if (prev === undefined) {
            return [length, vertex];
         } else {
            return [length + prev.point.distanceTo(vertex.point), vertex];
         }
      }, [0, undefined] );
      return length;
   }
}
/*
 * ToDo:  disable when chunking
 */
class DiagramDnD {
   constructor(displayDiagram) {
      this.displayDiagram = displayDiagram;
      this.canvas = displayDiagram.renderer.domElement;
      this.mouse = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.linePrecision = 0.01;
      this.event_handler = (event) => this.eventHandler(event);
      this.repaint_poller = undefined;
      this.repaint_request = undefined;
      this.object = undefined;

      $(displayDiagram.renderer.domElement).on('mousedown', this.event_handler);
   }

   eventHandler(event) {
      if (!event.shiftKey) {
         return;
      }

      event.preventDefault();
      event.stopPropagation();

      const bounding_box = this.canvas.getBoundingClientRect();
      this.mouse.x = ( (event.clientX - bounding_box.x) / this.canvas.width) * 2 - 1;
      this.mouse.y = -( (event.clientY - bounding_box.y) / this.canvas.height) * 2 + 1;

      switch (event.type) {
         case 'mousedown':  this.dragStart(event);  break;
         case 'mousemove':  this.dragOver(event);   break;
         case 'mouseup':    this.drop(event);       break;
      }
   }

   // start drag-and-drop; see if we've found a line
   dragStart(event) {
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.mouse, this.displayDiagram.camera);

      // temporarily change the width of the lines to 1 for raycasting -- doesn't seem to work with meshLines (sigh)
      // (this change is never rendered, so user never sees it)
      const saved_width = this.displayDiagram.scene.userData.lineWidth;
      this.displayDiagram.scene.userData.lineWidth = 1;
      this.displayDiagram.updateLines(this.displayDiagram.scene.userData);

      // calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects(
         this.displayDiagram.getGroup("lines").children.concat(this.displayDiagram.getGroup("spheres").children), false);

      // now change the line width back
      this.displayDiagram.scene.userData.lineWidth = saved_width;
      this.displayDiagram.updateLines(this.displayDiagram.scene.userData);

      // if empty intersect just return
      if (intersects.length == 0) {
         return;
      }

      // found an object (line or sphere); squirrel it away and wait for further dnd events
      this.object = intersects[0].object;
      $(this.canvas).off('mousemove', this.event_handler).on('mousemove', this.event_handler);
      $(this.canvas).off('mouseup', this.event_handler).on('mouseup', this.event_handler);

      // change cursor to grab
      this.canvas.style.cursor = 'move';

      this.repaint_poller = window.setInterval(() => this.repaintPoller(), 100);
   }

   dragOver(event) {
      this.repaint_request = (this.repaint_request === undefined) ? performance.now() : this.repaint_request;
   }

   drop(event) {
      this.repaint();
      this.endDrag(event);
   }

   endDrag(event) {
      $(this.canvas).off('mousemove', this.event_handler);
      $(this.canvas).off('mouseup', this.event_handler);
      this.canvas.style.cursor = '';
      window.clearInterval(this.repaint_poller);
      this.repaint_poller = undefined;
      this.object = undefined;
   }

   repaintPoller() {
      if (performance.now() - this.repaint_request > 100) {
         this.repaint();
      }
   }

   // update line to run through current mouse position
   repaint() {
      // get ray through mouse
      this.raycaster.setFromCamera(this.mouse, this.displayDiagram.camera);

      if (this.object.type == 'Line') {
         this.repaintLine();
      } else if (this.object.type == 'Mesh') {
         this.repaintSphere();
      }

      // clear repaint request
      this.repaint_request = undefined;
   }

   repaintLine() {
      // get intersection of ray with plane of line (through start, end, center)
      const start = this.object.userData.line.vertices[0].point;
      const end = this.object.userData.line.vertices[1].point;
      const center = this.displayDiagram._getCenter(this.object.userData.line);
      const center2start = start.clone().sub(center);
      const center2end = end.clone().sub(center);

      // find 'intersection', the point the raycaster ray intersects the plane defined by start, end and center
      const m = new THREE.Matrix3().set(...center2start.toArray(),
                                        ...center2end.toArray(),
                                        ...this.raycaster.ray.direction.toArray())
                         .transpose();
      const s = this.raycaster.ray.origin.clone().applyMatrix3(new THREE.Matrix3().getInverse(m));
      const intersection = this.raycaster.ray.origin.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(-s.z));

      // get offset length
      const start2intxn = intersection.clone().sub(start);
      const start2end = end.clone().sub(start);
      const plane_normal = new THREE.Vector3().crossVectors(center2start, center2end).normalize();
      const line_length = start2end.length();
      const offset = new THREE.Vector3().crossVectors(start2intxn, start2end).dot(plane_normal)/(line_length * line_length);

      // set line offset in diagram, and re-paint lines, arrowheads
      this.object.userData.line.style = Diagram3D.CURVED;
      this.object.userData.line.offset = offset;
      this.displayDiagram.updateLines(this.displayDiagram.scene.userData);
      this.displayDiagram.updateArrowheads(this.displayDiagram.scene.userData);
   }

   repaintSphere() {
      // change node location to 3D intersection between ray and plane normal to camera POV containing node
      const node = this.object.userData.node.point;
      const ray_origin = this.raycaster.ray.origin;
      const ray_direction = this.raycaster.ray.direction;
      const projection = ray_origin.clone().multiplyScalar(ray_origin.dot(node)/node.length()/ray_origin.length()/ray_origin.length());
      const inplane = node.clone().sub(projection);
      const normal = new THREE.Vector3().crossVectors(inplane, ray_origin).normalize();

      const m = new THREE.Matrix3().set(...inplane.toArray(),
                                        ...normal.toArray(),
                                        ...ray_direction.toArray() )
                         .transpose();
      const s = ray_origin.clone().sub(projection).applyMatrix3(new THREE.Matrix3().getInverse(m));
      const new_node = ray_origin.clone().add(ray_direction.clone().multiplyScalar(-s.z));

      this.object.userData.node.point = new_node;

      this.displayDiagram.updateNodes(this.displayDiagram.scene.userData);
      this.displayDiagram.updateHighlights(this.displayDiagram.scene.userData);
      this.displayDiagram.updateLabels(this.displayDiagram.scene.userData);
      this.displayDiagram.updateLines(this.displayDiagram.scene.userData);
      this.displayDiagram.updateArrowheads(this.displayDiagram.scene.userData);
      this.displayDiagram.render();
   }
}
/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class CayleyDiagram extends Diagram3D {
   constructor(group, diagram_name) {
      super(group);
      this.background = CayleyDiagram.BACKGROUND_COLOR;
      this.strategies = [];

      this.isCayleyDiagram = true;
      this.diagram_name = diagram_name;
      this._update();
   }

   get isGenerated () {
      return this.diagram_name === undefined;
   }

   getStrategies() {
      return this.strategies.map( (strategy) => [strategy.generator, strategy.layout, strategy.direction, strategy.nesting_level] );
   }

   setStrategies(strategy_parameter_array) {
      const param_array = strategy_parameter_array
         .map( (params) => { return {generator: params[0], layout: params[1], direction: params[2], nesting_level: params[3]} } );
/* Checks used in development, debugging
      // check:  generators, layouts, directions are in range
      if (param_array.find( (params) => params.generator < 1 || params.generator >= this.group.order ) !== undefined)
         console.error('strategy generator out of range');
      if (param_array.find( (params) => params.layout < CayleyDiagram.LINEAR_LAYOUT || params.layout > CayleyDiagram.ROTATED_LAYOUT ) !== undefined)
         console.error('strategy layout out of range');
      if (param_array.find( (params) => params.direction < CayleyDiagram.X_DIRECTION || params.direction > CayleyDiagram.Z_DIRECTION ) !== undefined)
         console.error('strategy direction out of range');

      // check:  generate all the elements in the group
      if (this.group.closure(param_array.map( (params) => params.generator )).popcount() != this.group.order)
         console.error('strategy generators do not generate the entire group');

      // check:  nesting_levels are in range, complete, unique
      if (!Array.from({length: param_array.length}, (_,inx) => inx )
                ._equals(param_array.map( (params) => params.nesting_level ).sort( (a,b) => a - b )))
         console.error('strategy nesting levels are incomplete or redundant');

      // check:  can't use circular or rotary for subgroup of order 2
      //   (not exactly true, see comment in DC.Generator.showAxisMenu)
      if (param_array.find( (params) => this.group.elementOrders[params.generator] == 2 && params.layout != CayleyDiagram.LINEAR_LAYOUT) !== undefined)
         console.error('generator must have order > 2 when using circular or rotated layout');

      // check:  no empty nesting levels (should this really be needed?)
*/
      this.strategies = strategy_parameter_array
         .map( (parameters) => CayleyDiagram.LayoutStrategy._createStrategy(...parameters) );

      this._update();
   }

   _update() {
      this.nodes = [];
      this.lines = [];
      if (this.isGenerated) {
         if (this.strategies.length == 0) {
            this._generateStrategy();
         } else {
            this._generateFromStrategy();
            this.normalize();
         }
      } else {
         this._generateFromGroup();
      }

      this.setNodeColor(CayleyDiagram.NODE_COLOR)
          .setNodeLabels()
          .setLineColors();
      this.emitStateChange();
   }

   _generateFromGroup() {
      const cayleyDiagram = this.group.cayleyDiagrams.find( (cd) => cd.name == this.diagram_name );
      this.nodes = cayleyDiagram.points.map(
         (point, element) => new Diagram3D.Node(element, point, {lineStyle: Diagram3D.STRAIGHT}));
      cayleyDiagram.arrows.forEach( (arrow) => this.addLines(arrow) );
      this.emitStateChange();
   }

   _generateFromStrategy() {
      const node_list = this._generateNodes(this.strategies);
      this.ordered_nodes = this._transposeNodes(node_list);

      this.nodes = this._layout(this.ordered_nodes)
                       .sort( (a,b) => a.element - b.element );

      // makes lines for generators
      this.strategies.forEach( (strategy) => this.addLines(strategy.generator) );
      this.emitStateChange();
   }

   _generateNodes(strategies) {
      const generators = this.strategies.map( (strategy) => strategy.generator );

      const node_list = strategies.reduce( (nodes, strategy, inx) => {
         [nodes, strategies[inx].bitset] = this._extendSubgroup(nodes, generators.slice(0, inx+1));
         return (inx == 0) ? nodes._flatten() : nodes;
      }, [0]);

      this.emitStateChange();
      return node_list;
   }

   _extendSubgroup(H_prev, generators) {
      const deepMultiply = (g, arr) => {
         if (Array.isArray(arr)) {
            return arr.map( (el) => deepMultiply(g, el) );
         } else {
            const prod = this.group.mult(g, arr);
            result_bitset.set(prod);
            return prod;
         }
      }

      const new_generator = generators[generators.length - 1];
      const result = [H_prev];
      const result_bitset = new BitSet(this.group.order, H_prev._flatten());
      Array.from({length: this.group.elementOrders[new_generator]})
           .reduce( (cycle) => (cycle.push(this.group.mult(cycle._last(), new_generator)), cycle), [0])
           .forEach( (el) => {
              if (!result_bitset.isSet(el)) {
                 result.push(deepMultiply(el, H_prev))
              }
           } );

      for (let inx = 1; inx < result.length; inx++) {
         let rep;
         const stmt = `rep = result[${inx}]` + Array(generators.length - 1).fill('[0]').join('');
         eval(stmt);
         for (const generator of generators) {
            const prod = this.group.mult(generator, rep);
            if (!result_bitset.isSet(prod)) {
               const coset = deepMultiply(prod, H_prev);
               result.push(coset);
            }
         }
      }

      return [result, result_bitset];
   }

   _transposeNodes(node_list) {
      const copyPush = (arr, el) => {
         const result = arr.slice();
         result.push(el);
         return result;
      };

      // index transformation
      const gen2nest = this.strategies.map( (_, index) => this.strategies.findIndex( (s) => s.nesting_level == index) );

      // allocate transpose according to space used in node_list
      const transpose_allocations = this.strategies
                                        .map( (_,inx) => eval('node_list' + Array(inx).fill('[0]').join('') + '.length') )
                                        .map( (_,inx,arr) => arr[gen2nest[inx]] );
      const makeEmpty =
         (transpose_index = 0) => (transpose_index == transpose_allocations.length - 1) ? [] :
                                Array(transpose_allocations[transpose_index]).fill().map( (_) => makeEmpty(transpose_index + 1) );

      // traverse node_list, inserting new Diagram3D.Node into transpose
      const traverse = (nodes, indices = []) => {
         if (indices.length == this.strategies.length) {
            const line_style = indices.every(
               (index, strategy_index) => index == 0 || this.strategies[this.strategies.length - strategy_index - 1].layout == CayleyDiagram.LINEAR_LAYOUT
            ) ? Diagram3D.STRAIGHT : Diagram3D.CURVED;
            var walk = result;
            for ( var i = 0 ; i < indices.length - 1 ; i++ ) walk = walk[indices[gen2nest[i]]];
            walk[indices[gen2nest[indices.length-1]]]
                = new Diagram3D.Node(nodes, undefined, {lineStyle: line_style});
         } else {
            nodes.forEach( (el,inx) => { traverse(el, copyPush(indices, inx)) } );
         }
      }

      // now actually do the work
      const result = makeEmpty();
      traverse(node_list);

      return result;
   }

   _layout(nested_nodes,
           nested_strategies = this.strategies.slice().sort( (a,b) => a.nesting_level - b.nesting_level )) {

      if (nested_strategies.length == 0) {
         return [nested_nodes];
      } else {
         const strategy = nested_strategies.pop();
         const child_results = [...nested_nodes.map( (children) => this._layout(children, nested_strategies) )]
         nested_strategies.push(strategy);
         const layout_results = strategy._layout(child_results);
         return layout_results._flatten();
      }
   }

   /* routine to generate default strategy
    *   Special cases:
    *      group is order = 1 => draw a single node
    *      group is order = 2 => linear (just two nodes)
    *
    *   General strategy:
    *      if group is cyclic => circular
    *      if group has two generators, look for a cyclic subgroup that is order |G|/2 and draw this as two connected circles
    *        if |G| = |gen1| * |gen2|, draw this with gen1 rotated in XY plane, gen2 linear in X (e.g., S_3)
    *        if not, draw this with gen1 circular in XY plane, gen2 linear in Z (e.g., Q_4)
    *      if group has two generators but no such cyclic subgroup draw a 2D grid
    *      if group has three generators map each of them to an axis in a 3D grid
    *      if group has four generators, pick the two smallest to display on same axis and map others to the remaining axes
    */
   _generateStrategy() {
      if (this.group.order == 1) {
         this.nodes.push(new Diagram3D.Node(0));  // just draw a single node
         return;
      }
      if (this.group.order == 2) {
         this.setStrategies([[1, 0, 1, 0]]);
         return;
      }

      const element_orders = this.group.elementOrders;
      const generators = this.group.generators[0];
      const ordered_gens = generators.slice().sort( (a,b) => element_orders[b] - element_orders[a] );
      switch (generators.length) {
         case 1:
            this.setStrategies([[generators[0], 1, 2, 0]]);  // cyclic group
            break;
         case 2:
            // does the first ordered_gen (generator with largest element order) have order |G|/2?
            // make sure group is big enough -- can't do a circle with only 2 elements
            if (element_orders[ordered_gens[0]] == this.group.order/2 && this.group.order > 4) {
               if (element_orders[ordered_gens[1]] == 2) {
                  this.setStrategies([[ordered_gens[1], 0, 0, 0],
                                      [ordered_gens[0], 2, 2, 1]]);     // see D_4
               } else {
                  this.setStrategies([[ordered_gens[1], 1, 2, 0],
                                      [ordered_gens[0], 0, 2, 1]]);     // see Q_4
               }
            } else {
               // put greatest # elements in X direction (remember that the 2nd generator will generate
               //   all the elements in the group the first one doesn't)
               const first_gen_order = element_orders[ordered_gens[0]];
               const first_gen_dir = (first_gen_order >= this.group.order/first_gen_order) ? 0 : 1;
               this.setStrategies([[ordered_gens[0], 0, first_gen_dir,   0],
                                   [ordered_gens[1], 0, 1-first_gen_dir, 1]]);       // see S_4
            }
            break;
         case 3:
            this.setStrategies([[generators[0], 0, 0, 0],
                                [generators[1], 0, 1, 1],
                                [generators[2], 0, 2, 2]]);
            break;
         case 4:
            this.setStrategies([[ordered_gens[0], 0, 0, 0],
                                [ordered_gens[1], 0, 0, 1],
                                [ordered_gens[2], 0, 1, 2],
                                [ordered_gens[3], 0, 2, 3]]);
            break;
      }
      this.emitStateChange();
   }

   emitStateChange () {
      const myURL = window.location.href;
      const thirdSlash = myURL.indexOf( '/', 8 );
      const myDomain = myURL.substring( 0, thirdSlash > -1 ? thirdSlash : myURL.length );
      window.postMessage( this.toJSON(), myDomain );
   }

   toJSON () {
      return {
         groupURL : this.group.URL,
         diagram_name : this.diagram_name,
         arrowheadPlacement : this.arrowheadPlacement
      };
   }

   fromJSON ( json ) {
      this.diagram_name = json.diagram_name;
      this.arrowheadPlacement = json.arrowheadPlacement;
      var that = this;
      Library.getGroupOrDownload( json.groupURL )
             .then( ( group ) => { that.group = group; } );
   }
}


/* Initialize CayleyDiagram static variables */

CayleyDiagram.BACKGROUND_COLOR = 0xE8C8C8;
CayleyDiagram.NODE_COLOR = 0x8c8c8c;

CayleyDiagram.LINEAR_LAYOUT = 0;
CayleyDiagram.CIRCULAR_LAYOUT = 1;
CayleyDiagram.ROTATED_LAYOUT = 2;

CayleyDiagram.X_DIRECTION = 0;
CayleyDiagram.Y_DIRECTION = 1;
CayleyDiagram.Z_DIRECTION = 2;

CayleyDiagram.YZ_DIRECTION = 0;
CayleyDiagram.XZ_DIRECTION = 1;
CayleyDiagram.XY_DIRECTION = 2;

CayleyDiagram.LayoutStrategy = class {
   constructor(generator, direction, nesting_level) {
      this.generator = generator;          // element# (not 0)
      this.direction = direction;          // 0/1/2 => X/Y/Z for linear, YZ/XZ/XY for curved
      this.nesting_level = nesting_level;  // 0 for innermost, increasing to outermost
      this.elements = undefined;
   }

   static _createStrategy(generator, layout, direction, nesting_level) {
      if (CayleyDiagram.LayoutStrategy.class_by_layout === undefined) {
         CayleyDiagram.LayoutStrategy.class_by_layout = [
            CayleyDiagram.LinearLayout,
            CayleyDiagram.CircularLayout,
            CayleyDiagram.RotatedLayout,
         ];
      }
      return new CayleyDiagram.LayoutStrategy
                              .class_by_layout[layout](generator, direction, nesting_level);
   }

   _getWidth(nodes, direction) {
      return nodes.reduce(
         (max, node) => Math.max(Math.abs(node.point.getComponent(direction)), max),
         0 );
   }
}

// Scale and translate children to distribute them from 0 to 1 along the <direction> line
CayleyDiagram.LinearLayout = class extends CayleyDiagram.LayoutStrategy {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.LINEAR_LAYOUT;
   }

   _layout(children) {
      const direction_vector = new THREE.Vector3(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? 1 : 0));

      // number of children
      const num_children = children.length;

      // find a child diameter in <direction>, scale so all fit in [0,1] box
      const target_width = 1.4/(3*num_children - 1);  // heuristic
      const child_width = this._getWidth(children._flatten(), this.direction);
      const scale = child_width < target_width ? 1 : target_width / child_width;

      // create scale transform
      let transform = (new THREE.Matrix4()).makeScale(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? scale : 1));

      const scaled_width = scale*child_width;
      const step = (1 - scaled_width) / (num_children - 1);
      let translation = 0;  // initial value
      for (const child of children) {
         transform = transform.setPosition(direction_vector.clone().multiplyScalar(translation));
         child.forEach( (node) => node.point = node.point.applyMatrix4(transform) );
         translation += step;
      }

      return children;
   }
}

CayleyDiagram.CurvedLayout = class extends CayleyDiagram.LayoutStrategy {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);

      // calculate position transform as a function of angle theta for every direction
      const positions = [
         (r, theta) => new THREE.Vector3(0,                        0.5 - r*Math.cos(theta),  0.5 - r*Math.sin(theta)),  // YZ
         (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0,                        0.5 - r*Math.cos(theta)),  // XZ
         (r, theta) => new THREE.Vector3(0.5 + r*Math.sin(theta),  0.5 - r*Math.cos(theta),  0),                        // XY
      ];
      this.position = (r, theta) => positions[direction](r, theta);
   }
}

// Scale children to fit and translate them so they're distributed
//   around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
CayleyDiagram.CircularLayout = class extends CayleyDiagram.CurvedLayout {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.CIRCULAR_LAYOUT;
   }

   _layout(children) {
      // make circle radius to fit in [0,1] box
      const r = 0.5;

      // scale two directions, not the third?
      // scale differently in 2 directions (esp rotated -- make old x < 0.25)
      const scale = 0.4;  // heuristic
      const transform = (new THREE.Matrix4()).makeScale(
         ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (this.direction == inx) ? 1 : scale)).toArray()
      )

      const curvedGroup = [];

      // translate children to [0.5, 0.5] + [r*sin(th), -r*cos(th)]
      children.forEach( (child, inx) => {
         transform.setPosition(this.position(r, 2*inx*Math.PI/children.length));
         child.forEach( (node) => {
            node.point = node.point.applyMatrix4(transform);
            if (node.curvedGroup === undefined) {
               node.curvedGroup = curvedGroup;
               curvedGroup.push(node);
            }
         } );
      } );

      return children;
   }
}

// Scale children to fit, rotate them PI/2 + 2*inx*PI/n, and translate them
//   so they're distributed around the 0.5*e^i*[0,2*PI] circle centered at [.5,.5]
CayleyDiagram.RotatedLayout = class extends CayleyDiagram.CurvedLayout {
   constructor(generator, direction, nesting_level) {
      super(generator, direction, nesting_level);

      // calculate rotation transform as a function of angle theta for every direction
      const rotations = [
         (theta) => new THREE.Matrix4().makeRotationX(theta + Math.PI/2),   // YZ
         (theta) => new THREE.Matrix4().makeRotationY(theta + Math.PI/2),   // XZ
         (theta) => new THREE.Matrix4().makeRotationZ(theta + Math.PI/2),   // XY
      ];
      this.rotation = (theta) => rotations[direction](theta);
   }

   get layout() {
      return CayleyDiagram.ROTATED_LAYOUT;
   }

   _layout(children) {
      // make circle radius to fit in [0,1] box
      const r = 0.5;

      // scale two directions, not the third?
      // scale differently in 2 directions (esp rotated -- make old x < 0.25)

      // make size of transformed child about half the distance between nodes
      const scale = Math.min(0.25, Math.max(0.1, Math.PI/2/children.length));	// heuristic
      const scale_transform = (new THREE.Matrix4()).makeScale(
         ...new THREE.Vector3(...Array.from({length: 3}, (_,inx) => (this.direction == inx) ? 1 : scale)).toArray()
      )

      const curvedGroup = [];

      // scale, rotation, and translate each child
      children.forEach( (child, inx) => {
         const theta = 2*inx*Math.PI/children.length;
         const transform = scale_transform.clone()
                                          .multiply(this.rotation(theta))
                                          .setPosition(this.position(r, theta));
         child.forEach( (node) => {
            node.point = node.point.applyMatrix4(transform);
            if (node.curvedGroup === undefined) {
               node.curvedGroup = curvedGroup;
               curvedGroup.push(node);
            }
         } );
      } );

      return children;
   }
}
/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class SymmetryObject {
   static _init() {
      SymmetryObject.BACKGROUND_COLOR = 0xC8E8C8;
   }

   static generate(group, diagramName) {
      const symmetryObject = group.symmetryObjects.find( (obj) => obj.name == diagramName );
      const nodes = symmetryObject.spheres.map( (sphere, inx) =>
         new Diagram3D.Node(inx, sphere.point, {color: sphere.color, radius: sphere.radius}) );

      const lines = symmetryObject.paths.map( (path) => {
         const vertices = path.points.map( (point) => new Diagram3D.Point(point) );
         return new Diagram3D.Line(vertices, {color: path.color, arrowhead: false});
      } );

      return new Diagram3D(group, nodes, lines, {background: SymmetryObject.BACKGROUND_COLOR});
   }
}

// initialize static variables
SymmetryObject._init();
/*
 * Routines to draw 3D ball-and-stick diagrams using three.js
 */


class DisplayDiagram {
   /*
    * Create three.js objects to display data in container
    *
    * create a scene to hold all the elements such as lights and objects
    * create a camera, which defines the point of view
    * create a renderer, sets the size
    * add the output of the renderer to the container element (a jquery wrapped set)
    */
   constructor(options) {
      Log.log('DisplayDiagram');

      if (options === undefined) {
         options = {};
      }

      DisplayDiagram.setDefaults();
      this.scene = new THREE.Scene();
      DisplayDiagram.groupNames.forEach( (name) => {
         const group = new THREE.Group();
         group.name = name;
         this.scene.add(group);
      } );

      if (options.fog === undefined || options.fog) {
         this.scene.fog = new THREE.Fog(DisplayDiagram.DEFAULT_BACKGROUND);
      }

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      if (options.container !== undefined) {
         width = options.container.width();
         height = options.container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);

      this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true});
      this.setSize(width, height);

      if (options.container !== undefined) {
         options.container.append(this.renderer.domElement);
      }

      if (options.trackballControlled) {
         this.camControls = new THREE.TrackballControls(this.camera, options.container[0]);
      }
   }

   setSize ( w, h ) { this.renderer.setSize( w, h ); }
   getSize () {
       const size = this.renderer.getSize();
       return { w : size.width, h : size.height };
   }

   static setDefaults() {
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads', 'nodeHighlights', 'chunks']
      DisplayDiagram.DEFAULT_CANVAS_HEIGHT = 50;
      DisplayDiagram.DEFAULT_CANVAS_WIDTH = 50;
      DisplayDiagram.DEFAULT_BACKGROUND = 0xE8C8C8;  // Cayley diagram background
      DisplayDiagram.DEFAULT_NODE_COLOR = 0x8C8C8C;  // gray
      DisplayDiagram.DEFAULT_LINE_COLOR = 0x000000;  // black
      DisplayDiagram.DEFAULT_FOG_COLOR = 0xA0A0A0;
      DisplayDiagram.IOS_LINE_WIDTH = 1;
      DisplayDiagram.DEFAULT_ARC_OFFSET = 0.2;
      DisplayDiagram.LIGHT_POSITIONS = [
         [105, 0, 0],
         [-35, -50, -87],
         [-35, -50, 87],
         [-35, 100, 0],
      ];
   }

   // Small graphics don't need high resolution features such as many-faceted spheres, labels, thick lines
   // Removing labels is particularly beneficial, since each label (384 in Tesseract) requires a canvas element
   //   and a context, which often causes loading failure due to resource limitations
   getImage(diagram3D,options) {
      // Options parameter:
      // size: "small" or "large", default is "small"
      // resetCamera : true or false, default is true
      if ( !options ) options = { size : 'small', resetCamera : true };
      const img = new Image();

      // save diagram for use by DiagramDnD -- not used for thumbnails
      if (this.lineDnD !== undefined) {
         this.scene.userData = diagram3D;
      }

      if ( options.resetCamera ) this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D, options.size == "large" ? 20 : 5);
      if ( options.size == "large" ) {
         this.updateHighlights(diagram3D);
         this.updateLabels(diagram3D);
      }
      this.updateLines(diagram3D, options.size == "small");
      this.updateArrowheads(diagram3D);
      this.updateChunking(diagram3D);
      this.render();

      img.src = this.renderer.domElement.toDataURL();
      return img;
   }

   // Display diagram
   showGraphic(diagram3D) {
      Log.log('showGraphic');

      // save diagram for use by LineDnD
      if (this.camControls !== undefined && diagram3D.isCayleyDiagram) {
         if (this.lineDnD === undefined) {
            this.lineDnD = new DiagramDnD(this);
         }
         this.scene.userData = diagram3D;
      }

      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D);
      this.updateHighlights(diagram3D);
      this.updateLabels(diagram3D);
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
      this.updateChunking(diagram3D);
      this.render();
   }

   getGroup(name) {
      return this.scene.children.find( (el) => el.name == name );
   }

   /*
    * Position the camera and point it at the center of the scene
    *
    * Camera positioned to match point of view in GE2:
    *   If diagram is generated by GE:
    *     If diagram lies entirely in y-z plane (all x == 0)
    *       place camera on z-axis, x-axis to the right, y-axis down
    *     If diagram lies entirely in the x-z plane
    *       place camera on negative y-axis, x-axis to the right, z-axis up
    *     If diagram lies entirely in the x-y plane
    *       place camera on negative z-axis, x-axis to the right, y-axis down
    *     Otherwise place camera with y-axis down, offset a bit from
    *       the (1,-1,-1) vector so that opposite corners don't line up
    *       and make cubes look flat
    *   else (diagram is specified in .group file)
    *     If diagram lies entirely in the y-z plane (all x == 0)
    *       place camera on x-axis, y-axis up (z-axis to the left)
    *     If diagram lies entirely in the x-z plane (all y == 0)
    *       place camera on y-axis, z-axis down (x-axis to the right)
    *     If diagram lies entirely in the x-y plane (all z == 0)
    *       place camera on z-axis, y-axis up (x-axis to the right)
    *     Otherwise place camera with y-axis up, offset a bit from
    *       the (1,1,1) vector so that opposite corners don't line up
    *       and make cubes look flat; look at origina, and adjust camera
    *       distance so that diagram fills field of view
    */
   setCamera(diagram3D) {
      Log.log('setCamera');

      if (diagram3D.isGenerated) {
         if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
            this.camera.position.set(3, 0, 0);
            this.camera.up.set(0, -1, 0);
         } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
            this.camera.position.set(0, -3, 0);
            this.camera.up.set(0, 0, 1);
         } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
            this.camera.position.set(0, 0, -3);
            this.camera.up.set(0, -1, 0);
         } else {
            this.camera.position.set(1.7, -1.6, -1.9);
            this.camera.up.set(0, -1, 0);
         }
      } else {
         if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
            this.camera.position.set(3, 0, 0);
            this.camera.up.set(0, 1, 0);
         } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
            this.camera.position.set(0, 3, 0);
            this.camera.up.set(0, 0, -1);
         } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
            this.camera.position.set(0, 0, 3);
            this.camera.up.set(0, 1, 0);
         } else {
            const position = new THREE.Vector3(1.7, 1.6, 1.9).multiplyScalar(diagram3D.radius);
            this.camera.position.set(position.x, position.y, position.z);
            this.camera.up.set(0, 1, 0);
         }
      }
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
   }

   setBackground(diagram3D) {
      Log.log('setBackground');

      const background = (diagram3D.background === undefined) ?
                         DisplayDiagram.DEFAULT_BACKGROUND : diagram3D.background;
      this.renderer.setClearColor(background, 1.0);
   }

   // Create, arrange lighting
   updateLights() {
      Log.log('updateLights');

      const lights = this.getGroup('lights');
      lights.remove(...lights.children);
      DisplayDiagram.LIGHT_POSITIONS.forEach( (position) => {
         const light = new THREE.DirectionalLight();
         light.position.set(...position);
         lights.add(light);
      } )
   }

   // Create a sphere for each node, add to scene as THREE.Group named "spheres"
   updateNodes(diagram3D, sphere_facets = 20) {
      Log.log('updateNodes');

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      const materialsByColor = new Map(),
            geometriesByRadius = new Map();

      const default_color = DisplayDiagram.DEFAULT_NODE_COLOR;
      const default_radius = 0.3 / Math.sqrt(diagram3D.nodes.length);
      diagram3D.nodes.forEach( (node) => {
         const color = (node.color === undefined) ? default_color : node.color;
         if (!materialsByColor.has(color)) {
            materialsByColor.set(color, new THREE.MeshPhongMaterial({color: node.color}));
         }
         const material = materialsByColor.get(color);

         const radius = (node.radius === undefined) ? default_radius : node.radius;
         if (!geometriesByRadius.has(radius)) {
            geometriesByRadius.set(radius, new THREE.SphereGeometry(radius * diagram3D.nodeScale, sphere_facets, sphere_facets));
         }
         const geometry = geometriesByRadius.get(radius);

         const sphere = new THREE.Mesh(geometry, material);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         sphere.name = diagram3D.group.representation[node.element];
         spheres.add(sphere);
      } )
   }

   updateHighlights(diagram3D) {
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children);

      const materialsByColor = this.getGroup('spheres').children.reduce( (materials, sphere) => {
         if (!materials.has(sphere.material.color)) {
            materials.set(sphere.material.color, sphere.material);
         }
         return materials;
      }, new Map());

      this.getGroup('spheres').children.forEach( (sphere) => {
         const node = diagram3D.nodes[sphere.userData.node.element];

         // Find sphere's desired color: priority is colorHighlight, color, or default
         const desiredColor = new THREE.Color(
            (node.colorHighlight !== undefined) ? node.colorHighlight :
            ((node.color !== undefined) ? node.color :
             DisplayDiagram.DEFAULT_NODE_COLOR) );
         // If sphere is not desired color set material color to desired color
         if (!sphere.material.color.equals(desiredColor)) {
            if (!materialsByColor.has(desiredColor)) {
               materialsByColor.set(desiredColor, new THREE.MeshPhongMaterial({color: desiredColor}));
            }
            sphere.material = materialsByColor.get(desiredColor);
            sphere.geometry.uvsNeedUpdate = true;
            sphere.needsUpdate = true;
         }

         // if node has ring, draw it
         if (node.ringHighlight !== undefined) {
            this._drawRing(node, sphere.geometry.parameters.radius);
         }

         // if node has square, draw it
         if (node.squareHighlight !== undefined) {
            this._drawSquare(node, sphere.geometry.parameters.radius);
         }
      } );
   }

   _drawRing(node, nodeRadius) {
      // Expand ring to clear sphere
      const scale = 2.5 * nodeRadius;  // 2.5: experimental computer science in action...

      // create new canvas with enough pixels to get smooth circle
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw circle
      const context = canvas.getContext('2d');
      context.lineWidth = 0.66 / scale;  // scales to webGl lineWidth = 10
      context.strokeStyle = node.ringHighlight;
      context.beginPath();
      context.arc(canvas.width/2, canvas.height/2, canvas.width/2-6, 0, 2*Math.PI);
      context.stroke();

      // create texture
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      // create material, sprite
      const ringMaterial = new THREE.SpriteMaterial({ map: texture });
      const ring = new THREE.Sprite(ringMaterial);

      // scale, position middle of ring
      ring.scale.set(scale, scale, 1);
      ring.center = new THREE.Vector2(0.5, 0.5);
      ring.position.set(node.point.x, node.point.y, node.point.z);

      this.getGroup('nodeHighlights').add(ring);
   }

   _drawSquare(node, nodeRadius) {
      // Expand square to clear ring (which clears sphere)
      const scale = 2.65 * nodeRadius;

      // create new canvas
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw square
      const context = canvas.getContext('2d');
      context.lineWidth = 1.2 / scale;  // scales to webGl lineWidth = 10
      context.strokeStyle = node.squareHighlight;
      context.rect(0, 0, canvas.width, canvas.height);
      context.stroke();

      // create texture
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      // create material, sprite
      const squareMaterial = new THREE.SpriteMaterial({ map: texture });
      const square = new THREE.Sprite(squareMaterial);

      // scale, position middle of square
      square.scale.set(scale, scale, 1);
      square.center = new THREE.Vector2(0.5, 0.5);
      square.position.set(node.point.x, node.point.y, node.point.z);

      this.getGroup('nodeHighlights').add(square);
   }

   // Draw labels on sprites positioned at nodes
   updateLabels(diagram3D) {
      Log.log('updateLabels');

      const labels = this.getGroup('labels');
      labels.remove(...labels.children);

      if (diagram3D.labelSize == 0) {
         return;
      }

      const spheres = this.getGroup('spheres').children;
      const radius = spheres.find( (el) => el !== undefined ).geometry.parameters.radius;
      let canvas_width, canvas_height, label_font;
      const big_node_limit = 0.1, small_node_limit = 0.05;
      if (radius >= big_node_limit) {
         canvas_width = 4096;
         canvas_height = 256;
         label_font = '120pt Arial';
      } else if (radius <= small_node_limit) {
         canvas_width = 1024;
         canvas_height = 64;
         label_font = '32pt Arial';
      } else {
         canvas_width = 2048;
         canvas_height = 128;
         label_font = '64pt Arial';
      }
      const scale = diagram3D.labelSize * radius * 8.197 * 2;  // factor to make label size ~ radius

      spheres.forEach( (sphere) => {
         const node = sphere.userData.node;
         if (node.label === undefined || node.label == '') {
            return;
         };

         // make canvas big enough for any label and offset it to clear the node while still being close
         const canvas = document.createElement('canvas');
         canvas.id = `label_${node.element}`;
         const context = canvas.getContext('2d');

         const textLabel = mathml2text(node.label);
         canvas.width =  canvas_width;
         canvas.height = canvas_height;
         // debug -- paint label background
         // context.fillStyle = 'rgba(0, 0, 100, 0.5)';
         // context.fillRect(0, 0, canvas.width, canvas.height);
         context.font = label_font;
         context.fillStyle = 'rgba(0, 0, 0, 1)';
         context.fillText(textLabel, 0, 0.7*canvas.height);

         const texture = new THREE.Texture(canvas)
         texture.needsUpdate = true;
         const labelMaterial = new THREE.SpriteMaterial({ map: texture });
         const label = new THREE.Sprite( labelMaterial );
         label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);
         label.center = new THREE.Vector2(-0.045/diagram3D.labelSize, 0.30 - 0.72/diagram3D.labelSize);
         label.position.set(...node.point.toArray())

         labels.add(label);
      } )
   }

   /*
    * Draw lines between nodes
    *   An arc is drawn in the plane specified by the two ends and the center, if one is given, or [0,0,0]
    */
   updateLines(diagram3D, use_webgl_native_lines) {
      Log.log('updateLines');

      const lines = diagram3D.lines;
      const spheres = this.getGroup('spheres').children;
      const lineGroup = this.getGroup('lines');
      lineGroup.remove(...lineGroup.children);
      const userAgent = window.navigator.userAgent;
      const isIOS = !!userAgent.match(/iPad/i) || !!userAgent.match(/iPhone/i);
      // This generally works, but Chrome/Linux can't display its max (!?) -- punt for the moment
      // const maxLineWidth = this.renderer.context.getParameter(
      //   this.renderer.context.ALIASED_LINE_WIDTH_RANGE)[1];
      const maxLineWidth = 1;

      lines.forEach( (line) => {
         const vertices = line.vertices,
               lineColor = (line.color === undefined) ?
                           DisplayDiagram.DEFAULT_LINE_COLOR : line.color,
               lineWidth = use_webgl_native_lines ? 1 : (isIOS ? DisplayDiagram.IOS_LINE_WIDTH : diagram3D.lineWidth),
               lineMaterial =
                  lineWidth <= maxLineWidth ?
                  new THREE.LineBasicMaterial({color: lineColor, linewidth: lineWidth}) :
                  new MeshLineMaterial({
                     color: new THREE.Color(lineColor),
                     lineWidth: lineWidth,
                     sizeAttenuation: false,
                     side: THREE.DoubleSide,
                     resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                     fog: true,
                  }),
               geometry = new THREE.Geometry();

         geometry.vertices = this._getLineVertices(line)

         let newLine;
         if (lineWidth == 1) {
            newLine = new THREE.Line(geometry, lineMaterial);
         } else {
            const meshLine = new MeshLine()
            meshLine.setGeometry(geometry);
            newLine = new THREE.Mesh(meshLine.geometry, lineMaterial);
         }
         newLine.userData = {line: line, vertices: geometry.vertices, color: lineColor};
         lineGroup.add(newLine);
      } )
   }

   _getLineVertices(line) {
      const spheres = this.getGroup('spheres').children,
            vertices = line.vertices;

      if (vertices.length > 2) {
         return vertices.map( (vertex) => vertex.point );
      }

      // offset center of arc 20% of the distance between the two nodes, in the plane of center/start/end
      if (line.style == Diagram3D.CURVED) {
         line.offset = (line.offset === undefined) ? 0.2 : line.offset;
         const points = this._curvePoints(line);
         return points;
      }

      // arc around intervening points
      const radius = spheres.find( (sphere) => sphere.geometry.parameters.radius !== undefined ).geometry.parameters.radius,
            start = vertices[0].point,
            end = vertices[1].point,
            start2end = end.clone().sub(start),
            start2end_sq = start.distanceToSquared(end),
            start2end_len = Math.sqrt(start2end_sq),
            min_squared_distance = 1.5 * radius * radius;
      for (const sphere of spheres) {
         const start2sphere = sphere.position.clone().sub(start),
               start2sphere_sq = start.distanceToSquared(sphere.position),
               end2sphere_sq = end.distanceToSquared(sphere.position),
               start2end_sq = start.distanceToSquared(end),
               x = (start2end_sq - end2sphere_sq + start2sphere_sq)/(2 * start2end_len),
               normal = start2sphere.clone().sub(start2end.clone().multiplyScalar(x/start2end_len));
         if (   start2sphere_sq != 0
             && end2sphere_sq != 0
             && x > 0
             && x < start2end_len
             && normal.lengthSq() < min_squared_distance )
            {
               line.offset = (line.offset === undefined) ? 1.7*radius/Math.sqrt(start2end_sq) : line.offset;
               const points = this._curvePoints(line);
               return points;
            }
      }

      return vertices.map( (vertex) => vertex.point );
   }

   _curvePoints(line) {
      const start_point = line.vertices[0].point,
            end_point = line.vertices[1].point,
            center = this._getCenter(line),
            start = start_point.clone().sub(center),
            end = end_point.clone().sub(center),
            offset_distance = line.offset * start_point.distanceTo(end_point),
            halfway = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),  // (start + end)/2
            start2end = end.clone().sub(start),
            x = -start.dot(start2end)/end.dot(start2end),  // start + x*end is normal to start - end
            normal = ((end.dot(start2end) == 0) ? end.clone() : start.clone().add(end.clone().multiplyScalar(x))).normalize(),
            offset = normal.clone().multiplyScalar(2*offset_distance),
            middle = center.clone().add(halfway).add(offset),
            curve = new THREE.QuadraticBezierCurve3(start_point, middle, end_point),
            points = curve.getPoints(10);
      line.middle = middle;
      return points;
   }

   _getCenter(line) {
      const centerOK = (point) => new THREE.Vector3().crossVectors(startPoint.clone().sub(point), endPoint.clone().sub(point)).lengthSq() > 1.e-4;
      const startNode = line.vertices[0],
            endNode = line.vertices[1],
            startPoint = startNode.point,
            endPoint = endNode.point;

      // if center is spec'd, check it and if OK, return that
      if (line.center !== undefined) {
         if (centerOK(line.center)) {
            return line.center;
         }
      }

      // if nodes are in the same curved group, find avg of nodes and use that as the center
      if (startNode.curvedGroup !== undefined && startNode.curvedGroup == endNode.curvedGroup) {
         line.center = startNode.curvedGroup
                                .reduce( (center, node) => center.add(node.point), new THREE.Vector3() )
                                .multiplyScalar(1/startNode.curvedGroup.length);
         if (centerOK(line.center)) {
            return line.center;
         }
      }

      // if center not spec'd, or not OK, try (0,0,0); if that's OK, return that
      line.center = new THREE.Vector3(0, 0, 0);
      if (centerOK(line.center)) {
         return line.center;
      }

      // if (0,0,0)'s not OK, form (camera, start, end) plane, get unit normal
      line.center = new THREE.Vector3().crossVectors(this.camera.position.clone().sub(startPoint),
                                                     endPoint.clone().sub(startPoint)).normalize()
                             .add(startPoint.clone().add(endPoint).multiplyScalar(0.5));
      if (centerOK(line.center)) {
         return line.center;
      }

      console.log("can't find center for line curve!");  // debug
      line.center = undefined;
      return line.center;
   }

   updateArrowheads(diagram3D) {
      Log.log('updateArrowheads');

      const spheres = this.getGroup('spheres').children;
      const lines = this.getGroup('lines').children;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      const arrowheadPlacement = diagram3D.arrowheadPlacement;

      lines.forEach( (line) => {
         if (! line.userData.line.arrowhead) {
            return;
         }
         const lineData = line.userData.line,
               startNode = lineData.vertices[0],
               startPoint = startNode.point,
               endNode = lineData.vertices[1],
               endPoint = endNode.point,
               nodeRadius = spheres[endNode.element].geometry.parameters.radius,
               center2center = startPoint.distanceTo(endPoint),
               headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
               headWidth = 0.6 * headLength,
               arrowLength = 1.1 * headLength,
               color = lineData.color;
         if (center2center <= 2*nodeRadius) {
            return;
         }
         // 0.001 offset to make arrowhead stop at node surface
         let arrowStart, arrowDir;
         if (lineData.offset === undefined) {
            const length = center2center,
                  arrowPlace = 0.001 + (nodeRadius - 0.1*headLength + (length - 2*nodeRadius - headLength) * arrowheadPlacement) / length;
            arrowDir = endPoint.clone().sub(startPoint).normalize();
            arrowStart = new THREE.Vector3().addVectors(startPoint.clone().multiplyScalar(1-arrowPlace), endPoint.clone().multiplyScalar(arrowPlace));
         } else {
            const bezier = new THREE.QuadraticBezierCurve3(startPoint, lineData.middle, endPoint),
                  length = bezier.getLength(),
                  arrowPlace = 0.001 + (nodeRadius - 0.1*headLength + (length - 2*nodeRadius - headLength) * arrowheadPlacement)/length,
                  arrowTip = bezier.getPointAt(arrowPlace + headLength/length);
            arrowStart = bezier.getPointAt(arrowPlace);
            arrowDir = arrowTip.clone().sub(arrowStart).normalize();
         }
         const arrowhead = new THREE.ArrowHelper(arrowDir, arrowStart, arrowLength, color, headLength, headWidth);
         arrowheads.add(arrowhead);
      } )
   }

   updateChunking(diagram3D) {
      Log.log('updateChunking');

      // remove old chunks
      const chunks = this.getGroup('chunks');
      chunks.remove(...chunks.children);

      // find new chunk
      if (diagram3D.chunk === undefined) {
         return;
      }

      // utility functions
      const centroid = (points) => points.reduce( (sum, point) => sum.add(point), new THREE.Vector3() ).multiplyScalar(1/points.length);

      const getGeometry = () => {
         // get points of subgroup
         const strategy_index = diagram3D.chunk;
         const chunk_members = diagram3D.strategies[strategy_index].bitset;
         const chunk_points = chunk_members.toArray().map( (el) => diagram3D.nodes[el].point );
         const chunk_size = chunk_points.length;

         // find (x,y,z) extrema of subgroup nodes
         const [X_min, X_max, Y_min, Y_max, Z_min, Z_max] = chunk_points.reduce(
            ([Xm,XM,Ym,YM,Zm,ZM], p) => [Math.min(Xm,p.x),Math.max(XM,p.x),Math.min(Ym,p.y),Math.max(YM,p.y),Math.min(Zm,p.z),Math.max(ZM,p.z)],
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);

         let padding;
         if (chunk_size == diagram3D.group.order) {
            padding = 0.2 * Math.max(X_max - X_min, Y_max - Y_min, Z_max - Z_min);
         } else {
            const coset_membership = diagram3D.group
                                              .getCosets(chunk_members, true)
                                              .reduce( (mem, coset, inx) => {
                                                 coset.toArray().forEach( (el) => mem[el] = inx );
                                                 return mem;
                                              }, Array.from({length: chunk_size}) );
            padding = Math.sqrt(diagram3D.group.elements.reduce( (minsq, i) => {
               return diagram3D.group.elements.reduce( (minsq, j) => {
                  if (coset_membership[i] == coset_membership[j]) {
                     return minsq;
                  }
                  return Math.min(minsq, diagram3D.nodes[i].point.distanceToSquared(diagram3D.nodes[j].point));
               }, minsq)
            }, Number.POSITIVE_INFINITY ) ) / 3;  // set clearance to 1/3 of minimum distance from any node to any other node not in its coset
         }

         // make box
         const box_centroid = centroid(chunk_points);
         const sideLength = (max, min, center) => 2*(Math.max(Math.abs(max - center), Math.abs(min - center)) + padding);
         return new THREE.BoxGeometry(sideLength(X_max, X_min, box_centroid.x), sideLength(Y_max, Y_min, box_centroid.y), sideLength(Z_max, Z_min, box_centroid.z));
      }
      const box_geometry = getGeometry();

      const box_material = new THREE.MeshBasicMaterial( {
         color: 0x303030,
         opacity: 0.2,
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,  // needed to keep from obscuring labels underneath
         depthTest: false,
      } );

      let subgroup_name;  // MathML subgroup name, generated first time through
      const createChunks = (arr, desired, current = diagram3D.strategies.length - 1) => {
         if (current == desired) {
            const nodes = arr._flatten();
            const elements = new BitSet(diagram3D.group.order, nodes.map( (node) => node.element ));
            const points = nodes.map( (node) => node.point );
            const box = new THREE.Mesh(box_geometry, box_material);
            if (subgroup_name === undefined) {
               const subgroup_index = diagram3D.group.subgroups.findIndex( (subgroup) => subgroup.members.equals(elements) );
               subgroup_name = `<msub><mi>H</mi><mn>${subgroup_index}</mn></msub>`;
            }
            box.name = diagram3D.group.representation[nodes[0].element] + subgroup_name;
            box.position.set(...centroid(points).toArray());
            return [box];
         } else {
            const boxes = arr.map( (el) => createChunks(el, desired, current-1) );
            const all_boxes = boxes._flatten();
            const strategy = diagram3D.strategies[current];
            if (strategy.layout == CayleyDiagram.ROTATED_LAYOUT) {
               // find centroid of all boxes
               const center = centroid(all_boxes.map( (box) => box.position ));
               // calculate normalized vector from centroid of all boxes to centroid of boxes[0]
               const ref = centroid(boxes[0].map( (box) => box.position )).sub(center).normalize();
               // calculate normal to plane containing center, first, and second (and presumably all other) centroids
               const normal = centroid(boxes[1].map( (box) => box.position )).sub(center).normalize().cross(ref).normalize();
               boxes.forEach( (bxs) => {
                  // find angle between centroid of first box and centroid(bxs)
                  const curr = centroid(bxs.map( (box) => box.position )).sub(center).normalize();
                  if (Math.abs(1 - curr.dot(ref)) > 1e-6) {  // check that boxes aren't co-linear
                     const theta = Math.acos(ref.dot(curr))*Math.sign(normal.dot(new THREE.Vector3().crossVectors(ref,curr)));
                     bxs.forEach( (box) => box.rotateOnAxis(normal, theta) );
                  }
               } );
            }
            return all_boxes;
         }
      }

      chunks.add(...createChunks(diagram3D.ordered_nodes, diagram3D.chunk));
   }

   // Render graphics, recursing to animate if a TrackballControl is present
   render() {
      this.renderer.render(this.scene, this.camera);
      if (this.camControls !== undefined) {
         window.requestAnimationFrame( () => this.render() );
         this.camControls.update();
      }
   }

   updateZoomLevel(diagram3D) {
      this.camera.zoom = diagram3D.zoomLevel;
      this.camera.updateProjectionMatrix();
   }

   updateLineWidth(diagram3D) {
      this.updateLines(diagram3D);
   }

   updateNodeRadius(diagram3D) {
      this.updateNodes(diagram3D);
      this.updateLabels(diagram3D);
      this.updateArrowheads(diagram3D);
   }

   // reduce fog level by increasing 'far' parameter (experimentally determined coefficients :-)
   //   (diagram3D.fogLevel is in [0,1])
   updateFogLevel(diagram3D) {
      // distance of furthest point from (0,0,0)
      const squaredRadius = diagram3D.nodes.reduce( (sqrad,nd) => Math.max(sqrad, nd.point.lengthSq()), 0 );
      const sceneRadius = (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
      const cameraDistance = this.camera.position.length();
      this.scene.fog.color = new THREE.Color(diagram3D.background);
      this.scene.fog.near = cameraDistance - sceneRadius - 1;
      this.scene.fog.far = (diagram3D.fogLevel == 0) ? 100 : (cameraDistance + sceneRadius*(5 - 4*diagram3D.fogLevel));
   }

   updateLabelSize(diagram3D) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D) {
      this.updateArrowheads(diagram3D);
   }

   // get objects at point x,y using raycasting
   getObjectsAtPoint(x, y) {
      const mouse = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      let intersects = raycaster.intersectObjects(this.getGroup('spheres').children, false);
      if (intersects.length == 0) {
         intersects = raycaster.intersectObjects(this.getGroup('chunks').children, false);
      }

      return Array.from(new Set(intersects.map( (intersect) => intersect.object )));
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition ( element, cayleyDiagram ) {
      const point3d = cayleyDiagram.nodes[element].point.clone(),
            point2d = point3d.project( this.camera );
      return { x : point2d.x/2 + 1/2, y : -point2d.y/2 + 1/2 };
   }

   // two serialization functions
   toJSON ( cayleyDiagram ) {
      const tmp = {
         groupURL : cayleyDiagram.group.URL,
         _diagram_name : cayleyDiagram.diagram_name,
         highlights : cayleyDiagram.highlights,
         elements : cayleyDiagram.elements,
         zoomLevel : cayleyDiagram.zoomLevel,
         lineWidth : cayleyDiagram.lineWidth,
         nodeScale : cayleyDiagram.nodeScale,
         fogLevel : cayleyDiagram.fogLevel,
         labelSize : cayleyDiagram.labelSize,
         arrowheadPlacement : cayleyDiagram.arrowheadPlacement,
         arrowColors : cayleyDiagram.arrowColors,
         _camera : this.camera.matrix.toArray(),
         highlights : {
            background : cayleyDiagram.nodes.map( n => n.colorHighlight ),
            ring : cayleyDiagram.nodes.map( n => n.ringHighlight ),
            square : cayleyDiagram.nodes.map( n => n.squareHighlight )
         },
         strategies : cayleyDiagram.getStrategies(),
         arrows : cayleyDiagram.lines.map( x => x.arrow )
            .filter( ( v, i, s ) => s.indexOf( v ) === i ), // incl. each only 1x
         nodePositions : cayleyDiagram.nodes.map( node => {
            return { x : node.point.x, y : node.point.y, z : node.point.z };
         } ),
         nodeRadii : cayleyDiagram.nodes.map( node => node.radius ),
         chunkIndex : cayleyDiagram.chunk,
         arrowsData : cayleyDiagram.lines.map( ( arrow, index ) => {
            return { style : arrow.style, offset : arrow.offset };
         } )
      };
      // console.log( 'Sending:', tmp );
      return tmp;
   }
   fromJSON ( json, cayleyDiagram ) {
      // console.log( 'Received:', json );
      // no check for has own property, because we want to erase it
      // if it isn't included in the diagram
      cayleyDiagram.diagram_name = json._diagram_name;
      if ( json.hasOwnProperty( 'highlights' ) )
         cayleyDiagram.highlights = json.highlights;
      if ( json.hasOwnProperty( 'elements' ) )
         cayleyDiagram.elements = json.elements;
      if ( json.hasOwnProperty( 'zoomLevel' ) )
         cayleyDiagram.zoomLevel = json.zoomLevel;
      if ( json.hasOwnProperty( 'lineWidth' ) )
         cayleyDiagram.lineWidth = json.lineWidth;
      if ( json.hasOwnProperty( 'nodeScale' ) )
         cayleyDiagram.nodeScale = json.nodeScale;
      if ( json.hasOwnProperty( 'fogLevel' ) )
         cayleyDiagram.fogLevel = json.fogLevel;
      if ( json.hasOwnProperty( 'labelSize' ) )
         cayleyDiagram.labelSize = json.labelSize;
      if ( json.hasOwnProperty( 'arrowColors' ) )
         cayleyDiagram.arrowColors = json.arrowColors;
      if ( json.hasOwnProperty( 'arrowheadPlacement' ) )
         cayleyDiagram.arrowheadPlacement = json.arrowheadPlacement;
      if ( json.hasOwnProperty( 'strategies' ) )
         cayleyDiagram.setStrategies( json.strategies );
      if ( json.hasOwnProperty( 'arrows' ) ) {
         cayleyDiagram.removeLines();
         json.arrows.map( x => cayleyDiagram.addLines( x ) );
         cayleyDiagram.setLineColors();
      }
      if ( json.hasOwnProperty( '_camera' ) ) {
         this.camera.matrix.fromArray( json._camera );
         this.camera.matrix.decompose(
            this.camera.position,
            this.camera.quaternion,
            this.camera.scale
         );
      }
      if ( json.highlights && json.highlights.background )
         json.highlights.background.map( ( color, index ) => {
            cayleyDiagram.nodes[index].colorHighlight = color;
         } );
      if ( json.highlights && json.highlights.ring )
         json.highlights.ring.map( ( color, index ) => {
            cayleyDiagram.nodes[index].ringHighlight = color;
         } );
      if ( json.highlights && json.highlights.square )
         json.highlights.square.map( ( color, index ) => {
            cayleyDiagram.nodes[index].squareHighlight = color;
         } );
      if ( json.nodePositions )
         json.nodePositions.map( ( position, index ) => {
            cayleyDiagram.nodes[index].point.x = position.x;
            cayleyDiagram.nodes[index].point.y = position.y;
            cayleyDiagram.nodes[index].point.z = position.z;
         } );
      if ( json.nodeRadii )
         json.nodeRadii.map( ( radius, index ) =>
            cayleyDiagram.nodes[index].radius = radius );
      if ( json.hasOwnProperty( 'chunkIndex' ) )
         cayleyDiagram.chunk = json.chunkIndex;
      if ( json.arrowsData )
         json.arrowsData.map( ( arrow, index ) => {
            cayleyDiagram.lines[index].style = arrow.style;
            cayleyDiagram.lines[index].offset = arrow.offset;
         } );
   }
}

class Multtable {
   constructor(group) {
      this.group = group;
      this.reset();
   }

   static _init() {
      Multtable.COLORATION_RAINBOW = 'Rainbow';
      Multtable.COLORATION_GRAYSCALE = 'Grayscale';
      Multtable.COLORATION_NONE = 'None';
   }

   reset() {
      this.elements = this.group.cosetsArray(this.group.closureArray(this.group.generators[0])._flatten(), false)._flatten();
      this.separation = 0;
      this.coloration = Multtable.COLORATION_RAINBOW;
      this.colors = this.coloration;
      this.stride = this.group.order;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroup) {
      this.elements = this.group.cosetsArray(this.group.closureArray(subgroup.generators)._flatten(), false)._flatten();
      this.stride = subgroup.order;
      this.colors = this.coloration;
      return this;
   }

   setSeparation ( sep ) {
       this.separation = sep;
   }

   get colors() {
      return this.backgrounds || this._colors;
   }

   set colors(coloration) {
      const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);
      let fn;
      switch (coloration) {
         case Multtable.COLORATION_RAINBOW:
            fn = (inx) => `hsl(${frac(inx, 360, 0)}, 100%, 80%)`;
            break;
         case Multtable.COLORATION_GRAYSCALE:
            fn = (inx) => {
               const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
               return `rgb(${lev}, ${lev}, ${lev})`;
            };
            break;
         case Multtable.COLORATION_NONE:
            fn = (inx) => DisplayMulttable.BACKGROUND;
            break;
      }

      this._colors = this.elements
                         .map( (el,inx) => [inx, el] )
                         .sort( ([_a, x], [_b, y]) => x - y )
                         .map( ([inx,_]) => fn(inx) );
   }

   get size() {
      return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
   }

   position(index) {
      return (index < 0 || index > this.group.order) ? undefined : index + this.separation * Math.floor(index/this.stride);
   }

   index(position) {
      const inx = Math.floor(position - this.separation * Math.floor(position / (this.stride + this.separation)));
      return (inx < 0 || inx > this.group.order - 1) ? undefined : inx;
   }

   /*
    * Highlight routines
    *   if only one color is needed (a common case) make each highlight color different
    *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
    */
   highlightByBackground(elements) {
      this.backgrounds = new Array(this.group.order).fill(DisplayMulttable.BACKGROUND);
      elements.forEach( (els, colorIndex) => {
         const colorFraction = Math.round(360 * colorIndex / elements.length);
         const color = `hsl(${colorFraction}, 100%, 80%)`;
         els.forEach( (el) => this.backgrounds[el] = color );
      } );
   }

   highlightByBorder(elements) {
      this.borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this.borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this.borders[el] = color );
         } );
      }
   }

   highlightByCorner(elements) {
      this.corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this.corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         this.corners = new Array(this.group.order).fill(undefined);
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this.corners[el] = color );
         } );
      }
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
   }
}

Multtable._init();

class DisplayMulttable {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayMulttable');

      DisplayMulttable._setDefaults();

      if (options === undefined) {
         options = {};
      }
      this.options = options;

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      if (options.container !== undefined) {
         width = options.container.width();
         height = options.container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.canvas = $(`<canvas/>`)[0];
      this.setSize( width, height );
      this.context = this.canvas.getContext('2d');

      if (options.container !== undefined) {
         options.container.append(this.canvas);
      }
      this.zoom = 1;  // user-supplied scale factor multiplier
      this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
      this.transform = new THREE.Matrix3();  // current multtable -> screen transformation
   }

   setSize ( w, h ) {
      this.canvas.width = w;
      this.canvas.height = h;
   }
   getSize () {
      return { w : this.canvas.width, h : this.canvas.height };
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
      DisplayMulttable.ZOOM_STEP = 0.1;
      DisplayMulttable.MINIMUM_FONT = 2;
      DisplayMulttable.BACKGROUND = '#F0F0F0';
   }

   getImage(multtable,options) {
      // second parameter optional, defaults to { size : 'small' }
      if ( !options ) options = { size : 'small' };
      if ( options.size == 'large' )
         this.showLargeGraphic(multtable);
      else
         this.showSmallGraphic(multtable);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // Small graphic has no grouping, no labels, doesn't change canvas size
   showSmallGraphic(multtable) {
      const frac = (inx, max) => Math.round(max * inx / multtable.group.order);
      const colors = multtable._colors;

      const width = this.canvas.width;
      const height = this.canvas.height;
      multtable.elements.forEach( (i,inx) => {
         multtable.elements.forEach( (j,jnx) => {
            this.context.fillStyle = colors[multtable.group.mult(j,i)] || DisplayMulttable.BACKGROUND;
            this.context.fillRect(frac(inx, width), frac(jnx, height), frac(inx+1, width), frac(jnx+1, height));
         } )
      } )
   }

   // Write order X order matrix to canvas
   //   Resize canvas make labels readable
   //     Find longest label; find length of longest label as drawn
   //     Estimate the maximum number of rows that can occur (if a permutation is continued over multiple rows)
   //       if longest row is a permutation, expect that it can be formatted into a roughly square box
   //     Size the box so that it is
   //       at least 3 times the height of all the rows
   //       at least 25% longer than the longest row divided by the maximum number of rows expected
   //   Draw each box
   //     Color according to row/column product
   //     Write label in center, breaking permutation cycle text if necessary
   //
   // Separation slider maps [0,full scale] => [0, multtable.size]
   showLargeGraphic(multtable) {
      if (multtable != this.multtable) {
         this.multtable = multtable;
         this.permutationLabels = (multtable.group.longestLabel[0] == '(') ? Array(multtable.group.order) : undefined;
      }

      // note that background shows through in separations between cosets
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.fillStyle = DisplayMulttable.BACKGROUND;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // set up scaling, translation from multtable units to screen pixels
      const scale = this.zoom * Math.min(this.canvas.width / multtable.size, this.canvas.height / multtable.size, 200);

      // translate center of scaled multtable to center of canvas
      let x_translate = (this.canvas.width - scale*multtable.size)/2;
      let y_translate = (this.canvas.height - scale*multtable.size)/2;
      this.context.setTransform(scale, 0, 0, scale, x_translate + this.translate.dx, y_translate + this.translate.dy);

      // find pre-image of screen so we don't iterate over elements that aren't displayed
      this.transform.set(scale, 0,     x_translate + this.translate.dx,
                         0,     scale, y_translate + this.translate.dy,
                         0,     0,     1);
      const UL = new THREE.Vector2(0, 0).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const LR = new THREE.Vector2(this.canvas.width, this.canvas.height).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const minX = multtable.index(UL.x) || 0;
      const minY = multtable.index(UL.y) || 0;
      const maxX = (multtable.index(LR.x) + 1) || multtable.group.order;
      const maxY = (multtable.index(LR.y) + 1) || multtable.group.order;

      for (let inx = minX; inx < maxX; inx++) {
         for (let jnx = minY; jnx < maxY; jnx++) {
            const x = multtable.position(inx);
            const y = multtable.position(jnx);

            const product = multtable.group.mult(multtable.elements[jnx], multtable.elements[inx]);

            // color box according to product
            this.context.fillStyle = multtable.colors[product] || DisplayMulttable.BACKGROUND;
            this.context.fillRect(x, y, 1, 1);

            // draw borders if cell has border highlighting
            if (multtable.borders !== undefined && multtable.borders[product] !== undefined) {
               this._drawBorder(x, y, scale, multtable.borders[product]);
            }

            // draw corner if cell has corner highlighting
            if (multtable.corners !== undefined && multtable.corners[product] !== undefined) {
               this._drawCorner(x, y, scale, multtable.corners[product]);
            }
         }
      }

      // calculate font size to fit longest label
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.font = '14pt Arial';
      const longestLabelWidth =  this.context.measureText(multtable.group.longestLabel).width;
      const labelBoxWidth = (this.permutationLabels === undefined) ? longestLabelWidth : Math.sqrt(50*longestLabelWidth);
      const fontScale = Math.min(50, 11 * scale/labelBoxWidth, scale / 3);

      // don't render labels if font is too small
      if (fontScale < DisplayMulttable.MINIMUM_FONT) {
         return;
      }

      this.context.font = `${fontScale.toFixed(6)}pt Arial`;
      this.context.textAlign = (this.permutationLabels === undefined) ? 'center' : 'left';
      this.context.fillStyle = 'black';
      this.context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

      for (let inx = minX; inx < maxX; inx++) {
         for (let jnx = minY; jnx < maxY; jnx++) {
            const x = multtable.position(inx);
            const y = multtable.position(jnx);
            const product = multtable.group.mult(multtable.elements[jnx], multtable.elements[inx]);
            this._drawLabel(x, y, product, scale, fontScale);
         }
      }
   }

   _drawBorder(x, y, scale, color) {
      this.context.beginPath();
      this.context.strokeStyle = color;
      this.context.lineWidth = 2 / scale;
      this.context.moveTo(x, y+1-1/scale);
      this.context.lineTo(x, y);
      this.context.lineTo(x+1-1/scale, y);
      this.context.stroke();

      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 1 / scale;
      this.context.moveTo(x+2.5/scale, y+1-2.5/scale);
      this.context.lineTo(x+2.5/scale, y+2.5/scale);
      this.context.lineTo(x+1-2.5/scale, y+2.5/scale);
      this.context.lineTo(x+1-2.5/scale, y+1-2./scale);
      this.context.closePath();
      this.context.stroke();
   }

   _drawCorner(x, y, scale, color) {
      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.moveTo(x, y);
      this.context.lineTo(x+0.2, y);
      this.context.lineTo(x, y+0.2);
      this.context.fill();
   }

   _drawLabel(x, y, element, scale, fontScale) {
      const width = (text) => (text === undefined) ? 0 : this.context.measureText(text).width;

      const label = this.multtable.group.labels[element];
      if (this.permutationLabels === undefined) {
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         this.context.fillText(label, labelLocation.x, labelLocation.y);
      } else {    // break permutations into multiple lines
         if (this.permutationLabels[element] === undefined) {   // seen this label before?
            const lines = [];

            // split whole label into multiple lines if needed
            const cycles = label.match(/[(][^)]*[)]/g);
            let last = 0;
            for (const cycle of cycles) {
               if (width(lines[last]) + width(cycle) < 0.8 * scale) {
                  lines[last] = (lines[last] === undefined) ? cycle : lines[last].concat(cycle);
               } else {
                  if (lines[last] !== undefined) {
                     last++;
                  }
                  if (width(cycle) < 0.8 * scale) {
                     lines[last] = cycle;
                  } else {
                     // cut cycle up into row-sized pieces
                     const widthPerCharacter = width(cycle) / cycle.length;
                     const charactersPerLine = Math.ceil(0.8 * scale / widthPerCharacter);
                     for (let c = cycle;;) {
                        if (width(c) < 0.8 * scale) {
                           lines[last++] = c;
                           break;
                        } else {
                           lines[last++] = c.slice(0, c.lastIndexOf(' ', charactersPerLine));
                           c = c.slice(c.lastIndexOf(' ', charactersPerLine)).trim();
                        }
                     }
                  }
               }
            }
            // store multi-line permutation label so it doesn't have to be calculated again
            this.permutationLabels[element] = lines;
         }

         const fontHeight = fontScale * 19 / 14;
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         const permutationLabel = this.permutationLabels[element];
         const maxLineWidth = permutationLabel.reduce( (max, line) => Math.max(max, width(line)), 0 );
         let xStart = labelLocation.x - maxLineWidth/2;
         let yStart = labelLocation.y - fontHeight*(permutationLabel.length - 1)/2;
         for (const line of permutationLabel) {
            this.context.fillText(line, xStart, yStart);
            yStart += fontHeight;
         }
      }
   }

   // interface for zoom-to-fit GUI command
   reset() {
      this.zoom = 1;
      this.translate = {dx: 0, dy: 0};
   }

   // increase magnification proportional to its current value,
   zoomIn() {
      this._centeredZoom((1 + DisplayMulttable.ZOOM_STEP) - 1);
   }

   // decrease magnification in a way that allows you to zoom in and out and return to its original value
   zoomOut() {
      this._centeredZoom(1/(1 + DisplayMulttable.ZOOM_STEP) - 1);
   }

   // changing the translation keeps the center of the model centered in the canvas
   _centeredZoom(dZoom) {
      this.zoom = this.zoom * (1 + dZoom);
      this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
   }

   // deltaX, deltaY are in screen coordinates
   move(deltaX, deltaY) {
      this.translate.dx += deltaX;
      this.translate.dy += deltaY;
   }

   // given screen coordinates, returns element associated with box, or 'undefined'
   select(screenX, screenY) {
      // compute cycleGraph coordinates from screen coordinates by inverting this.transform
      const mult = new THREE.Vector2(screenX, screenY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const x = this.multtable.index(mult.x);
      const y = this.multtable.index(mult.y);
      return (x === undefined || y === undefined) ? undefined : {x: x, y: y};
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition ( element, multtable ) {
      const max = multtable.position( multtable.group.order - 1 ) + 1;
      const index = multtable.elements.indexOf( element );
      return { x : 0.5 / max, y : ( multtable.position( index ) + 0.5 ) / max };
   }

   // two serialization functions
   toJSON ( multtable ) {
      return {
         groupURL : multtable.group.URL,
         separation : multtable.separation,
         colors : multtable._colors,
         stride : multtable.stride,
         elements : multtable.elements,
         highlights : {
            background : multtable.backgrounds,
            border : multtable.borders,
            corner : multtable.corners
         }
      };
   }
   fromJSON ( json, multtable ) {
      if ( json.separation ) multtable.separation = json.separation;
      if ( json.colors ) multtable._colors = json.colors;
      if ( json.stride ) multtable.stride = json.stride;
      if ( json.elements ) multtable.elements = json.elements;
      if ( json.highlights && json.highlights.background )
         multtable.backgrounds = json.highlights.background;
      if ( json.highlights && json.highlights.border )
         multtable.borders = json.highlights.border;
      if ( json.highlights && json.highlights.corner )
         multtable.corners = json.highlights.corner;
   }
}

class CycleGraph {
   constructor(group) {
      this.group = group;
      this.layOutElementsAndPaths();
      this.findClosestTwoPositions();
      this.reset();
   }

   static _init() {
      CycleGraph.SOME_SETTING_NAME = 'its default value';
   }

   // gcd of two natural numbers
   static gcd( n, m ) { return m ? CycleGraph.gcd( m, n % m ) : n; }

   // orbit of an element in the group, but skipping the identity
   orbitOf( g ) {
      var result = [ 0 ];
      var next;
      while ( next = this.group.mult( result[result.length-1], g ) )
         result.push( next );
      result.shift();
      return result;
   }

   // element to a power
   raiseToThe( h, n ) {
      var result = 0;
      for ( var i = 0 ; i < n ; i++ ) result = this.group.mult( result, h );
      return result;
   }

   // how soon does the orbit of g intersect the given list of elements?
   // that is, consider the smallest power of g that appears in the array;
   // at what index does it appear?
   howSoonDoesOrbitIntersect( g, array ) {
      var orbit = this.orbitOf( g );
      var power = 0;
      for ( var walk = g ; walk != 0 ; walk = this.group.mult( walk, g ) ) {
         ++power;
         var index = array.indexOf( walk );
         if ( index > -1 ) return index;
      }
      return -1;
   }

   // Given elements g,h in this.group, find the "best power of h relative
   // to g," meaning the power t such that the orbit [e,h^t,h^2t,...]
   // intersects the orbit [e,g,g^2,...] as early as possible (in the orbit
   // of g).
   bestPowerRelativeTo( h, g ) {
      var orbit_g = this.orbitOf( g );
      var bestPower = 0;
      var bestIndex = orbit_g.length;
      var hToThePower = 0;
      for ( var t = 1 ; t < this.group.elementOrders[h] ; t++ ) {
         hToThePower = this.group.mult( hToThePower, h );
         if ( CycleGraph.gcd( t, this.group.elementOrders[h] ) == 1 ) {
            var index = this.howSoonDoesOrbitIntersect(
               hToThePower, orbit_g );
            if ( index < bestIndex ) {
               bestIndex = index;
               bestPower = t;
            }
         }
      }
      // return it
      return bestPower;
   }

   // ease-in-out curves, one going uphill from (0,0) to (1,1)
   static easeUp( t ) {
      return ( Math.cos( ( 1 - t ) * Math.PI ) + 1 ) / 2;
   }
   // and another going downhill, from (0,1) to (1,0)
   static easeDown( t ) { return 1 - CycleGraph.easeUp( 1 - t ); }

   // generic linear interpolation function
   static interp( A, B, t ) { return ( 1 - t ) * A + t * B; }

   // mutating a point in the upper half plane to sit within the arc
   // defined by two given angles alpha and beta, pulled toward the
   // center of that arc with a specific level of gravity, 0<=g<=1.
   static mutate( x, y, alpha, beta, g ) {
      var r = Math.sqrt( x*x + y*y );
      var theta = Math.atan2( y, x );
      var theta2 = CycleGraph.interp( alpha, beta, theta/Math.PI );
      var x2 = r * Math.cos( theta2 );
      var y2 = r * Math.sin( theta2 );
      var cx = Math.cos( ( alpha + beta ) / 2 ) / 2;
      var cy = Math.sin( ( alpha + beta ) / 2 ) / 2;
      return {
         x : CycleGraph.interp( x2, cx, g ),
         y : CycleGraph.interp( y2, cy, g )
      };
   }

   reset() {
      this.elements = this.group.elements.slice();
      this.SOME_SETTING_NAME = CycleGraph.SOME_SETTING_NAME;
   }

   layOutElementsAndPaths() {
      // sort the elements by the length of their name, as text
      var eltsByName = this.group.elements.slice();
      if ( this.group.representations ) {
         eltsByName.sort( ( a, b ) => {
            var aName = this.group.representations[this.group.representationIndex][a];
            var bName = this.group.representations[this.group.representationIndex][b];
            aName.length < bName.length ? -1 :
            aName.length > bName.length ?  1 : 0
         } );
      }
      // for ( var i = 0 ; i < this.group.order ; i++ ) console.log( i, this.group.representations[this.group.representationIndex][i] );

      // compute a list of cycles
      var cycles = [ ];
      var notYetPlaced = eltsByName.slice();
      notYetPlaced.splice( notYetPlaced.indexOf( 0 ), 1 );
      while ( notYetPlaced.length > 0 ) {
         // find the element with the maximum order
         var eltWithMaxOrder = notYetPlaced[0];
         notYetPlaced.forEach( unplaced => {
            if ( this.group.elementOrders[unplaced]
               > this.group.elementOrders[eltWithMaxOrder] )
               eltWithMaxOrder = unplaced;
         } );
         // add its orbit to the list of cycles
         var nextCycle = this.orbitOf( eltWithMaxOrder );
         cycles.push( nextCycle );
         // remove all its members from the notYetPlaced array
         var old = notYetPlaced.slice();
         notYetPlaced = [ ];
         old.forEach( maybeUnplaced => {
            if ( nextCycle.indexOf( maybeUnplaced ) == -1 )
               notYetPlaced.push( maybeUnplaced );
         } );
         // continue iff there's stuff left in the notYetPlaced array
      }
      this.cycles = cycles;
      // console.log( 'cycle', JSON.stringify( cycles ) );

      // partition the cycles, forming a list of lists.
      // begin with all cycles in their own part of the partition,
      // and we will unite parts until we can no longer do so.
      var partition = cycles.map( cycle => [ cycle ] );
      var that = this;
      function uniteParts ( partIndex1, partIndex2 ) {
         partition[partIndex2].forEach( cycle => {
            var cycleGen = cycle[0];
            var partGen = partition[partIndex1][0][0];
            var replacement = that.raiseToThe( cycleGen,
               that.bestPowerRelativeTo( cycleGen, partGen ) );
            partition[partIndex1].push( that.orbitOf( replacement ) );
         } );
         partition.splice( partIndex2, 1 );
      }
      function flattenPart ( part ) {
         return part.reduce( ( acc, cur ) => acc.concat( cur ) );
      }
      function arraysIntersect ( a1, a2 ) {
         return a1.findIndex( elt => a2.indexOf( elt ) > -1 ) > -1;
      }
      var keepChecking = true;
      while ( keepChecking ) {
         keepChecking = false;
         for ( var i = 0 ; !keepChecking && i < partition.length ; i++ ) {
            for ( var j = 0 ; !keepChecking && j < i ; j++ ) {
               if ( arraysIntersect( flattenPart( partition[i] ),
                                     flattenPart( partition[j] ) ) ) {
                  uniteParts( i, j );
                  keepChecking = true;
               }
            }
         }
      }
      // console.log( 'partition', JSON.stringify( partition ) );
      // sanity check:
      // partition.forEach( ( part, i ) => {
      //    partition.forEach( ( otherPart, j ) => {
      //       if ( i > j ) return;
      //       part.forEach( ( cycle, ii ) => {
      //          otherPart.forEach( ( otherCycle, jj ) => {
      //             const inSamePart = ( i == j );
      //             const commonElt = cycle.find( ( x ) => otherCycle.indexOf( x ) > -1 );
      //             if ( !inSamePart && typeof( commonElt ) != 'undefined' ) {
      //                console.error( `Cycle ${ii} in part ${i} is ${cycle} `
      //                             + `and cycle ${jj} in part ${j} is ${otherCycle} `
      //                             + `and they share ${commonElt}.` );
      //             }
      //          } );
      //       } );
      //    } );
      // } );

      // assign arc sizes to parts of the partition
      // (unless there is only one part, the degenerate case)
      if ( partition.length > 1 ) {
         // find the total sizes of all cycles in each part
         var partSizes = [ ];
         for ( var i = 0 ; i < partition.length ; i++ ) {
            var size = 0;
            for ( var j = 0 ; j < partition[i].length ; j++ )
               size += partition[i][j].length;
            partSizes.push( size );
         }
         // assign angles proportional to those sizes,
         // but renormalize to cap the max at 180 degrees if needed
         var total = 0;
         partSizes.forEach( x => total += x );
         var max = Math.max.apply( null, partSizes );
         if ( max > total / 2 ) {
            var diff = max - total / 2;
            partSizes = partSizes.map( x => Math.min( x, total / 2 ) );
            total -= diff;
         }
         var angles = partSizes.map( x => x * 2 * Math.PI / total );
         var cumsums = [ 0 ];
         for ( var i = 0 ; i < angles.length ; i++ )
            cumsums.push( cumsums[i] + angles[i] );
      } else { // handle degenerate case
         var cumsums = [ 0, Math.PI ];
      }
      // console.log( 'cumsums', cumsums );

      // rotate things so that the largest partition is hanging
      // straight downwards
      var maxPartLength = 0;
      var maxPartIndex = -1;
      partition.forEach( ( part, idx ) => {
         if ( part.length > maxPartLength ) {
            maxPartLength = part.length;
            maxPartIndex = idx;
         }
      } );
      var maxPartCenter =
         ( cumsums[maxPartIndex] + cumsums[maxPartIndex+1] ) / 2;
      var diff = -1 / 2 * Math.PI - maxPartCenter;
      cumsums = cumsums.map( angle => angle + diff );
      // console.log( 'angle-ified', cumsums );

      // assign locations in the plane to each element,
      // plus create paths to be drawn to connect them
      this.positions = [ { x : 0, y : 0 } ]; // identity at origin
      while ( this.positions.length < this.group.order )
         this.positions.push( null ); // to show we haven't computed them yet
      this.rings = [ ];
      while ( this.rings.length < this.group.order ) this.rings.push( 0 );
      this.cyclePaths = [ ];
      this.partIndices = [ ];
      partition.forEach( ( part, partIndex ) => {
         // compute the peak of each part's "flower petal" curve
         var r = part.length / maxPartLength;
         var R = Math.sqrt( Math.max( r, 0.25 ) );
         part.forEach( ( cycle, cycleIndex ) => {
            var f = ( ringNum, idx, t ) => {
               var theta = 2 * Math.PI
                         * ( ( idx + t ) / ( cycle.length + 1 ) - 0.25 );
               return CycleGraph.mutate(
                  -R * Math.cos( theta ),
                  R * ( 1 + Math.sin( theta ) ),
                  cumsums[partIndex], cumsums[partIndex+1],
                  ringNum / part.length
               );
            };
            for ( i = 0 ; i <= cycle.length ; i++ ) {
               var prev = ( i == 0 ) ? 0 : cycle[i-1];
               var curr = ( i == cycle.length ) ? 0 : cycle[i];
               if ( !this.positions[curr] ) {
                   this.partIndices[curr] = partIndex;
                   this.rings[curr] = cycleIndex;
                   // console.log( `rings[${curr}] := ${cycleIndex}` );
                   this.positions[curr] = f( this.rings[curr], i, 1 );
               }
               var path = [ ];
               const step = 0.02;
               // console.log( `connecting ${this.rings[prev]} to ${this.rings[curr]}` );
               // if ( prev && curr && this.partIndices[prev] != this.partIndices[curr] )
               //    console.error( `index[${prev}]=${this.partIndices[prev]}!=${this.partIndices[curr]}=index[${curr}]` );
               for ( var t = 0 ; t <= 1+step/2 ; t += step ) {
                  var ring1 = f( this.rings[prev], i, t );
                  var ring2 = f( this.rings[curr], i, t );
                  var et = CycleGraph.easeUp( t );
                  path.push( {
                     x : CycleGraph.interp( ring1.x, ring2.x, et ),
                     y : CycleGraph.interp( ring1.y, ring2.y, et )
                  } );
               }
               path.partIndex = partIndex;
               path.part = part;
               path.cycleIndex = cycleIndex;
               path.cycle = cycle;
               path.pathIndex = i;
               this.cyclePaths.push( path );
            }
         } );
      } );

      // enable rescaling to a bounding box of [-1,1]^2
      this.bbox = { left : 0, right : 0, top : 0, bottom : 0 };
      this.cyclePaths.forEach( points => {
         points.forEach( pos => {
            this.bbox.top = Math.max( this.bbox.top, pos.y );
            this.bbox.bottom = Math.min( this.bbox.bottom, pos.y );
            this.bbox.left = Math.min( this.bbox.left, pos.x );
            this.bbox.right = Math.max( this.bbox.right, pos.x );
         } );
      } );
   }

   // convenience function used to convert a partition of the group
   // into color data for highlighting, used by all three highlight
   // functions, below.
   _partitionToColorArray( partition, start ) {
      var result = Array(this.group.order).fill(undefined);
      if ( typeof( start ) == 'undefined' ) start = 0;
      partition.forEach( ( part, partIndex ) => {
         var colorFraction = Math.round(
            start + 360 * partIndex / partition.length );
         var color = `hsl(${colorFraction},100%,80%)`;
         part.forEach( ( element, eltIndex ) => {
            result[element] = color;
         } );
      } );
      return result;
   }

   // Shortest distance between two vertices in the diagram
   findClosestTwoPositions() {
      this.closestTwoPositions = Infinity;
      const order = this.group.order;
      for (let i = 0; i < order-1; i++) {
         const pos1 = this.positions[i];
         for (let j = i+1; j < order; j++) {
            const pos2 = this.positions[j];
            this.closestTwoPositions = Math.min( this.closestTwoPositions, Math.sqrt(
               ( pos1.x - pos2.x ) * ( pos1.x - pos2.x )
               + ( pos1.y - pos2.y ) * ( pos1.y - pos2.y ) ) );
         }
      }
   }

   highlightByBackground(partition) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.background =
         this._partitionToColorArray( partition, 0 );
   }

   highlightByBorder(partition) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.border =
         this._partitionToColorArray( partition, 120 );
   }

   highlightByTop(partition) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.top =
         this._partitionToColorArray( partition, 240 );
   }

   clearHighlights() {
      this.highlights = { };
   }
}

CycleGraph._init();


class DisplayCycleGraph {

   constructor(options) {
      Log.log('DisplayCycleGraph');

      DisplayCycleGraph._setDefaults();

      if (options === undefined) {
         options = {};
      }

      let width = (options.width === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_WIDTH : options.width;
      let height = (options.height === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_HEIGHT : options.height;
      if (options.container !== undefined) {
         // take canvas dimensions from container (if specified), option, or default
         width = options.container.width();
         height = options.container.height();
      }
      this.canvas = $(`<canvas/>`)[0];
      this.setSize( width, height );
      this.context = this.canvas.getContext('2d');
      this.options = options;
      if ( options.container !== undefined) {
         options.container.append(this.canvas);
      }
      this.zoom = 1;  // user-supplied scale factor multiplier
      this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
      this.transform = new THREE.Matrix3();  // current cycleGraph -> screen transformation
   }

   setSize ( w, h ) {
      this.canvas.width = w;
      this.canvas.height = h;
   }
   getSize () {
      return { w : this.canvas.width, h : this.canvas.height };
   }

   static _setDefaults() {
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_HEIGHT = 200;
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_WIDTH = 200;
      DisplayCycleGraph.DEFAULT_MIN_RADIUS = 30;
      DisplayCycleGraph.DEFAULT_ZOOM_STEP = 0.1;  // zoom in/zoom out step
   }

   getImage(cycleGraph,large) { // second parameter optional, defaults to small
      if ( large )
         this.showLargeGraphic(cycleGraph);
      else
         this.showSmallGraphic(cycleGraph);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // This function makes a small graphic by doing the exact same thing
   // it would do to create a large graphic, with one exception:
   // It passes an optional second parameter to that routine, so that
   // it hides all element names, thus making the vertices in the graph
   // much smaller, and thus the image itself much smaller as well.
   showSmallGraphic(cycleGraph) {
      this.showLargeGraphic( cycleGraph, true );
   }

   // Draws the visualization at an optimal (large) size.
   // All the data needed about the group and how to lay it out in the
   // plane has been computed at construction time by the cycleGraph
   // object, and we can leverage that here and just do drawing.
   // The second parameter, which defaults to true, says whether to omit
   // the names inside the elements.  (False == normal behavior, true
   // == a smaller graphic in the end, useful for thumbnails.)
   showLargeGraphic(cycleGraph, hideNames = false) {
      // save the cycle graph for use by other members of this object
      this.cycleGraph = cycleGraph;

      const bbox = cycleGraph.bbox;

      // paint the background
      this.context.setTransform(1, 0, 0, 1, 0, 0);  // reset the transform, so repeated calls paint entire background
      this.context.fillStyle = '#C8C8E8';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // calculate node radius in cycleGraph units
      const max_cg_dimension = Math.max(bbox.right - bbox.left, bbox.top - bbox.bottom);
      const pixels2cg = (val) => val * Math.min((bbox.right-bbox.left)/this.canvas.width, (bbox.top-bbox.bottom)/this.canvas.height);
      const bestSize = (r) => r*Math.max(10, 8 + 2.5*max_cg_dimension/cycleGraph.closestTwoPositions, 200/r); // min size = 200
      if (hideNames) {
         this.radius = pixels2cg(6 * this.canvas.width / bestSize(6));  // size for nodes in thumbnails
      } else {
         this.radius = Math.min(cycleGraph.closestTwoPositions/2.5, max_cg_dimension/10);
      }

      // set up scaling, translation from cycleGraph units to screen pixels
      // leave room around bbox for node radius + space (which we set to another node radius)
      const margin = 2 * this.radius;
      // canvas / bbox ratio
      const raw_scale = Math.min(this.canvas.width / (bbox.right - bbox.left + 2 * margin),
                                 this.canvas.height / (bbox.top - bbox.bottom + 2 * margin) );
      // scale with zoom
      let scale = this.zoom * raw_scale;

      // translate center of scaled bbox to center of canvas
      let x_translate = (this.canvas.width - scale*(bbox.right + bbox.left))/2;
      let y_translate = (this.canvas.height - scale*(bbox.top + bbox.bottom))/2;

      // algorithm doesn't cover trivial group, treat it specially
      if (this.cycleGraph.group.order == 1) {
         const sideLength = Math.min(this.canvas.width, this.canvas.height);
         this.radius = sideLength / 10;
         scale = this.zoom * sideLength / (sideLength + 4 * this.radius);
         x_translate = this.canvas.width / 2;
         y_translate = this.canvas.height / 2;
      }

      // set transform to include translation generated by user drag-and-drop
      this.context.setTransform(scale, 0, 0, scale, x_translate + this.translate.dx, y_translate + this.translate.dy);

      // transform used to position the labels in screen space
      //   calculated even if we don't render labels because they're too small,
      //   since select method also uses this to determine element from node click
      this.transform.set(scale, 0,     x_translate + this.translate.dx,
                         0,     scale, y_translate + this.translate.dy,
                         0,     0,     1);
      // calculate the pre_image of the screen, in order to skip drawing labels on nodes not in view
      const upper_left = new THREE.Vector2(0, 0).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const lower_right = new THREE.Vector2(this.canvas.width, this.canvas.height).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const pre_image = {minX: upper_left.x, minY: upper_left.y, maxX: lower_right.x, maxY: lower_right.y};

      // draw all the paths first, because they're behind the vertices
      this.context.lineWidth = 1/scale;
      cycleGraph.cyclePaths.forEach( points => {
         var isDrawing = true; // was the last
         this.context.beginPath();
         points.forEach( ( point, index ) => {
            // is the current point in the view?
            var pointVisible = point.x > pre_image.minX && point.x < pre_image.maxX
                            && point.y > pre_image.minY && point.y < pre_image.maxY;
            if ( index == 0 ) {
                // always move to the start of the path
                this.context.moveTo( point.x, point.y );
            } else if ( isDrawing ) {
                // the entire line segment from index-1 to index is visible; draw it,
                // and you can assume that we already did lineTo() the last point.
                this.context.lineTo( point.x, point.y );
            } else if ( pointVisible ) {
                // the previous point was out of view but this one is in view; draw it,
                // but you can't assume taht we already did lineTo() the last point.
                var prev = points[index-1];
                this.context.moveTo( prev.x, prev.y );
                this.context.lineTo( point.x, point.y );
            }
            // update isDrawing to reflect whether the last drawn point was in the view
            isDrawing = pointVisible;
         } );
         this.context.stroke();
      } );

      // draw all elements as vertices, on top of the paths we just drew
      cycleGraph.positions.forEach( ( pos, elt ) => {
         // skip nodes that are off screen
         if ( pos.x + this.radius < pre_image.minX || pos.x - this.radius > pre_image.maxX
           || pos.y + this.radius < pre_image.minY || pos.y - this.radius > pre_image.maxY )
            return;
         // draw the background, defaulting to white, but using whatever
         // highlighting information for backgrounds is in the cycleGraph
         this.context.beginPath();
         this.context.arc( pos.x, pos.y, this.radius, 0, 2 * Math.PI );
         if ( cycleGraph.highlights && cycleGraph.highlights.background
           && cycleGraph.highlights.background[elt] ) {
            this.context.fillStyle = cycleGraph.highlights.background[elt];
         } else {
            this.context.fillStyle = '#fff';
         }
         this.context.fill();

         // over the background, only if there is "top"-style highlighting,
         // draw a little cap on the top of the vertex's circle
         if ( cycleGraph.highlights && cycleGraph.highlights.top
           && cycleGraph.highlights.top[elt] ) {
            this.context.beginPath();
            this.context.arc( pos.x, pos.y, this.radius, -3*Math.PI/4, -Math.PI/4 );
            this.context.fillStyle = cycleGraph.highlights.top[elt];
            this.context.fill();
         }

         // draw the border around the node, defaulting to thin black,
         // but using whatever highlighting information for borders is
         // in the cycleGraph, and if it's there, making it thick
         this.context.beginPath();
         this.context.arc( pos.x, pos.y, this.radius, 0, 2 * Math.PI );
         if ( cycleGraph.highlights && cycleGraph.highlights.border
           && cycleGraph.highlights.border[elt] ) {
            this.context.strokeStyle = cycleGraph.highlights.border[elt];
            this.context.lineWidth = 5/scale;
         } else {
            this.context.strokeStyle = '#000';
            this.context.lineWidth = 1/scale;
         }
         this.context.stroke();
      } );

      // all done except for labels
      if (hideNames) {
         return;
      }

      // pick sensible font size and style for node labels
      // find longest rep, find it's size in 14pt font, and choose a font size that lets rep fit within the default node
      // (this is done in screen coordinates because scaling text from cycleGraph coordinates had too many gotchas -- rwe)
      this.context.setTransform(1,0,0,1,0,0);
      this.context.font = '14pt Arial';
      const longest_label_length = this.context.measureText(cycleGraph.group.longestLabel).width;

      // "1" is to make short, tall names (like g^2) fit heightwise
      // "22" is a magic number that combines diameter/radius, effect of curved edges, point/pixel ratio, etc.
      //   -- but don't make font bigger than 50pt in any case
      const fontScale = Math.min(50, scale * this.radius * Math.min(1, 22 / longest_label_length));

      // skip out if this font would be too small to see anyhow
      if (fontScale < 1.5) {
         return;
      }

      // now draw all the labels, skipping nodes outside of the pre_image
      this.context.font = `${fontScale.toFixed(6)}pt Arial`;
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = '#000';

      const pos_vector = new THREE.Vector2();
      cycleGraph.positions.forEach( ( pos, elt ) => {
         // skip nodes that are off the screen
         if (   pos.x < pre_image.minX || pos.x > pre_image.maxX
             || pos.y < pre_image.minY || pos.y > pre_image.maxY) {
            return;
         }

         // write the element name inside it
         const loc = pos_vector.set(pos.x, pos.y).applyMatrix3(this.transform);
         this.context.fillText( cycleGraph.group.labels[elt], loc.x, loc.y );
      } );
   }

   // interface for zoom-to-fit GUI command
   reset() {
      this.zoom = 1;
      this.translate = {dx: 0, dy: 0};
   }

   // increase magnification proportional to its current value,
   zoomIn() {
      this._centeredZoom((1 + DisplayCycleGraph.DEFAULT_ZOOM_STEP) - 1);
   }

   // decrease magnification in a way that allows you to zoom in and out and return to its original value
   zoomOut() {
      this._centeredZoom(1/(1 + DisplayCycleGraph.DEFAULT_ZOOM_STEP) - 1);
   }

   // changing the translation keeps the center of the model centered in the canvas
   _centeredZoom(dZoom) {
      this.zoom = this.zoom * (1 + dZoom);
      this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
   }

   // deltaX, deltaY are in screen coordinates
   move(deltaX, deltaY) {
      this.translate.dx += deltaX;
      this.translate.dy += deltaY;
   }

   // given screen coordinates, returns element associated with node,
   //   or 'undefined' if not within one radius
   select(screenX, screenY) {
      // compute cycleGraph coordinates from screen coordinates by inverting this.transform
      const cg_coords = new THREE.Vector2(screenX, screenY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const index = this.cycleGraph.positions.findIndex( (pos) =>
         Math.sqrt( Math.pow( pos.x - cg_coords.x, 2 ) + Math.pow( pos.y - cg_coords.y, 2 ) ) < this.radius
      );
      return (index == -1) ? undefined : index;
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition ( element, cycleGraph ) {
      const virtualCoords = new THREE.Vector3( cycleGraph.positions[element].x,
                                               cycleGraph.positions[element].y, 0 ),
            // multiplying a transform by a vector does not translate it, unfortunately:
            untranslatedCanvasCoords = virtualCoords.applyMatrix3( this.transform ),
            // so we do the translation manually:
            translatedCanvasCoords = {
               x : this.transform.elements[6] + untranslatedCanvasCoords.x,
               y : this.transform.elements[7] + untranslatedCanvasCoords.y
            };
      return { x : translatedCanvasCoords.x / this.canvas.width,
               y : translatedCanvasCoords.y / this.canvas.height };
   }

   // two serialization functions
   toJSON ( cycleGraph ) {
      return {
         groupURL : cycleGraph.group.URL,
         highlights : cycleGraph.highlights,
         elements : cycleGraph.elements
      };
   }
   fromJSON ( json, cycleGraph ) {
      cycleGraph.highlights = json.highlights;
      cycleGraph.elements = json.elements;
   }
}

/*
 * DO NOT EDIT -- generated from package.json
 */

const Version = {
   label : 'GE 3.0.0-beta' // string displayed in the upper right-hand corner of the main GE3 web pages
};
const urls = [
   "./groups/A_4.group",
   "./groups/A_5.group",
   "./groups/D_10.group",
   "./groups/D_4 x Z_2.group",
   "./groups/D_4.group",
   "./groups/D_5.group",
   "./groups/D_6.group",
   "./groups/D_7.group",
   "./groups/D_8.group",
   "./groups/D_9.group",
   "./groups/Fr_20.group",
   "./groups/G_4,4.group",
   "./groups/Modular_16.group",
   "./groups/Q_4 x Z_2.group",
   "./groups/Q_4.group",
   "./groups/Q_8.group",
   "./groups/Quasihedral_16.group",
   "./groups/S_3 x Z_3.group",
   "./groups/S_3 x Z_4.group",
   "./groups/S_3.group",
   "./groups/S_4.group",
   "./groups/Trivial.group",
   "./groups/Twenty-one.group",
   "./groups/Unnamed1_16.group",
   "./groups/Unnamed2_16.group",
   "./groups/V_4.group",
   "./groups/Z_10.group",
   "./groups/Z_11.group",
   "./groups/Z_12.group",
   "./groups/Z_13.group",
   "./groups/Z_14.group",
   "./groups/Z_15.group",
   "./groups/Z_16.group",
   "./groups/Z_17.group",
   "./groups/Z_18.group",
   "./groups/Z_19.group",
   "./groups/Z_2 x Z_10.group",
   "./groups/Z_2 x Z_2 x Z_2 x Z_2.group",
   "./groups/Z_2 x Z_2 x Z_2 x Z_3.group",
   "./groups/Z_2 x Z_2 x Z_2.group",
   "./groups/Z_2 x Z_3 x Z_3 x Z_4.group",
   "./groups/Z_2 x Z_4 x Z_2.group",
   "./groups/Z_2 x Z_4.group",
   "./groups/Z_2 x Z_6.group",
   "./groups/Z_2 x Z_8.group",
   "./groups/Z_2.group",
   "./groups/Z_20.group",
   "./groups/Z_3 sdp Z_4.group",
   "./groups/Z_3 x Z_3 sdp Z_2.group",
   "./groups/Z_3 x Z_3.group",
   "./groups/Z_3 x Z_6.group",
   "./groups/Z_3.group",
   "./groups/Z_4 sdp Z_5.group",
   "./groups/Z_4 x Z_4.group",
   "./groups/Z_4.group",
   "./groups/Z_5.group",
   "./groups/Z_6.group",
   "./groups/Z_7.group",
   "./groups/Z_8.group",
   "./groups/Z_9.group",
/*
   "./groups/168.group",
   "./groups/Tesseract.group",
 */
];

/*
 * This file gets compiled into ge-lib.js.
 * It is not intended for use on its own.
 */

const globalVarsToExport = [
    // first import all the important classes in the GE global namespace:
    'Version',
    'BitSet',
    'MathUtils',
    'BasicGroup',
    'XMLGroup',
    'Subgroup',
    'SubgroupFinder',
    'IsomorphicGroups',
    'Library',
    'MathML',
    'Diagram3D',
    'Multtable',
    'CycleGraph',
    'CayleyDiagram',
    'SymmetryObject',
    // and some useful global functions as well:
    'mathml2text',
    // and then some things that may be useless outside the browser,
    // but I'm importing them for the sake of completeness; they are
    // global classes in the GE namespace, after all, so:
    'DisplayDiagram',
    'DisplayMulttable',
    'DisplayCycleGraph',
    'Template',
    'Menu',
    'DiagramDnD'
];
globalVarsToExport.map( name => module.exports[name] = eval( name ) );
// then expose to the client the list of URLs in our group library
module.exports.allGroupURLs = urls;
// then add to the Library class two methods that are specific to
// running GE from within node.js, which load one or all groups
// from the local filesystem synchronously.
// (later we can make these asynchronous if desired.)
Library.loadFromFilesystem = url => {
    const group = Library._dataToGroup(
        String( require( 'fs' ).readFileSync( url ) ), 'xml' );
    group.URL = url;
    Library.saveGroup( group,
        require( 'path' ).basename( url ).replace( '.group', '' ) );
};
Library.loadAllFromFilesystem = () => {
    const before = ( new Date() ).getTime();
    urls.map( url => Library.loadFromFilesystem( url ) );
    const elapsed = ( new Date() ).getTime() - before;
    console.log( `Loaded all groups in ${elapsed/1000}sec.` );
}
