// @flow
/*::
import Diagram3D from './Diagram3D.js';

// Tree structures (should be generic Tree<T>, but Flow has trouble with that)
export type ElementTree = Array<Elem>;
export type Elem = groupElement | Array<Elem>;

export type NodeTree = Array<Nd>;
export type Nd = Diagram3D.Node | Array<Nd>;

export type MeshTree = Array<Msh>;
export type Msh = THREE.Mesh | Array<Msh>;

export default
 */
class GEUtils {
   static equals(a /*: Array<any> */, b /*: Array<any> */) /*: boolean */ {
      if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
         for (let inx = 0; inx < a.length; inx++) {
            if (a[inx] != b[inx]) {
               return false;
            }
         }
         return true;
      }
      return false;
   }

   static _flatten(arr /*: Array<any> */) /*: Array<any> */ {
      return arr.reduce(
         (flattened, el) => {
            if (Array.isArray(el)) {
               flattened.push(...GEUtils._flatten(el))
            } else {
               flattened.push(el)
            }
            return flattened;
         }, [] );
   }

   static flatten_el(arr /*: ElementTree | Array<Array<groupElement>> */) /*: Array<groupElement> */ {
      return GEUtils._flatten(arr);
   }
   static flatten_nd(arr /*: NodeTree | Array<Array<Diagram3D.Node>> */) /*: Array<Diagram3D.Node> */ {
      return GEUtils._flatten(arr);
   }
   static flatten_msh(arr /*: MeshTree */) /*: Array<THREE.Mesh> */ {
      return GEUtils._flatten(arr);
   }

   static last/*:: <T> */(arr /*: Array<T> */) /*: T */ {
      return arr[arr.length - 1];
   }

   // All arguments, including hue, are fractional values 0 <= val <= 1.0
   static fromRainbow(hue /*: float */, saturation /*:: ?: float */ = 1.0, lightness /*:: ?: float */ = .8) /*: color */ {
      return `hsl(${Math.round(360*hue)}, ${Math.round(100*saturation)}%, ${Math.round(100*lightness)}%)`
   }

   static isTouchDevice() /*: boolean */ {
      return 'ontouchstart' in window;
   }

   /*
    * Generally applicable routine that clears window of existing tooltips, menus, highlighting, etc. It is
    *    called from a high level (e.g., #bodyDouble) default click handler, or by a menu/tooltip routine just
    *    before it displays a new menu/tooltip or after it has finished performing a selected function.
    *
    * Actions taken are determined from the following classes applied to DOM elements:
    *    highlighted -- remove highlighting from list elements
    *    hide-on-clean -- hide statically generated lists, like faux-select options
    *    remove-on-clean -- remove dynamically-generated temporary artifacts, like menus and tooltips
    *    disable-on-clean -- disable buttons
    */
   static cleanWindow() {
      $('.highlighted').each( (_inx, el) => $(el).removeClass('highlighted') );
      $('.hide-on-clean').hide();
      $('.remove-on-clean').remove();
      $('.disable-on-clean').each( (_inx, el) => $(el).prop('disabled', true) );
   }
}
/* @flow
## Multi-level Logging

The routines in this class perform simple logging and error reporting functions using console info/warn/error messages and the browser alert. Messages will be logged/alerted if they are at or higher than the current log level. There are five log levels defined: 'debug', 'info', 'warn', 'err', and 'none'. The default log level is 'warn' and the default alert level is 'err'. The log level may be set from the URL, thus:
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/Multtable.html?groupURL=./groups/D_4.group&<b>log=info&alert=warn</b>
<br>And it may be set by invoking `Log.setLogLevel(string)` or `Log.setAlertLevel(string)` at the debug console. 

```js
 */
/*::
  type logLevel = 'debug' | 'info' | 'warn' | 'err' | 'none';

  export default
 */
class Log {
/*::
   static logLevels: {[key: logLevel]: number};
   static logFunctions: Array<(Array<any>) => void>;
   static logLevel: number;
   static alertLevel: number;
   static alertsRemaining: number;
 */
   static init() {
      const DEFAULT_LOG_LEVEL = 'warn';
      const DEFAULT_ALERT_LEVEL = 'err';
      const MAX_ALERT_COUNT = 3;
      Log.logLevels = {debug: 0, info: 1, warn: 2, err: 3, none: 4};
      Log.logFunctions = [console.log, console.info, console.warn, console.error];
      Log.setLogLevel(new URL(window.location.href).searchParams.get('log') || DEFAULT_LOG_LEVEL);
      Log.setAlertLevel(new URL(window.location.href).searchParams.get('alert') || DEFAULT_ALERT_LEVEL);
      Log.alertsRemaining = MAX_ALERT_COUNT;  // number of alerts remaining before we quit showing them
   }

   static setLogLevel(level /*: string */) {
      if (Log.logLevels.hasOwnProperty(level)) {
         Log.logLevel = Log.logLevels[((level /*: any */) /*: logLevel */)];
      }
   }

   static setAlertLevel(level /*: string */) {
      if (Log.logLevels.hasOwnProperty(level)) {
         Log.alertLevel = Log.logLevels[((level /*: any */) /*: logLevel */)];
      }
   }

   static _log(thisLevel /*: number */, args /*: Array<any> */) {
      if (thisLevel >= Log.logLevel) {
         Log.logFunctions[thisLevel](...args);
      }
      if (thisLevel >= Log.alertLevel && Log.alertsRemaining-- > 0) {
         alert(args);
      }
   }

   static debug(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['debug'], args);
   }

   static info(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['info'], args);
   }

   static warn(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['warn'], args);
   }

   static err(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['err'], args);
   }
}

// initialize static properties on window load
window.addEventListener('load', Log.init, {once: true});
/*
```
 */
// @flow
/*
 * bitset as array of (32-bit) ints
 */

/*::
import XMLGroup from './XMLGroup.js';

export type BitSetJSON = {
   len: number,
   arr: Array<number>
};

export default
 */
class BitSet {
/*::
   len: number;
   arr: Array<number>;
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

   static intersection(a /*: BitSet */, b /*: BitSet */) /*: BitSet */ {
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
      for (let i = 0, len = this.len; i < this.arr.length; i++, len -= 32) {
         const mask = 0xFFFFFFFF >>> (32 - Math.min(32,len));
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
      return this.toArray().map( (el /*: groupElement */) => group.reps[el] ).join(', ');
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
// @flow
// math functions
/*::
import BitSet from './BitSet.js';

export default
*/
class MathUtils {
/*::
   static primeList: BitSet;
   static primePowerList: BitSet;
 */
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

   static isPrime(n /*: number */) /*: boolean */ {
      return (n < 200) ? MathUtils.primeList.isSet(n) : MathUtils.getFactors(n).length == 1
   }

   static isPrimePower(n /*: number */) /*: boolean */ {
      if (n < 200) {
         return MathUtils.primePowerList.isSet(n)
      } else {
         let factors = MathUtils.getFactors(n);
         return factors.every(el => el == factors[0]);
      }
   }

   static getFactors(n /*: number */) /*: Array<number> */ {
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
// @flow
/*
 * Class holds group defined only by a multiplication table
 */
/*
```js
 */

/*::
import BitSet from './BitSet.js';
import type {ElementTree, Elem} from './GEUtils.js';
import MathUtils from './MathUtils.js';
import Subgroup from './Subgroup.js';
import type {SubgroupJSON} from './Subgroup.js';
import SubgroupFinder from './SubgroupFinder.js';
import XMLGroup from './XMLGroup.js';

export type BasicGroupJSON = {
   multtable: Array<Array<groupElement>>,
   _subgroups: Array<SubgroupJSON>
};

export default
 */
class BasicGroup {
/*::
   multtable: Array<Array<groupElement>>;
   order: number;
   elements: Array<groupElement>;
   inverses: Array<groupElement>;
   nonAbelianExample: ?[groupElement, groupElement];
   isAbelian: boolean;
   elementPowers: Array<BitSet>;
   elementPrimePowers: Array<BitSet>;
   elementOrders: Array<number>;
   isCyclic: boolean;
   orderClasses: Array<BitSet>;
   _orderClassSizes: Array<number>;
   conjugacyClasses: Array<BitSet>;
   _conjClassSizes: Array<number>;
   _subgroups: Array<Subgroup>;
   _subgroupOrders: Array<number>;
   _isSolvable: boolean;
   _isSimple: boolean;
   _cosetIndices: Array<groupElement>;  // _cosetIndices[element in parent group] = coset index / element in quotient group)
   _indexInParentGroup: Array<groupElement>; // _indexInParentGroup[element index in subgroup] = element index in parent group
 */
   constructor(multtable /*: ?Array<Array<groupElement>> */) {
      if (multtable != undefined) {
         this.multtable = multtable;
         this.setDerivedProperties();
      }
   }

   setDerivedProperties() {
      this.order = this.multtable.length;
      this.elements = this.multtable[0];
      this.inverses = this.elements.map(el => this.multtable[el].indexOf(0));
      this.nonAbelianExample = this.findNonAbelianExample();
      this.isAbelian = (this.nonAbelianExample == undefined);
      const [_tmp1, _tmp2] = this.getElementPowers(this);
      this.elementPowers = _tmp1;
      this.elementPrimePowers = _tmp2;
      this.elementOrders = this.elementPowers.map(el => el.popcount());
      this.isCyclic = this.elementOrders.some((el /*: number */) => el == this.order);
      this.orderClasses = this.getOrderClasses(this.elementOrders);
      this.conjugacyClasses = this.getConjugacyClasses(this.elements);
   }

   static parseJSON(json /*: BasicGroupJSON & Obj */) /*: BasicGroup */ {
      const group /*: BasicGroup */ = new BasicGroup();
      group.parseJSON(json);
      return group;
   }

   parseJSON(json /*: BasicGroupJSON & Obj */) {
      this.multtable = json.multtable;
      this.setDerivedProperties();

      if (json._subgroups != undefined) {
         this._subgroups = json._subgroups.map( (subgroupJSON) => {
            const subgroup = Subgroup.parseJSON(subgroupJSON);
            subgroup.group = this;
            return subgroup;
         } );
      }
   }

   findNonAbelianExample() /*: ?[groupElement, groupElement] */ {
      for (let i = 1; i < this.order; i++) {
         for (let j = i; j < this.order; j++) {
            if (this.multtable[i][j] != this.multtable[j][i]) {
               return [i,j];
            }
         }
      }
   }

   // calculate subgroups on demand -- slows down initial load too much (still true?)
   get subgroups() /*: Array<Subgroup> */ {
      if (this._subgroups === undefined) {
         const [tmp1, tmp2] = SubgroupFinder.getSubgroups(this);
         this._subgroups = tmp1;
         this._isSolvable = tmp2;
      }
      return this._subgroups;
   }

   get isSolvable() /*: boolean */ {
      if (this._isSolvable == undefined) {
         this.subgroups;  // side effect is determining solvability
      }
      return this._isSolvable;
   }

   get isSimple() /*: boolean */ {
      if (this._isSimple == undefined) {
         this._isSimple =
            this._subgroups.length > 2 &&
            !this.subgroups.some(
               (el, inx) => this.isNormal(el) && inx != 0 && inx != (this.subgroups.length - 1) );
      }
      return this._isSimple;
   }

   get generators() /*: Array<Array<groupElement>> */ {
      return [this.subgroups[this.subgroups.length-1].generators.toArray()];
   }

   get orderClassSizes() /*: Array<number> */ {
      if (this._orderClassSizes === undefined) {
         this._orderClassSizes = this.orderClasses.reduce( (sizes, bitset) => {
            if (bitset != undefined)
               sizes.push(bitset.popcount());
            return sizes;
         }, [] );
      }
      return this._orderClassSizes;
   }

   get conjClassSizes() /*: Array<number> */ {
      if (this._conjClassSizes === undefined) {
         this._conjClassSizes =
            this.conjugacyClasses
                .reduce( (bySize /*: Array<number> */, cc /*: BitSet */) => { bySize[cc.popcount()]++; return bySize; },
                         new Array(this.order+1).fill(0) )
                .filter(el => el != 0);
      }
      return this._conjClassSizes;
   }

   get subgroupOrders() /*: Array<number> */ {
      if (this._subgroupOrders === undefined) {
         this._subgroupOrders =
            this.subgroups.map(subgroup => subgroup.order)
                .filter( (subgroupOrder /*: number */) => subgroupOrder < this.order);
      }
      return this._subgroupOrders;
   }

   isNormal(subgroup /*: Subgroup */) /*: boolean */ {
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
   closure(generators /*: BitSet | Array<groupElement> */) /*: BitSet */ {
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
   getElementPowers(group /*: BasicGroup */) /*: [Array<BitSet>, Array<BitSet>] */ {
      const powers = [], primePowers = [];
      for (let g = 0; g < group.order; g++) {
         const elementPowers = new BitSet(group.order, [0]),
               elementPrimePowers = new BitSet(group.order);
         for (let i = 1, prevAcc = g, acc = g;
              prevAcc != 0;
              i++, prevAcc = acc, acc = group.multtable[g][acc]) {
               elementPowers.set(acc);
               if (MathUtils.isPrime(i))
                  elementPrimePowers.set(acc);
          }
          powers.push(elementPowers);
          primePowers.push(elementPrimePowers);
      }
      return [powers, primePowers];
   }

   // needs fixing to work for general set of elements (not just entire group)
   getOrderClasses(elementOrders /*: Array<number> */) /*: Array<BitSet> */ {
      const numOrderClasses = Math.max(...elementOrders) + 1;
      const orderClasses = Array.from( {length: numOrderClasses}, () => new BitSet(this.order) );
      elementOrders.forEach( (elementOrder, element) => orderClasses[elementOrder].set(element) );
      return orderClasses;
   }

   // creates conjugacy classes for element array, which may be the elements of a subgroup
   getConjugacyClasses(elements /*: Array<groupElement> */) /*: Array<BitSet> */ {
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
         const vals = conjugacyClasses.get(key);
         if (vals != undefined) {
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

      const sortedResult  = result.sort( (a /*: BitSet */, b /*: BitSet */) => a.popcount() - b.popcount() );
      return sortedResult;
   }

   getCosets(subgroupBitset /*: BitSet */, isLeft /*: ?boolean */ = true)  /*: Array<BitSet> */ {
      const mult = isLeft ? (a,b) => this.multtable[a][b] : (a,b) => this.multtable[b][a];
      const cosets = [subgroupBitset];
      const todo = new BitSet(this.order).setAll().subtract(subgroupBitset);
      const subgroupArray = subgroupBitset.toArray();

      for (;;) {
         const g = todo.pop();
         if (g == undefined) break;
         const newCoset = new BitSet(this.order);
         subgroupArray.forEach( el => newCoset.set(mult(g, el)) );
         cosets.push(newCoset);
         todo.subtract(newCoset);
      }

      return cosets;
   }

   // assumes subgroup is normal
   getQuotientGroup(subgroupBitset /*: BitSet */) /*: BasicGroup */ {
      const cosets = this.getCosets(subgroupBitset, true);
      const quotientOrder = cosets.length;
      const cosetReps = cosets.map( (coset /*: BitSet */) => ((coset.first() /*: any */) /*: groupElement */) );
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
            newMult[i][j] = elementMap[this.mult(ii, jj)];
         }
      }
      var result = new BasicGroup(newMult);
      result._cosetIndices = elementMap;
      return result;
   }

   // save generators in _loadedGenerators?
   getSubgroupAsGroup(subgroup /*: Subgroup */) /*: BasicGroup */ {
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

   mult(a /*: groupElement */, b /*: groupElement */) /*: groupElement */ {
      return this.multtable[a][b];
   }

   // returns closure of passed generators as an array of arrays of ...
   // generators may be passed as a bitset, array, or a single element
   closureArray(generators /*: BitSet | Array<groupElement> | groupElement */) /*: ElementTree */ {
      const deepMultiply = (array /*: ElementTree */, factor , elementsUsed ) =>
            array.map( (el /*: groupElement | Array<Elem> */) => {
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
               for (const s of (gensUsed /*: Array<groupElement> */)) {
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

   // calculates cosets of the passed group
   cosetsArray(subgroup /*: Array<groupElement> */, isLeft /*: ?boolean */ = true) /*: Array<Array<groupElement>> */ {
      const cosets /*: Array<Array<groupElement>> */ = [subgroup];
      const cosetReps /*: Array<groupElement> */ = [subgroup[0]];
      const todo = new BitSet(this.order, subgroup).complement();

      for (let _g = todo.pop(); _g != undefined; _g = todo.pop()) {
         const g = _g;  // to help Flow
         cosetReps.push(g);
         const newCoset = subgroup.map( (el) => isLeft ? this.multtable[g][el] : this.multtable[el][g] );
         cosets.push(newCoset);
         todo.subtract(new BitSet(this.order, newCoset));
      }

      return cosets;
   }
}
/*
```
*/
// @flow
/*
 * Class holds group info parsed from xml definition
 *
 * To turn to JSON:
 *      JSON.stringify(instance)
 * To create from JSON:
 *      XMLGroup.parseJSON(json)
 */
/*::
import BasicGroup from './BasicGroup.js';
import type {BasicGroupJSON} from './BasicGroup.js';
import MathML from './MathML.md';

// Cayley diagram from XML
type XMLCayleyDiagram = {
   name: string,
   arrows: Array<groupElement>,
   points: Array<Point>
};

// Symmetry object from XML
type Point = [float, float, float];
type Path = {color?: color, points: Array<Point>};
type Sphere = {radius: float, color?: color, point: Point};
type Operation = {element: groupElement, degrees: float, point: Point};
export type XMLSymmetryObject = {
   name: string,
   operations: Array<Operation>,
   spheres: Array<Sphere>,
   paths: Array<Path>
};

export type XMLGroupJSON = {
   name: mathml,
   gapname: string,
   gapid: string,
   shortName: string,
   definition: mathml,
   phrase: string,
   notes: string,
   author: string,
   _XML_generators: Array<Array<groupElement>>,
   reps: Array<Array<string>>,
   representations: Array<Array<mathml>>,
   userRepresentations: Array<Array<string>>,
   representationIndex: number,
   cayleyDiagrams: Array<XMLCayleyDiagram>,
   symmetryObjects: Array<XMLSymmetryObject>,
   _labels: Array<Array<string>>,

   // XMLGroup properties set elsewhere
   lastModifiedOnServer: string,
   URL: string,
   CayleyThumbnail: string,
   rowHTML: string,
   userNotes: string
};

export type BriefXMLGroupJSON = {
   name: mathml,
   shortName: string,
   author: string,
   notes: string,
   phrase: string,
   representations: Array<Array<mathml>>,
   representationIndex: number,
   cayleyDiagrams: Array<XMLCayleyDiagram>,
   symmetryObjects: Array<XMLSymmetryObject>,
   multtable: Array<Array<groupElement>>
};

export default
 */
class XMLGroup extends BasicGroup {
/*::
   name: string;
   gapname: string;
   gapid: string;
   shortName: string;
   definition: string;
   phrase: string;
   notes: string;
   author: string;
   _XML_generators: Array<Array<groupElement>>;
   reps: Array<Array<string>>;
   representations: Array<Array<mathml>>;
   userRepresentations: Array<Array<string>>;
   representationIndex: number;
   cayleyDiagrams: Array<XMLCayleyDiagram>;
   symmetryObjects: Array<XMLSymmetryObject>;
   _labels: Array<Array<string>>;

   lastModifiedOnServer: string;
   URL: string;
   CayleyThumbnail: string;
   rowHTML: string;
   userNotes: string;
 */
   constructor (text /*: void | string | Document */) {
      if (text === undefined) {
         super();
         return;
      }

      let $xml /*: JQuery */;
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
      this.userNotes = '';
   }

   static parseJSON(json /*: XMLGroupJSON & BasicGroupJSON & Obj */) /*: XMLGroup */ {
      const group /*: XMLGroup */ = new XMLGroup();
      group.parseJSON(json);
      return group;
   }

   parseJSON(json  /*: XMLGroupJSON & BasicGroupJSON & Obj */) {
      const defaults = {
         name: '<mrow><mtext>Untitled Group</mtext></mrow>',
         shortName: 'Untitled Group',
         author: '',
         notes: '',
         phrase: '',
         representationIndex: 0,
         cayleyDiagrams: [],
         symmetryObjects: [],
      };

      // process BasicGroup properties
      super.parseJSON(json);

      // merge defaults into passed JSON object and remove properties already set in BasicGroup
      const jsonWithDefaults /*: XMLGroupJSON & Obj */ = Object.assign({}, defaults, json);  
      Object.keys(this).forEach( (key /*: string */) => delete jsonWithDefaults[key] );
  
      // copy remaining properties to this
      Object.assign(this, jsonWithDefaults);

      // process XMLGroup properties
      if ( this.representations == undefined ) {
         this.representations = [ [ ] ];
         for ( var i = 0 ; i < this.multtable.length ; i++ )
            this.representations[0].push( `<mn>${i}</mn>` );
      }
   }

   toBriefJSON () /*: BriefXMLGroupJSON */ {
      return {
         name: this.name,
         shortName: this.shortName,
         author: this.author,
         notes: this.notes,
         phrase: this.phrase,
         representations: this.representations,
         representationIndex: this.representationIndex,
         cayleyDiagrams: this.cayleyDiagrams,
         symmetryObjects: this.symmetryObjects,
         multtable: this.multtable
      };
   }

   deleteUserRepresentation(userIndex /*: number */) {
      const savedRepresentation =
         (userIndex + this.representations.length == this.representationIndex) ? this.representations[0] : this.representation;
      this.userRepresentations.splice(userIndex, 1);
      this.representation = savedRepresentation;
   }

   get representation() /*: Array<mathml> */ {
      if (this.representationIndex < this.representations.length) {
         return this.representations[this.representationIndex];
      } else if (this.representationIndex - this.representations.length < this.userRepresentations.length) {
         return this.userRepresentations[this.representationIndex - this.representations.length];
      } else {
         return this.representations[0];
      }
   }

   set representation(representation /*: Array<string> */) {
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

   get rep() /*: Array<mathml> */ {
      return (this.representationIndex < this.representations.length) ? this.reps[this.representationIndex] : this.representation;
   }

   get labels() /*: Array<string> */ {
      if (this.representationIndex > this.representations.length) {
         return this.representation.map( (rep) => MathML.toUnicode(rep) );
      } else {
         if (this._labels == undefined) {
            this._labels = Array(this.representations.length).fill([]);
         }
         const labels /*: Array<Array<string>> */ = this._labels;
         const representationIndex /*: number */ = this.representationIndex;
         const result /*: Array<string> */ = labels[representationIndex];
         labels[representationIndex] = (result.length == 0) ? this.representation.map( (rep) => MathML.toUnicode(rep) ) : result;
         return labels[representationIndex];
      }
   }

   get longestLabel() /*: mathml */ {
      return this.labels.reduce/*:: <mathml> */( (longest, label) => (label.length > longest.length) ? label : longest, '' );
   }

   get generators() /*: Array<Array<groupElement>> */ {
      const calculatedGenerators = super.generators;
      if (this._XML_generators.length == 0) {
         return calculatedGenerators;
      } else if (calculatedGenerators[0].length < this._XML_generators[0].length) {
         calculatedGenerators.push(...this._XML_generators);
         return calculatedGenerators;
      } else {
         return this._XML_generators;
      }
   }

   // returns short representations as array of arrays of strings (just debugging)
   static _reps_from_xml($xml /*: JQuery */) /*: Array<Array<string>> */ {
      return $xml.find('representation').toArray()
                 .map( (rep /*: Element */) => $(rep).find('element').toArray()
                                                     .map( (el /*: Element */) => $(el).attr('text') )
                     );
   }

   // returns representations as array of arrays of innerHTML elements
   static _representations_from_xml($xml /*: JQuery */) /*: Array<Array<mathml>> */ {
      return $xml.find('representation').toArray()
                 .map( (rep /*: Element */) => $(rep).find('element').toArray()
                                                     .map( (el /*: Element */) => $(el).html() )
                     );
   }

   // returns <multtable> in [[],[]] format
   static _multtable_from_xml($xml /*: JQuery */) /*: Array<Array<groupElement>> */ {
      return $xml.find('multtable > row').toArray()
                 .map( (row /*: Element */) => row.textContent
                                                  .split(' ')
                                                  .filter( (el /*: string */) => el.length != 0 )
                                                  .map( (el /*: string */) => parseInt(el) )
                     );
   }

   // returns generators specified in XML, not those derived in subgroup computation
   static _generators_from_xml($xml /*: JQuery */) /*: Array<Array<groupElement>> */ {
      return $xml.find('generators').toArray()
                 .map( (gen /*: Element */) => $(gen).attr('list')
                                                     .split(' ')
                                                     .map( (gen /*: string */) => parseInt(gen) )
                     )
   }

   // {name, arrows, points}
   // arrows are element numbers
   // points are [x,y,z] arrays
   static _cayley_diagrams_from_xml($xml /*: JQuery */) /*: Array<XMLCayleyDiagram> */ {
      let cayleyDiagrams = [];
      $xml.find('cayleydiagram').each(
         (_, cd) => {
            let name, arrows = [], points = [];
            name = $(cd).find('name').text();
            $(cd).find('arrow').each( (_, ar) => { arrows.push(Number(ar.textContent)) } );
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

   static _symmetry_objects_from_xml($xml /*: JQuery */) /*: Array<XMLSymmetryObject> */ {
      let getPoint = function(pt) {
         return [Number(pt.getAttribute('x')), Number(pt.getAttribute('y')), Number(pt.getAttribute('z'))];
      };
      let symmetryObjects = [];
      $xml.find('symmetryobject').each(
         (_, so) => {
            const name = so.getAttribute('name') || '(unnamed)',
                  operations = [],
                  spheres = [],
                  paths = [];
            $(so).find('operation').each(
               (_, op) => {
                  const element = Number(op.getAttribute('element')),
                        degrees = Number(op.getAttribute('degrees')),
                        point = getPoint(op.children[0]);
                  operations.push({element: element, degrees: degrees, point: point});
               }
            );
            $(so).find('sphere').each(
               (_, sp) => {
                  const radius = Number(sp.getAttribute('radius')),
                        color = sp.getAttribute('color'),
                        point = getPoint(sp.children[0]);
                  const sphere /*: Sphere */ = {radius: radius, point: point};
                  if (color != undefined)
                     sphere.color = color;
                  spheres.push(sphere);
               }
            );
            $(so).find('path').each(
               (_, pa) => {
                  const path /*: Path */ = {points: []};
                  const color = pa.getAttribute('color');
                  if (color != undefined)
                     path.color = color;
                  $(pa).find('point').each(
                     (_, pt) => {
                        path.points.push(getPoint(pt));
                     }
                  );
                  paths.push(path);
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
   generators: BitSetJSON,
   members: BitSetJSON,
   _isNormal: boolean,
   contains: BitSetJSON,
   containedIn: BitSetJSON
};

export default
 */
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
      if (this._isNormal == undefined) {
         this._isNormal = this.group.isNormal(this);
      }
      return this._isNormal;
   }

   // clone all fields except group reference
   clone() /*: Subgroup */ {
      const clone = new Subgroup();
      for (const prop in this) {
         ((clone /*: any */) /*: Obj */)[prop] =
            (((this /*: any */) /*: Obj */)[prop] == undefined)
               ? undefined
               : (prop == 'group')
                  ? this.group
                  : ((this /*: any */) /*: Obj */)[prop].clone();
      }
      return clone;
   }
}
// @flow
/*
 * Function returns subgroups of group as array of BitSets
 */
/*::
import MathUtils from './MathUtils.js';
import BasicGroup from './BasicGroup.js';
import BitSet from './BitSet.js';
import Subgroup from './Subgroup.js';

export default
 */
class SubgroupFinder {
/*::
   group: BasicGroup;
   z_generators: BitSet;
 */
   constructor (group /*: BasicGroup */) {
      this.group = group;
      this.z_generators = new BitSet(group.order);
      for (let i = 1; i < group.order; i++) {
         if (MathUtils.isPrimePower(group.elementOrders[i])) {
            this.z_generators.set(i);
         }
      }
   }

   static getSubgroups(group /*: BasicGroup */) /*: [Array<Subgroup>, boolean] */ {
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
         const new_element =
               ((BitSet.difference(new_subgroup.members, last_subgroup_found.members).first() /*: any */) /*: groupElement */);
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
   static addSubgroupLattice(subgroups /*: Array<Subgroup> */) {
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


   findAllSubgroups() /*: Array<Subgroup> */ {
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
   findNextLayer(currLayer /*: Array<Subgroup> */) /*: Array<Subgroup> */ {
      const nextLayer = [];

      for (let i = 0; i < currLayer.length; i++) {
         const currSubgroup = currLayer[i];
         const normalizer = this.findNormalizer(currSubgroup);
         const todo = BitSet.intersection(
            this.z_generators,
            BitSet.difference(normalizer.members, currSubgroup.members));
         for (let j = 0; j < nextLayer.length; j++) {
            const nextSubgroup /*: Subgroup */ = nextLayer[j];
            if (nextSubgroup.members.contains(currSubgroup.members)) {
               todo.subtract(nextSubgroup.members);
            }
         }

         for (let g = todo.pop(); g != undefined; g = todo.pop()) {
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
   findNormalizer(subgroup /*: Subgroup */) /*: Subgroup */ {
      let normalizer = subgroup.clone(),
          todo = new BitSet(this.group.order).setAll().subtract(subgroup.members);

      for (let g = todo.pop(); g != undefined; g = todo.pop()) {
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

   normalizes(subgroup /*: Subgroup */, g /*: number */) /*: boolean */{
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

   extendSubgroup(subgroup /*: Subgroup */, normalizer /*: number */) {
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

   minimizeGenerators(subgroup /*: Subgroup */, extension /*: number */) {
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
// @flow
/*::
import BasicGroup from './BasicGroup.js';
import BitSet from './BitSet.js';
import GEUtils from './GEUtils.js';
import Library from './Library.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

export default
*/
class IsomorphicGroups {
/*::
   static map: Array<Array<XMLGroup>>;
 */
   static init() {
      if (IsomorphicGroups.map == undefined) {
         const maxOrder = Math.max(...Library.getAllLocalGroups().map( (G) => G.order ));
         IsomorphicGroups.map = Library.getAllLocalGroups()
                                       .reduce( (map, G) => (map[G.order].push(G), map),
                                                Array.from({length: maxOrder+1}, () => []) );
      }
   }

   static findForSubgroup(group /*: BasicGroup */, subgroup /*: Subgroup */) /*: ?BasicGroup */ {
      const subgroupAsGroup = group.getSubgroupAsGroup(subgroup);
      const isomorphicGroup = (group.order == subgroup.members.popcount()) ?
                              group :
                              IsomorphicGroups.find(subgroupAsGroup);
      return isomorphicGroup;
   }

   static find(G /*: BasicGroup */) /*: ?XMLGroup */ {
      IsomorphicGroups.init();

      // filter by candidate group properties, isomorphism
      return IsomorphicGroups.map[G.order]
         .filter( H => GEUtils.equals(G.orderClassSizes, H.orderClassSizes) )
      // .filter( H => GEUtils.equals(G.subgroupOrders, H.subgroupOrders) )
      // .filter( H => GEUtils.equals(G.conjClassSizes, H.conjClassSizes) )
         .find( H => IsomorphicGroups.isomorphism(H, G) != undefined );
   }

   // returns isomorphism from G to H, or undefined if none can be found
   static isomorphism(G /*: BasicGroup */, H /*: BasicGroup */) /*: void | Array<groupElement> */ {
      if (G.order != H.order) {
         return undefined;
      }

      if (G.order == 1) {
         return [0];
      }

      // returns arrays of generators for H that match orders in req
      const matchingGenerators = function* (req /*: Array<groupElement> */, avail /*: Array<BitSet> */, sel /*:: ?: Array<groupElement> */ = []) {
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
         const g2h /*: Array<groupElement> */ = new Array(G.order);
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
         if ( !GEUtils.equals(g2h.slice().sort( (a,b) => a - b ), G.elements) ) {
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
   static findEmbedding(G /*: BasicGroup */, H /*: Subgroup */) /*: null | [BasicGroup, Array<groupElement>] */ {
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
   static findQuotient(G /*: BasicGroup */, N /*: Subgroup */) /*: null | [BasicGroup, Array<groupElement>] */ {
      if ( !G.isNormal( N ) ) return null;
      const groupQ = G.getQuotientGroup( N.members ),
            libraryQ = IsomorphicGroups.find( groupQ );
      if ( !libraryQ ) return null;
      const almostMap = IsomorphicGroups.isomorphism( groupQ, libraryQ );
      if ( !almostMap ) return null;
      return [ libraryQ, G.elements.map( elt => almostMap[groupQ._cosetIndices[elt]] ) ];
   }
}
/* @flow
# Templates

Most of what appears on the screen in GE3 is dynamic HTML, created at runtime by javascript and formatted by CSS stylesheets. This is often the result of a complex combination of HTML, CSS, and javascript, and it can difficult to read the code behind a web page to understand how the displayed data is derived and how it will appear. Every GE3 web page uses this 'template' pattern (though it may use others, too), making a template from a section of HTML with placeholders in it to represent data values that are to be replaced at runtime. This approach makes it easier to separate the layout of the data from the code that generates it. This is similar to the JavaServer Pages (.jsp) or Active Server Pages (.asp) approach, though in GE3 the evaluation is done on the client side by javascript using HTML5 template tags and ES6 template literals, not on the server.

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

To use the template it is retrieved with a jQuery call, its HTML extracted as a string, and the result turned into a string literal, as done in the [Template.md](#template-retrieval-caching) code below:

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

Since template retrieval is done repeatedly, the actual template retrieval code caches results by template id in a class static variable, as you can see here: [Template.md](../js/Template.md).

```js
 */
/*
 * Caching template fetch --
 *   returns the html of template with id = templateId as a `string literal` for subsequent eval'ing
 *   returns the value undefined if template does not exist
 */
/*::
export default
*/
class Template {
/*::
   static _map: Map<string, ?string>;
 */
   static HTML(templateId /*: string */) /*: ?string */ {

      Template._map = (Template._map === undefined) ? new Map() : Template._map;

      let result = Template._map.get(templateId);
      if (result === undefined) {
         const $template = $(`template[id="${templateId}"]`);
         result = ($template.length == 0) ? undefined : '`' + $template.html() + '`';
         Template._map.set(templateId,  result);
      };

      return result;
   }
}
/*
```
 */
// @flow

/*::
export default
 */
class GroupURLs {
/*::
   static urls: Array<string>;
 */
}

GroupURLs.urls = [
   "./groups/Trivial.group",
   "./groups/Z_2.group",
   "./groups/Z_3.group",
   "./groups/V_4.group",
   "./groups/Z_4.group",
   "./groups/Z_5.group",
   "./groups/S_3.group",
   "./groups/Z_6.group",
   "./groups/Z_7.group",
   "./groups/D_4.group",
   "./groups/Q_4.group",
   "./groups/Z_2 x Z_2 x Z_2.group",
   "./groups/Z_2 x Z_4.group",
   "./groups/Z_8.group",
   "./groups/Z_3 x Z_3.group",
   "./groups/Z_9.group",
   "./groups/D_5.group",
   "./groups/Z_10.group",
   "./groups/Z_11.group",
   "./groups/A_4.group",
   "./groups/D_6.group",
   "./groups/Z_12.group",
   "./groups/Z_2 x Z_6.group",
   "./groups/Z_3 sdp Z_4.group",
   "./groups/Z_13.group",
   "./groups/D_7.group",
   "./groups/Z_14.group",
   "./groups/Z_15.group",
   "./groups/D_4 x Z_2.group",
   "./groups/D_8.group",
   "./groups/G_4,4.group",
   "./groups/Modular_16.group",
   "./groups/Q_4 x Z_2.group",
   "./groups/Q_8.group",
   "./groups/Quasihedral_16.group",
   "./groups/Unnamed1_16.group",
   "./groups/Unnamed2_16.group",
   "./groups/Z_16.group",
   "./groups/Z_2 x Z_2 x Z_2 x Z_2.group",
   "./groups/Z_2 x Z_4 x Z_2.group",
   "./groups/Z_2 x Z_8.group",
   "./groups/Z_4 x Z_4.group",
   "./groups/Z_17.group",
   "./groups/D_9.group",
   "./groups/S_3 x Z_3.group",
   "./groups/Z_18.group",
   "./groups/Z_3 x Z_3 sdp Z_2.group",
   "./groups/Z_3 x Z_6.group",
   "./groups/Z_19.group",
   "./groups/D_10.group",
   "./groups/Fr_20.group",
   "./groups/Z_2 x Z_10.group",
   "./groups/Z_20.group",
   "./groups/Z_4 sdp Z_5.group",
   "./groups/Twenty-one.group",
   "./groups/S_3 x Z_4.group",
   "./groups/S_4.group",
   "./groups/Z_2 x Z_2 x Z_2 x Z_3.group",
   "./groups/A_5.group",
   "./groups/Z_2 x Z_3 x Z_3 x Z_4.group",
/*
   "./groups/168.group",
   "./groups/Tesseract.group",
 */
];

var urls = GroupURLs.urls;
// @flow
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
/*::
import BasicGroup from './BasicGroup.js';
import Log from './Log.md';
import type {MSG_loadGroup} from './SheetModel.js';
import XMLGroup from './XMLGroup.js';
import type {XMLGroupJSON, BriefXMLGroupJSON} from './XMLGroup.js';

type StoredLibraryValue = {
   rev: number,
   object: XMLGroup
};
   
export default
 */
class Library {
/*::
   static map: {[key: string]: XMLGroup};
   static revision: number;
*/
   // initialize Library.map from localStorage
   //   called once after class is defined
   static __initializeLibrary(rev /*: number */ = 0) {
      Library.revision = rev;
      Library.map = {};
      const numGroups = localStorage.length;
      for (let inx = 0; inx < numGroups; inx++) {
         const key = localStorage.key(inx);
         if (key != undefined && key.startsWith('http')) {
            const value = localStorage.getItem(key);
            if (value != undefined) {
               const {rev: revision, object: groupJSON} = JSON.parse(value);
               if (revision == Library.revision) {
                  const group = Library._dataToGroup(groupJSON, 'json');
                  if (group != undefined) {
                     Library.map[key] = group;
                  }
               }
            }
         }
      }
   }

   // convert JSON, XML data formats to group object
   //   uses pattern recognition for strings or, if presented with data from ajax call, content-type http header
   //   (note that ajax calls will already have created JSON objects and XML document fragments if indicated by content-type)
   static _dataToGroup(data /*: any */, contentType /*: ?string */) /*: void | XMLGroup */ {
      let group /*: XMLGroup */;
      if (typeof data == 'string') {
         group = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data));
      } else if (contentType != undefined && contentType.includes('xml')) {
         group = (new XMLGroup((data /*: Document */)) /*: XMLGroup */);
      } else if (contentType != undefined && contentType.includes('json')) {
         group = XMLGroup.parseJSON((data /*: Object */));
      }
      return group;
   }

   // get base URL from window.location.href
   //   (maybe we should eliminate the origin field, since all the data in localStorage is common origin?)
   static baseURL() /*: string */ {
      var baseURL = new URL( window.location.href );
      baseURL = baseURL.origin + baseURL.pathname; // trim off search string
      baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      return baseURL;
   }

   // delete all group definitions from Library.map and localStorage
   static clear() {
      const libraryLength = localStorage.length;
      for (let inx = libraryLength-1; inx >= 0; inx--) {
         const key = localStorage.key(inx);
         if (key != undefined && key.startsWith('http')) {
            localStorage.removeItem(key);
            delete Library.map[key];
         }
      }
   }

   // return array of groups from Library.map/localStorage (no server contact)
   static getAllLocalGroups() /*: Array<XMLGroup> */ {
      return ((Object.values(Library.map) /*: any */) /*: Array<XMLGroup> */);
   }

   // return array of group URLs from Library.map/localStorage
   static getAllLocalURLs() /*: Array<string> */ {
      return Object.getOwnPropertyNames(Library.map);
   }

   // returns Promise to get group from localStorage or, if not there, download it from server
   static getGroupOrDownload(url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         if (localGroup === undefined) {
            $.ajax({ url: groupURL,
                     success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
                        try {
                           if (jqXHR != undefined && jqXHR.status == 200) {
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
                              reject(`Error fetching ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'})`);
                           }
                        } catch (err) {
                           reject(`Error parsing ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}, ${err || 'N/A'}`);
                        }
                     },
                     error: (jqXHR, textStatus, err) => {
                        reject(`Error loading ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}), ${err || 'N/A'}`);
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
   static getLatestGroup(url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  headers: (localGroup == undefined) ? {} : {'if-modified-since': localGroup.lastModifiedOnServer},
                  success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
                     try {
                        if (jqXHR != undefined && jqXHR.status == 200) {
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
                        } else if (jqXHR != undefined && jqXHR.status == 304 && localGroup !== undefined) {
                           resolve(localGroup);
                        } else {
                           error_useLocalCopy(`Error fetching ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'})`);
                        }
                     } catch (err) {
                        error_useLocalCopy(`Error parsing ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}, ${err || 'N/A'}`);
                     }
                  },
                  error: (jqXHR, textStatus, err) => {
                     error_useLocalCopy(`Error loading ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}), ${err || 'N/A'}`);
                  }
         });
         // if there's a local copy available, just log error and satisfy call with local copy
         const error_useLocalCopy = (msg) => {
            if (localGroup === undefined) {
               reject(msg);
            } else {
               Log.err(msg);
               resolve(localGroup);
            }
         }
      } )
   }

   // return locally stored copy of group from Library.map/localStorage
   static getLocalGroup(url /*: string */, baseURL /*: void | string */) /*: void | XMLGroup */ {
      return Library.map[Library.resolveURL(url, baseURL)];
   }

   // return 'true' if Library.map/localStorage contains no groups
   static isEmpty() /*: boolean */ {
      return Object.keys(Library.map).length == 0;
   }

   // get groupURL from page invocation and return promise for resolution from cache or download
   static loadFromURL() /*: Promise<XMLGroup> */ {
      const hrefURL = new URL(window.location.href);
      const groupURL = hrefURL.searchParams.get('groupURL');
      if (groupURL != null) {
         return Library.getGroupOrDownload(groupURL);
      } else if (hrefURL.searchParams.get('waitForMessage') !== null) {
         return new Promise( (resolve, reject) => {
            /*
             * When this page is loaded in an iframe, the parent window can
             * indicate which group to load by passing the full JSON
             * definition of the group in a postMessage() call to this
             * window, with the format { type: 'load group', group: G },
             * where G is the JSON data in question.
             */
            document.addEventListener( 'message', function ( event /*: MessageEvent */ ) {
               if (typeof event.data == undefined || ((event.data /*: any */) /*: Obj */).type != 'load group') {
                  Log.err('unknown message received in Library.js:');
                  Log.err(event.data);
                  reject('unknown message received in Library.js');
               }
               const event_data = ((event.data /*: any */) /*: MSG_loadGroup */);
               try {
                  if (typeof event_data.group == 'string') {
                     const group = Library._dataToGroup(event_data.group, 'json');
                     if (group != undefined) {
                        Library.map[group.shortName] = group;
                        resolve(group);
                     }
                  }
                  reject('unable to understand data');
               } catch (error) {
                  reject(error);
               }
            }, false );
         } );
      } else {
         return new Promise( (_resolve, reject) => {
            reject("error in URL: can't find groupURL query parameter");
         } );
      }
   }

   // utility routine to open web page with "...?groupURL=..." with search string containing groupURL
   //   and options from {a: b, ...} included as '&a=b...',
   static openWithGroupURL(pageURL /*: string */, groupURL /*: string */, options /*: {[key: string]: string} */ = {}) {
      const url = `./${pageURL}?groupURL=${groupURL}` +
                  Object.keys(options).reduce( (url, key /*: string */) => url + `&${key}=${options[key]}`, '');
      window.open(url);
   }

   // get resolved URL from part (e.g., if called from page invoked as
   //   resolveURL(../group-explorer/groups/Z_2.group) from page invoked as
   //   http://localhost/group-explorer/GroupInfo.html?groupURL=../group-explorer/groups/Z_2.group
   //   it returns http://localhost/group-explorer/groups/Z_2.group)
   static resolveURL(url /*: string */, baseURL /*: ?string */) /*: string */ {
      return new URL(url, (baseURL == undefined) ? Library.baseURL() : baseURL).href;
   }

   // serializes and stores group definition in Library.map/localStorage
   //   throws exception if storage quota is exceeded
   static saveGroup(group /*: XMLGroup */, key /*: string */ = group.URL) {
      Library.map[key] = group;
      try {
         const value /*: StoredLibraryValue */ = {rev: Library.revision, object: group};
         localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
         Log.err(err);
      }
   }
}

Library.__initializeLibrary(2);
/* @flow
# MathML utilities

Nearly all mathematical text in GE is formatted with MathML and rendered into HTML by MathJax. The MathML class has utility functions for some simple formatting patterns, converting MathML to Unicode text, and caching MathJax output to improve performance.

* [Formatting utilities](#formatting-utilities)

* [Transformation routines](#transformation-routines)

* [Caching](#caching)

* [Initialization](#initialization)

* [Legacy functions](#legacy-functions)

```js
*/
/*::
import XMLGroup from './XMLGroup.js';

declare class XSLTProcessor {
   importStylesheet(Node): void;
   transformToFragment(Node, Document): DocumentFragment;
}

export default
 */
class MathML {
/*::
   static subscripts: {[key: string]: string};
   static superscripts: {[key: string]: string};
   static MATHML_2_HTML: string;
   static xsltProcessor: XSLTProcessor;
   static Cache: Map<string, string>;
 */
/*
```
  ## Formatting utilities
  <i>(note: examples are HTML approximations to actual MathJax output)</i>

* sans -- format a MathML string in sans-serif font
  <br>&nbsp;&nbsp;`MathML.sans('<mtext>Linear in </mtext><mi>rf</mi>')` => "Linear in <i>rf</i>"
  + All identifiers (&lt;mi&gt; elements) are italicized, including multi-character identifiers.

* sansText -- format a string as MathML <mtext> in sans-serif font
  <br>&nbsp;&nbsp;`MathML.sansText('Some string here')` => "Some string here"
  + Font, size, positioning, etc. match surrounding MathJax formatting better than a browser-formatted string. Thus,
    <br>`<p>MathML.sans('<msub><mi>H</mi><mn>3</mn></msub>') MathML.sansText('is the third subgroup of...')`
    <br>will generally look better than
    <br>`<p>MathML.sans('<msub><mi>H</mi><mn>3</mn></msub>') is the third subgroup of...`
  + As the name suggests, it just runs `MathML.sans('<mtext>' + argument + '</mtext>')`

* sub -- format two character strings as an identifier with a subscript
  <br>&nbsp;&nbsp;`MathML.sans(MathML.sub('CC','3'))` => "<i>CC</i><sub>3</sub>"
  + Arguments are not treated as MathML strings.

* csList -- format a list of MathML strings as a comma-separated list
  <br>&nbsp;&nbsp;`MathML.csList(['<mi>x</mi>', '<mn>3</mn>'])` =>  "<i>x</i>, 3"
  + The resulting list elements are separate top-level MathML constructs, separated by normal HTML. This allows the browser to re-flow the text instead of having MathJax do it. It also improves the ability of MathML to cache commonly used constructs like element representations.
  + This routine is used internally by setList and genList.

* setList -- format a list of MathML strings as a comma-separated list surrounded by {, } braces
  <br>&nbsp;&nbsp;`MathML.setList(['<mi>r</mi>', '<mi>f</mi>'])` => "{ <i>r</i>, <i>f</i> }"
  + Used to represent elements of a set

* genList -- format a list of MathML strings as a comma-separated list surrounded by ⟨, ⟩ brackets
  <br>&nbsp;&nbsp;`MathML.genList(['<mi>r</mi>', '<mi>f</mi>'])` => "⟨ <i>r</i>, <i>f</i> ⟩"
  + Used to represent elements of a group or subgroup
  + Brackets are in bold because the normal font renders them lighter than other characters.

* rowList -- format a list of MathML strings as rows (a &lt;br&gt;-separated list)

```js
*/
   static sans(mathml /*: string */) /*: string */ {
      return MathML.Cache.get(mathml)
          || '<math xmlns="http://www.w3.org/1998/Math/MathML" mathvariant="sans-serif">' +
             mathml.replace(/<mi>/g, '<mi mathvariant="sans-serif-italic">') +
             '</math>';
   }

   static sansText(plainText /*: string */) {
      return MathML.sans(MathML._2mtext(plainText));
   }

   // just wrap plainText in an <mtext> element, but without making it a full MathML <math...> element
   static _2mtext(plainText /*: string */) {
      return '<mtext>' + plainText + '</mtext>';
   }

   static sub(identifier /*: string */, subscript /*: number | string */) /*: string */ {
      return '<msub><mi>' + identifier + '</mi><mn>' + subscript + '</mn></msub>';
   }

   static csList(elements /*: Array<string> */) /*: string */ {
      return elements
         .map( (el) => MathML.sans(el) ).join(',&nbsp;');
   }

   static setList(elements /*: Array<string> */) /*: string */ {
      return MathML.sans('<mtext>{</mtext>') +
             '&nbsp;' + MathML.csList(elements) + '&nbsp;' +
             MathML.sans('<mtext>}</mtext>');
   }

   static genList(generators /*: Array<string> */) /*: string */ {
      return MathML.sans('<mtext mathvariant="bold">⟨</mtext>') +     // \langle
             '&nbsp;&nbsp;' + MathML.csList(generators) + '&nbsp;&nbsp;' +
             MathML.sans('<mtext mathvariant="bold">⟩</mtext>');      // \rangle
   }

   static rowList(elements /*: Array<string> */) /*: string */ {
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
   static toHTML(mathml /*: mathml */) /*: DocumentFragment */ {
      return MathML.xsltProcessor.transformToFragment($.parseXML(mathml), document);
   }

   static toUnicode(mathml /*: mathml */) /*: string */ {
      const $html = $( MathML.toHTML(mathml) );

      $html.find('sub').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.subscripts[ch]).join('')) );
      $html.find('sup').each( (_,el) => $(el).text($(el).text().split('').map(ch => MathML.superscripts[ch]).join('')));

      return $html.text();
   }
/*
```
  ## Caching

  The subgroup display that is part of many of the visualizers takes a noticeable amount of time to format with MathJax, particularly since it occurs at the same time as the main graphic is being generated and because it must complete before the browser is fully responsive. Since many formatted elements are used repeatedly, caching the results of the formatting operation can be used to improve performance. The approach below is particularly suited to the visualizers' subset display and the diagram control panels.

  The approach below has `MathML.sans` consult a cache of already formatted MathML elements and return the HTML generated by a previous MathJax run if a match is found. This HTML can be inserted into the DOM where a MathML expression would otherwise be put; it needs no further MathJax processing to be displayed in its final form. The cache is initially loaded with the HTML generated by formatting all the element representations, all the subgroup names (<i>H</i><sub>0</sub>, <i>H</i><sub>1</sub>, etc.), all the subgroup orders, and a few static strings commonly used in the indicated displays. These contents are sufficient to generate the subgroup display and show it immediately on construction. In the current implementation the cache is not modified after this initial load: most of the available performance improvements are realized by the choice of initial content, and this ensures that the cache doesn't grow without bound.

  Since repeated use of formatted elements does not occur on all pages, use of the cache is optional. Without it every MathML element inserted in the DOM must be transformed by MathJax into HTML that the browser can render; with it, some of that HTML will just be copied from the cache. In either case, however, the same formatting routines are used (`MathML.sans`, `MathML.sub`, etc.) and the same results are achieved. To enable the cache `MathML.preload` must be called to create and populate it. Since MathJax formatting is done asynchronously to the main javascript thread the cache is not immediately available on return from the call, so the method returns a Javascript `Promise`. The cache is available when the `then` clause executes. In the GE visualizer implementations this is done during the process of loading the page, after the group is loaded (the group is needed to load the cache), but before the subset display (which uses the cache) executes.

  The implementation follows: The cache is a `Map` from MathML strings to MathJax-generated HTML that the browser can render. The `preload` method places the MathML to be cached in a hidden &lt;div&gt; element, typesets it with MathJax, and on completion gathers the generated HTML into the cache and removes the hidden &lt;div&gt;. A few notes about the process:
* The hidden  &lt;div&gt; has id `mathml-cache-preload`.
* Each MathML expression is wrapped in a separate &lt;div&gt; within `mathml-cache-preload`.
* The cache keys, the unformatted MathML expressions, are saved in the key attribute of the wrapper &lt;div&gt;'s.
* The cache values, the HTML derived from the MathML expressions, are determined by removing all the `.MJX_Assistive_MathML` spans (which aren't used in GE) and then recovering the outerHTML of every top-level span having the `mjx-chtml` class.
* These elements can't simply be hidden with `display: none`. If the display is not rendered, MathJax won't size spaces like `<mspace width="0.3em"></mspace>` correctly, and permutation representations will be formatted as `(123)` instead of `(1 2 3)`. In the implementation `mathml-cache-preload` is hidden by placing it past the bottom of the screen.

```js
*/
   static preload(group /*: XMLGroup */) /*: Promise<void> */ {
      const mathmlStrings = new Set([
         // from subsetDisplay
         MathML._2mtext(')'),
         MathML._2mtext('...'),
         MathML._2mtext('Background'),
         MathML._2mtext('Border'),
         MathML._2mtext('Clear all highlighting'),
         MathML._2mtext('Compute'),
         MathML._2mtext('Corner'),
         MathML._2mtext('Create'),
         MathML._2mtext('Customize the elements of'),
         MathML._2mtext('Delete partition'),
         MathML._2mtext('Delete'),
         MathML._2mtext('Edit list of elements in'),
         MathML._2mtext('Elements in'),
         MathML._2mtext('Elements of'),
         MathML._2mtext('Elements not in'),
         MathML._2mtext('Highlight item by'),
         MathML._2mtext('Highlight partition by'),
         MathML._2mtext('Node color'),
         MathML._2mtext('Norm('),
         MathML._2mtext('Ring around node'),
         MathML._2mtext('Square around node'),
         MathML._2mtext('Top'),
         MathML._2mtext('a union'),
         MathML._2mtext('all conjugacy classes'),
         MathML._2mtext('all left cosets'),
         MathML._2mtext('all order classes'),
         MathML._2mtext('all right cosets'),
         MathML._2mtext('an elementwise product'),
         MathML._2mtext('an intersection'),
         MathML._2mtext('by dragging elements into or out of it below.'),
         MathML._2mtext('by'),
         MathML._2mtext('is a conjugacy class of size'),
         MathML._2mtext('is a subgroup of order'),
         MathML._2mtext('is a subset of size'),
         MathML._2mtext('is an order class of size'),
         MathML._2mtext('is the group itself.'),
         MathML._2mtext('is the left coset of'),
         MathML._2mtext('is the right coset of'),
         MathML._2mtext('is the subset of size'),
         MathML._2mtext('is the trivial subgroup'),
         MathML._2mtext('of'),
         MathML._2mtext('the closure of'),
         MathML._2mtext('the elementwise product of'),
         MathML._2mtext('the intersection of'),
         MathML._2mtext('the normalizer of'),
         MathML._2mtext('the union of'),
         MathML._2mtext('with'),
         MathML._2mtext('{'),
         MathML._2mtext('}'),
         '<mtext mathvariant="bold">&#x27E8;</mtext>',  // unicode MATHEMATICAL LEFT ANGLE BRACKET, \langle, similar to <
         '<mtext mathvariant="bold">&#x27E9;</mtext>',  // unicode MATHEMATICAL RIGHT ANGLE BRACKET, \rangle, similar to >
         '<mtext mathvariant="bold">⟨</mtext>',         // unicode MATHEMATICAL LEFT ANGLE BRACKET
         '<mtext mathvariant="bold">⟩</mtext>',         // unicode MATHEMATICAL RIGHT ANGLE BRACKET
         '<mi>g</mi>',

         // from diagramController
         MathML._2mtext('(no chunking)'),
         MathML._2mtext('a subgroup of order'),
         MathML._2mtext('generated by'),
         MathML._2mtext('Generate diagram'),
         MathML._2mtext('Organize by'),
         MathML._2mtext('The whole group'),
         '<mtext>Linear in&nbsp;</mtext><mi>x</mi>',
         '<mtext>Linear in&nbsp;</mtext><mi>y</mi>',
         '<mtext>Linear in&nbsp;</mtext><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>',
         '<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>',
         MathML._2mtext('N/A'),
         MathML._2mtext('inside'),
         MathML._2mtext('outside'),
         MathML._2mtext('innermost'),
         MathML._2mtext('middle'),
         MathML._2mtext('outermost'),
         MathML._2mtext('innermost'),
         MathML._2mtext('second innermost'),
         MathML._2mtext('second outermost'),
         MathML._2mtext('outermost'),
         MathML._2mtext('innermost'),
         MathML._2mtext('second innermost'),
         MathML._2mtext('middle'),
         MathML._2mtext('second outermost'),
         MathML._2mtext('outermost'),

         // from Table controller
         MathML._2mtext('none'),
      ]);

      // cache diagram heading
      mathmlStrings.add(`<mtext>Cayley Diagram for&nbsp;</mtext>${group.name}`);
      mathmlStrings.add(`<mtext>Multiplication Table for&nbsp;</mtext>${group.name}`);
      mathmlStrings.add(`<mtext>Cycle Graph for&nbsp;</mtext>${group.name}`);

      // cache diagram names
      for (let inx = 0; inx < group.cayleyDiagrams.length; inx++) {
         mathmlStrings.add(`<mtext>${group.cayleyDiagrams[inx].name}</mtext>`);
      }

      // cache integers <= group order
      for (let inx = 0; inx <= group.order; inx++) {
         mathmlStrings.add(`<mn>${inx}</mn>`);
      }

      // cache subgroup names, subgroup orders
      for (let inx = 0; inx < group.subgroups.length; inx++) {
         mathmlStrings.add(MathML.sub('H', inx));
      }

      // cache current element representations
      for (let inx = 0; inx < group.representation.length; inx++) {
         mathmlStrings.add(group.representation[inx]);
      }

      // cache first two user-defined subset names
      mathmlStrings.add(MathML.sub('S', 0));
      mathmlStrings.add(MathML.sub('S', 1));

      // cache conjugacy class names
      mathmlStrings.add(MathML.sub('CC', 'i'));
      for (let inx = 0; inx < group.conjugacyClasses.length; inx++) {
         mathmlStrings.add(MathML.sub('CC', inx));
      }

      // cache order class names
      mathmlStrings.add(MathML.sub('OC', 'i'));
      for (let inx = 0, jnx = 0; inx < group.orderClasses.length; inx++) {
         if (group.orderClasses[inx].popcount() != 0) {
            mathmlStrings.add(MathML.sub('OC', jnx++));
         }
      }

      return MathML.cacheStrings(mathmlStrings);
   }

   static cacheStrings(mathmlStrings /*: Iterable<string> */) /*: Promise<void> */ {
      // dom fragment in which all MathML elements will be staged
      const $preload = $('<div id="mathml-cache-preload">');

      for (const mathml of mathmlStrings) {
         $preload.append($(`<div>${MathML.sans(mathml)}</div>`).attr('key', mathml));
      }

      // append fragment to document
      $preload.appendTo('html');

      const harvest = () => {
         // Harvest keys, values from spans generated by MathJax
         $('#mathml-cache-preload .MJX_Assistive_MathML').remove();
         $('#mathml-cache-preload > div').each( (_, div) => {
            const $span = $(div).find('> .mjx-chtml');
            MathML.Cache.set($(div).attr('key'), $span.attr('fromCache', 'true')[0].outerHTML);
         } );

         // remove the hidden div
         $('#mathml-cache-preload').remove();
      };

      // typeset the MathML in the mathml-cache-preload, then harvest the typeset results and fulfill the promise
      return new Promise/*:: <void> */(
         (resolve, _reject) => MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'mathml-cache-preload'], harvest, resolve)
      );
   }
/*
```
## Initialization
   The following items are created during initialization:
* `MathML.subscripts` and `MathML.superscripts` contain the Unicode characters for subscript and superscript numerals.
* `MathML.MATHML_2_HTML` contains XSLT code to transform the MathML subset used in GE into HTML.
* `MathML.xsltProcessor` is an XSLT processor for transforming MathML into HTML.
* `MathML.Cache` contains a fresh `Map` relating MathML strings => formatted DOM elements

```js
*/
   static _init() {
      // Unicode characters for numeric subscripts, superscripts
      MathML.subscripts =
         {'0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
          '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089' };
      MathML.superscripts =
         {'0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
          '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
          '-': '\u207B'};

      // Create XSLT to transform MathML subset into HTML
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
      MathML.xsltProcessor = new XSLTProcessor();
      MathML.xsltProcessor.importStylesheet($.parseXML(MathML.MATHML_2_HTML));

      // Create MathML.Cache
      MathML.Cache = new Map();
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
/* @flow
# Menu Handling Utilities

Menus represent a group of actions a user can choose from. They are used in nearly every page and panel in GE3, from statically defined dropdowns to dynamically generated cascades. This class brings together the routines used in GE3 to create and manage them:
* [addMenus()](#addmenusmenus-location) -- create and place multi-level cascaded menus
* [setMenuLocation()](#setmenulocationmenu-location) -- place menu so it doesn't extend beyond the edge of the window
* [actionClickHandler()](#actionclickhandlerevent) -- click handler to execute user choice
* [pinSubMenu()](#pinsubmenuevent) -- toggle submenu visibility in cascaded menu
* [makeLink()](#makelinklabel-link) -- create menu-submenu link

Note that these are class methods and not instance methods or globals, so they must be invoked as `Menu.addMenus(...)`.
## Structure
Cascaded menus are stored as a collection of lists of user-selectable actions. 

User actions are specified in the '`action`' attribute of appropriate elements as javascript code, which will be executed
by the click handler upon selection.

Menu-submenu linkages are specified in the `link` attribute of an element, which contains the `id` attribute of the submenu.
For these elements the action is always `Menu.pinSubMenu(event)`, which exposes the linked submenu.
Linkages are generated from the [`link-template`](../docs/visualizerFramework_html.md#menu-submenu-link-template)
by [Menu.makeLink()](#makelinklabel-link).

Here is a small but realistic example taken from the
[Cayley diagram for S<sub>3</sub>](../CayleyDiagram.html?groupURL=groups/S_3.group),
seen by right-clicking on the <b>Subgroups</b> header in the Subsets panel:
```html
<ul id="header-menu" class="menu remove-on-clean">
    <li action="SSD.SubsetEditor.open()">Create S<sub>0</sub></li>
    <hr>
    <li action="Menu.pinSubMenu(event)" link="compute-menu">Compute <span class="menu-arrow"></span> </li>
    <li action="clearHighlights()">Clear all highlighting</li>
</ul>
<ul id="compute-menu" class="menu remove-on-clean">
    <li action="new SSD.ConjugacyClasses()">all conjugacy classes <i>CC</i><sub>i</sub></li>
    <li action="new SSD.OrderClasses()">all order classes <i>OC</i><sub>i</sub></li>
</ul>
```
(Note that:
* the MathJax formatting for the displayed text is replaced by an HTML approximation
* the 'remove-on-clean' class that both menus have indicates to [GEUtils.cleanWindow()](./GEUtils.js#geutilscleanwindow) this it is to remove this menu (as opposed to hiding it, or doing nothing with it)
* the &lt;span class="menu-arrow"&gt;&lt;/span&gt; element, defined in [menu.css](../style/menus.css), displays a gray right-pointing arrow at the right end of the label)

This approach of separate lists, instead of lists and sublists, was largely dictated by limitations of the Safari browser.

## Styling
Many of the features that make menus unique, such as the way they float above the surrounding text or the way they may
not be positioned according to their location in the document, are determined by stylesheets.
The styles found in [menus.css](../style/menu.css) are used throughout GE3, overridden as needed
in the individual modules.
```js
*/
/*::
import GEUtils from './GEUtils.js';
import Template from './Template.md';

type MenuTree = {id: string, children?: Array<MenuTree>};

export default
*/
class Menu {
/*::
   static MARGIN: number;  // number of pixels to leave between the menu and the edge of the window
 */
   static init() {
      Menu.MARGIN = 4;
   }
/*
```
### addMenus($menus, location)
This method places the elements of a set of cascaded menus within the browser window, and it associates the default
click event handler [`Menu.actionClickHandler()`](#actionclickhandlerevent) with them to execute the user's
selected action. The top menu is placed as near the desired `location` as possible, consistent with the following
constraints: the menus are placed by [`Menu.setMenuLocation()`](#setmenulocationmenu-location) so that they are within
the browser window; and by `Menu._setMenuTreeLocation()` so that when a submenu is exposed it does not cover its parent.
```js
*/
   static addMenus ($menus /*: JQuery */, location /*: eventLocation */) {
      // remove all other menus
      const $parent = $menus.first().parent();
      $menus.detach();
      $('.menu').remove();  // is this always the right thing to do?
      $parent.append($menus);

      // only consider non-empty menus
      const $non_empty_menus = $menus.filter('.menu').filter( (_,list) => list.childElementCount != 0 );

      // set click handler for each menu
      $non_empty_menus.each( (_inx, ul) => ul.addEventListener('click', Menu.actionClickHandler) );

      const menu_tree = Menu._getMenuTree($non_empty_menus);
      Menu._setMenuTreeLocation(menu_tree, location);

      $(`#${menu_tree.id}`).css('visibility', 'visible');
   }

   // discover cascaded menu tree by examining menu id's and links
   static _getMenuTree ($menus /*: JQuery */) /*: MenuTree */ {
      // find top menu:
      //    within each menu find each link and remove it from the set of potential targets
      //    the last man standing is the one with no links to it, the top menu
      const targets = new Set/*:: <string> */($menus.map( (_inx, ul) => ul.id ).toArray() );
      $menus.each( (_inx, menu) => {
         $(menu).find('li[link]').each( (_inx, li) => {
            const link = li.getAttribute('link');
            if (link != undefined) {
               targets.delete(link);
            }
         } )
      } );

      const top_menu_id = Array.from(targets)[0];

      // recursive routine to get menu tree beneath this menu
      const getMenuTreeFromID = (menu_id /*: string */) /* MenuTree */ => {
         const children = [];
         $menus.filter(`[id="${menu_id}"]`)
            .find('li[link]')
            .each( (_inx, li) => {
               const link = li.getAttribute('link');
               if (link != undefined) {
                  children.push(getMenuTreeFromID(link));
               }
            } );
         return {id: menu_id, children: children};
      }

      // find menu tree for top menu
      const result = getMenuTreeFromID(top_menu_id);
      return result;
   }

   static _setMenuTreeLocation (menu_tree /*: MenuTree */, location /*: eventLocation */) {
      const $menu = $(`#${menu_tree.id}`);
      const {clientX, clientY} = Menu.setMenuLocation($menu, location);

      // fit child menus
      //   put child on right if fits within window, left if it doesn't
      //   recursively descend tree to fit each child menu
      const menu_box = $menu[0].getBoundingClientRect();
      const body_box = $('body')[0].getBoundingClientRect();
      if (menu_tree.children != undefined) {
         menu_tree.children.forEach( (child) => {
            const $link = $menu.find(`> [link=${child.id}]`);
            const link_box = $link[0].getBoundingClientRect();
            const child_box = $(`#${child.id}`)[0].getBoundingClientRect();
            const childX = (clientX + menu_box.width + child_box.width > body_box.right - Menu.MARGIN)
                  ? clientX - child_box.width
                  : clientX + menu_box.width;
            const childY = link_box.top;
            Menu._setMenuTreeLocation(child, {clientX: childX, clientY: childY})
         } )
      }
   }
/*
```
### setMenuLocation($menu, location)
This routine places the passed `$menu` as near to the desired `location` as it can, consistent with
the constraint that the `$menu` should not extend beyond the edge of the window; it returns the location
at which it placed the `$menu`.

While this routine is used by default in placing cascaded menus, it is also used for placing tooltips.
As such it is called from a variety of routines, including all of the main visualizers.
```js
*/
   static setMenuLocation ($menu /*: JQuery */, location /*: eventLocation */) /*: eventLocation */ {
      // set upper left corner of menu to base
      const menu_box = $menu[0].getBoundingClientRect();
      const body_box = $('body')[0].getBoundingClientRect();

      let {clientX, clientY} = location;

      // if it doesn't fit on the right push it to the left enough to fit
      if (clientX + menu_box.width > body_box.right - Menu.MARGIN)
         clientX = body_box.right - Menu.MARGIN - menu_box.width;

      // if it doesn't fit on the bottom push it up until it bumps into the top of the frame
      if (clientY + menu_box.height > body_box.bottom - Menu.MARGIN)
         clientY = body_box.bottom - Menu.MARGIN - menu_box.height
      if (clientY < body_box.top + Menu.MARGIN) {
         clientY = body_box.top + Menu.MARGIN;
         $menu.css('height', body_box.bottom - body_box.top - 2*Menu.MARGIN)
              .css('overflow-y', 'scroll');
      }

      $menu.css('left', clientX)
           .css('top', clientY);

      return {clientX: clientX, clientY: clientY};
   }
/*
```
### actionClickHandler(event)
This is the default click handler for cascaded menus.  It executes the user choice specified in the 'action'
attribute of the menu item. '`event`' is the click event passed by the browser's event dispatcher.

Starting at the target element specified in `event`, the handler works its way towards the root of the
document tree until it encounters an element with an `action` attribute, which it then executes by way of `eval`.

In addition to being the default click handler for cascaded menus installed by
[Menu.addMenus()](#addmenusmenus-location), it is used as the click handler for many
menus in the [subsetDisplay](../subsetDisplay) and [diagramController](../diagramController) modules.
```js
*/
   static actionClickHandler (event /*: MouseEvent */) {
      event.preventDefault();
      const $action = $(event.target).closest('[action]');
      if ($action.length != 0) {
         event.stopPropagation();
         eval($action.attr('action'));
         // if we've just executed a menu action that's not just exposing a sub-menu
         //   then we're done: clean up the window
         if ($action.parent().hasClass('menu') && $action.attr('link') == undefined) {
            GEUtils.cleanWindow();  // is this always the right thing to do?
         }
      }
   }
/*
```
### pinSubMenu(event)
Toggle submenu visibility in cascaded menu; the action of a menu-submenu link created by [makeLink()](#makelinklabel-link).
* If the linked submenu is hidden, expose it and hide any other visible submenus (recursively) of the parent menu
* If the linked submenu is visible, hide it (recursively).

(*The following additional hovering behavior is not yet implemented:*
* *If the linked submenu is hidden, disable hover exposure of other submenus*
* *If the linked submenu is visible, enable hover submenu exposure*)

This routine is only referenced in the
[visualizerFramework template](../docs/visualizerFramework_html.md#menu-submenu-link-template)
used by [Menu.makeLink()](#makelinklabel-link).
```js
*/
   static pinSubMenu (event /*: MouseEvent */) {
      // find submenus exposed by this menu and hide them
      const hideSubMenus = ($list /*: JQuery */) => {
         $list.each( (_, el) => {
            const link = el.getAttribute('link');
            if (link != undefined) {
               const $target = $(`#${link}`);
               if ($target.css('visibility') == 'visible') {
                  $target.css('visibility', 'hidden');
                  hideSubMenus($target.children());
               }
            }
         } );
      };

      const $action = $(event.target).closest('[action]');
      const $element = $(`#${$action.attr('link')}`);
      const element_was_hidden = $element.css('visibility') == 'hidden';
      hideSubMenus($action.parent().children());
      if (element_was_hidden) {
         $element.css('visibility', 'visible');
      } else {
         $element.css('visibility', 'hidden');
      }
   }
/*
```
### makeLink(label, link)
Create a menu-submenu link in cascaded menus from `link-template` in
[visualizerFramework/visualizer.html](../docs/visualizerFramework_html.md#menu-submenu-link-template).
  * label -- text to be displayed in menu element
  * link -- submenu id

Cascaded menus are principally used in the [subsetDisplay](../subsetDisplay) and [diagramController](../diagramController) modules.
```js
*/
   static makeLink (label /*: string */, link /*: string */) /*: html */ {
      return eval(Template.HTML('link-template'));
   }
}

Menu.init();
/*
```
*/
//@flow
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
/*::
import XMLGroup from './XMLGroup.js';
import Log from './Log.md';

var group: XMLGroup;
var sagecell: any;

export default
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
            (($button.get(0) /*: any */) /*: HTMLInputElement */).value = showtext;
            $button.css( { margin : '5px 0px 0px 10px' } );
            const $div = $( '<div></div>' );
            $div.append( $button );
            $div.insertBefore( $block );
            // Hide the code, then let the user use the button
            // to show the code and/or hide it again.
            $block.hide();
            $button.on( 'click', event => {
                if ( (($button.get(0) /*: any */) /*: HTMLInputElement */).value == showtext ) {
                    $block.show();
                    (($button.get(0) /*: any */) /*: HTMLInputElement */).value = hidetext;
                } else {
                    $block.hide();
                    (($button.get(0) /*: any */) /*: HTMLInputElement */).value = showtext;
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
    function setCode ( code /*: string */ ) {
        const lines = code.split( '\n' );
        while ( /^\s*$/.test( lines[0] ) ) lines.shift();
        while ( /^\s*$/.test( lines[lines.length-1] ) ) lines.pop();
        const indents = lines.reduce( (indents, line) => {
            if ( /\S/.test( line ) )
                indents.push( ((/\S/.exec( line ) /*: any */) /*: RegExp$matchResult */).index );
            return indents;
        }, [] );
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
    //  ******* out of date -- see Library.js ********
    //     [...Library.map.keys()].sort().map( ( key ) => {
    //         const G = Library.map.get( key );
    //         const Gname = toIdent( G.shortName );
    //         strs.push( `Print( "${key}\\n" );;` );
    //         strs.push( `tmp := IdGroup( ${GAPConstructor( G )} );;` );
    //         strs.push( `Print( "    <gapid>", tmp[1], ",", tmp[2], "</gapid>\\n" );;` );
    //         strs.push( `tmp := SmallGroup( tmp[1], tmp[2] );;` );
    //         strs.push( `Print( "    <gapname>", StructureDescription( tmp ), "</gapname>\\n" );;` );
    //     } );
    //     Log.debug( strs.join( '\n' ) );
    // };
    const goal = elt.dataset.builtInCodeType;
    let code = '';
    if ( goal == 'create group' ) {
        setCode( `
            # In GAP's Small Groups library, of all the groups
            # of order ${ord}, this one is number ${idx}:
            ${G} := ${gpdef};
        ` );
        elt.dataset.purpose = 'creating this group';
    } else if ( goal == 'is abelian' ) {
        code = `
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
        code = `
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
        code = `
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
        Log.info( 'Would not prepare this:', elt );
    }
}
// @flow
/*
 * Structure used to describe Cayley diagram, symmetry object to DrawDiagram
 */

/*::
import BitSet from './BitSet.js';
import GEUtils from './GEUtils.js';
import XMLGroup from './XMLGroup.js';

type PointConstructor = [float, float, float] | THREE.Vector3;
export type NodeOptions = {color?: color, radius?: float, lineStyle?: number};
export type LineOptions = {arrow?: groupElement, arrowhead?: boolean, color?: color, offset?: float, style?: number} ;
export type Diagram3DOptions = {background?: color, isGenerated?: boolean};
*/

const _Diagram3D_STRAIGHT = 0;
const _Diagram3D_CURVED = 1;

class _Diagram3D_Point {
/*::
   point: THREE.Vector3;
  +isPoint: boolean;
 */
   constructor(point /*: ?PointConstructor */) {
      if (point == undefined) {
         this.point = new THREE.Vector3(0, 0, 0);
      } else if (Array.isArray(point)) {
         this.point = new THREE.Vector3(...point);
      } else {
         this.point = point;
      }
      this.isPoint = true;
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
class _Diagram3D_Node extends _Diagram3D_Point {
/*::
   element: groupElement;
   color: color;
   label: mathml;
   radius: ?float;
   lineStyle: number;
   colorHighlight: ?color;
   ringHighlight: ?color;
   squareHighlight: ?color;
   curvedGroup: Array<Diagram3D.Node>;
 */
   constructor(element /*: groupElement */,
               point /*: ?PointConstructor */,
               options /*: NodeOptions */ = {}) {
      super(point);
      this.element = element;
      this.color = options.color || '#DDDDDD';
      this.label = '';
      this.radius = options.radius;
      this.lineStyle = (options.lineStyle != undefined) ? options.lineStyle : Diagram3D.STRAIGHT;
      this.colorHighlight = undefined;
      this.ringHighlight = undefined;
      this.squareHighlight = undefined;
      this.isPoint = false;
   }
}

class _Diagram3D_Line {
/*::
   vertices: Array<Diagram3D.Point>;
   color: ?color;
   arrowhead: boolean;
   arrow: ?groupElement;
   offset: ?float;
   style: number;
  +length: float;
   middle: THREE.Vector3;
   center: THREE.Vector3;
 */
   constructor(vertices /*: Array<Diagram3D.Point> */,
               options /*: LineOptions */ = {}) {
      this.vertices = vertices;
      this.color = options.color;
      this.arrowhead = (options.arrowhead != undefined) ? options.arrowhead : true;
      this.arrow = options.arrow;
      this.offset = options.offset;
      this.style = (options.style != undefined) ? options.style : Diagram3D.STRAIGHT;
   }

   get length() /*: float */ {
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


/*:: export default */
class Diagram3D {
/*::
   static STRAIGHT: number;
   static CURVED: number;
   static Point: Class<_Diagram3D_Point>;
   static Node: Class<_Diagram3D_Node>;
   static Line: Class<_Diagram3D_Line>;
   group: XMLGroup;
   nodes: Array<Diagram3D.Node>;
   lines: Array<Diagram3D.Line>;
   _right_multiplication: boolean;
   node_labels: Array<mathml>;
   background: ?color;
   zoomLevel: float;
   lineWidth: float;
   nodeScale: number;
   fogLevel: number;
   labelSize: number;
   arrowheadPlacement: number;
  +emitStateChange: ?() => void;
   arrowColors: Array<color>;
  +isCayleyDiagram: boolean;
   isGenerated: boolean;
 */
   constructor(group /*: XMLGroup */,
               nodes /*: Array<Diagram3D.Node> */ = [],
               lines /*: Array<Diagram3D.Line> */ = [],
               options /*: Diagram3DOptions */ = {}) {
      this.group = group;
      this.nodes = nodes;
      this.lines = lines;
      this._right_multiplication = true;
      this.node_labels = group.representation;
      this.background = options.background;
      this.zoomLevel = 1;
      this.lineWidth = 7;
      this.nodeScale = 1;
      this.fogLevel = 0;
      this.labelSize = 1;
      this.arrowheadPlacement = 1;
      this.isCayleyDiagram = false;
      this.isGenerated = (options.isGenerated != undefined) ? options.isGenerated : true;
   }

   setNodeColor(color /*: color */) /*: Diagram3D */ {
      this._setNodeField('color', this.group.elements, color);
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setNodeLabels(labels /*: Array<mathml> */ = this.node_labels) /*: Diagram3D */ {
      this.node_labels = labels;
      if (this.node_labels !== undefined) {
         this.nodes.forEach( (nd /*: Diagram3D.Node */) => nd.label = this.node_labels[nd.element] );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   arrowMult(a /*: groupElement */, b /*: groupElement */) /*: groupElement */ {
      return this._right_multiplication ? this.group.mult(a,b) : this.group.mult(b,a);
   }

   // set multiplication direction; change lines when changing direction
   set right_multiplication(right_multiplication /*: boolean */) /*: Diagram3D */ {
      if (this._right_multiplication != right_multiplication) {
         this._right_multiplication = right_multiplication;
         this.lines.forEach( (line) => {
            if (line.vertices.length == 2 && !line.vertices[0].isPoint) {
               const startNode = ((line.vertices[0] /*: any */) /*: Diagram3D.Node */);
               line.vertices[1] = this.nodes[this.arrowMult( startNode.element, ((line.arrow /*: any */) /*: groupElement */) )];
            }
         } );
      }
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   // add a line from each element to arrow*element; set arrow in line
   // if arrow is Array, add all lines
   addLines(arrow /*: groupElement */) /*: Diagram3D */ {
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
   removeLines(arrow /*: ?groupElement */ = undefined) /*: Diagram3D */ {
      this.lines = (arrow == undefined) ? [] : this.lines.filter( (line) => line.arrow != arrow );
      if ( this.emitStateChange ) this.emitStateChange();
      return this;
   }

   setLineColors() /*: Diagram3D */ {
      const arrows = new BitSet(this.group.order,
                                this.lines.reduce( (els, line) /*: Array<groupElement> */ => {
                                   if (line.arrow != undefined) els.push(line.arrow);
                                   return els;
                                }, [] )
                               ).toArray();
      const colors = this.arrowColors
                  || Array.from({length: arrows.length},
                                (_, inx) => '#' + new THREE.Color(GEUtils.fromRainbow(inx/arrows.length, 1.0, 0.2)).getHexString());
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
         const rev = linesByEndpoints.get(reverseHash);
         if (rev != undefined) {
            rev.arrowhead = false;
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
                                           if (!vertex.hasOwnProperty('element')) {
                                              vertex.point.applyMatrix4(xForm)
                                           }
                                        } ) );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   get radius() /*: float */ {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      return (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
   }

   _setNodeField(field /*: string */, elements /*: Array<groupElement> */, value /*: mixed */) {
      elements.forEach( (index) => (this.nodes[index] /*: {[key: string]: mixed } */)[field] = value );
   }

   highlightByNodeColor(elements /*: Array<Array<groupElement>> */) {
      this._setNodeField('colorHighlight', this.group.elements, undefined);
      elements.forEach( (els, colorIndex) => {
         const hue = 360 * colorIndex / elements.length;
         const color = `hsl(${hue}, 53%, 30%)`;
         this._setNodeField('colorHighlight', els, color);
      } );
      if ( this.emitStateChange ) this.emitStateChange();
   }

   highlightByRingAroundNode(elements /*: Array<Array<groupElement>> */) {
      this._setNodeField('ringHighlight', this.group.elements, undefined);
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

   highlightBySquareAroundNode(elements /*: Array<Array<groupElement>> */) {
      this._setNodeField('squareHighlight', this.group.elements, undefined);
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
      this._setNodeField('colorHighlight', this.group.elements, undefined);
      this._setNodeField('ringHighlight', this.group.elements, undefined);
      this._setNodeField('squareHighlight', this.group.elements, undefined);
      if ( this.emitStateChange ) this.emitStateChange();
   }
}


Diagram3D.STRAIGHT = _Diagram3D_STRAIGHT;
Diagram3D.CURVED = _Diagram3D_CURVED;

Diagram3D.Point = _Diagram3D_Point;
Diagram3D.Node = _Diagram3D_Node;
Diagram3D.Line = _Diagram3D_Line;
/* @flow

# Cayley Diagram Manual Rearrangement
The [Cayley diagram visulizer](../help/rf-um-cd-options/index.html) lets users customize the
appearance of a [Cayley diagram](../help/rf-groupterms/#cayley-diagrams) by [repositioning the
nodes](../help/rf-um-cd-options/index.html#changing-the-positions-of-nodes-in-the-diagram) and
[adjusting the degree to which the arcs in the diagram are
curved](../help/rf-um-cd-options/index.html#changing-the-arcing-of-arrows-in-the-diagram).  The
**DiagramDnD** class in this file handles the drag-and-drop operations that implement this
capability, updating the Cayley diagram and redrawing the graphic as needed.

## Life cycle
The [Cayley diagram visualizer page](../CayleyDiagram.js) creates a **DiagramDnD** instance during
initialization and places a reference in the global variable `DnD_handler`. It is bound to the large
Cayley diagram and listens to mouse/touch events on the canvas. (There is no use for this variable
after initialization, it exists only for debugging.)

## Event handling
The [DiagramDnD constructor](#constructor) sets up the event handlers to listen for the start of a
rearrangement. Since mouse and touch events work a bit differently and it is confusing to handle
both within the same code, there are separate [mouse](#mouse-event-handler) and
[touch](#touch-event-handler) handlers in **DiagragDnD**. The event handlers recognize these events
associated with diagram rearrangement:
* The start of a rearrangement is indicated by a *shift-mousedown* or *one-point touchstart* over a
  node or arc. The [pickedObject()](#find-picked-object) method returns the node or arc over which
  the event occurred, or *null* if there isn't one (and thus the event is not the start of a
  rearrangement). Upon starting a rearrangement the handlers register as listeners for *move* and
  *end* events, which have been ignored until now in the interests of performance.
* The handlers store location information from subsequent *shift-mousemove*\/*touchmove* events as
  they are received, which are used by the [asynchronous painter](#asynchronous-painting) to perform
  the actual diagram changes.
* The end of an ongoing rearrangement is indicated by a *shift-mouseup* or *touchend* event. Upon
  termination the handlers call[`repaint`](#asynchronous-painting)directly to update the diagram one
  last time, followed by a call to [endDrag()](#end-drag) to clean up.
* An unexpected event will abort a rearrangement in progress by calling [endDrag()](#end-drag).

Note that **DiagramDnD** handles events for the &lt;canvas&gt; element, before they bubble up to
the containing &lt;div&gt;. Thus, when the handler identifies a drag-and-drop-related event, it
prevents it from propagating up the DOM tree, where it would be interpreted as a command to display
a tooltip or to rotate the visualization.
 
## Drawing
Redrawing the main graphic is done asynchronously to the main event handling in order to keep
potentially time-consuming graphics operations from tying up the main thread and stacking up user
interface events. Depending on the type of object originally picked, node or arc, the [asynchronous
painting](#asynchronous-painting) routine
calls[`redrawArc()`](#redraw-arc)or[`redrawSphere()`](#redraw-sphere)to rearrange the
[DiagramDisplay scene](./DisplayDiagram.js#scene).  Actual rerendering of the scene occurs on the
next execution of the [DisplayDiagram render() automation routine](./DisplayDiagram.js#render).

```js
*/
/*::
import Diagram3D from './Diagram3D.js';
import CayleyDiagram from './CayleyDiagram.js';
import DisplayDiagram from './DisplayDiagram.js';
import type {LineUserData, SphereUserData} from './DisplayDiagram.js';
import GEUtils from './GEUtils.js';
import Log from './Log.md';

export default
 */
class DiagramDnD {
/*::
   displayDiagram: DisplayDiagram;
   canvas: HTMLCanvasElement;
   eventLocation: THREE.Vector2;  // position of the last mouse/touch event
                                  //    (note that we don't drag-and-drop on multi-touch events)
   raycaster: THREE.Raycaster;
   mouse_handler: (MouseEvent) => void;
   touch_handler: (TouchEvent) => void;
   async_painter: ?number;  // asyncPainter timeoutID; null if asyncPainter not queued
   start_time: number;  // time of first touch event
   picked_object: ?(THREE.Mesh | THREE.Line);
 */
/*
```
### Constructor
Registers event handlers for touch or non-touch devices, as appropriate.
```js
*/
   constructor (displayDiagram /*: DisplayDiagram */) {
      this.displayDiagram = displayDiagram;
      this.canvas = displayDiagram.renderer.domElement;
      this.eventLocation = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.linePrecision = 0.02;
      this.async_painter = null;
      this.picked_object = null;

      if (GEUtils.isTouchDevice()) {
         this.touch_handler = (touchEvent /*: TouchEvent */) => this.touchHandler(touchEvent);
         this.canvas.addEventListener('touchstart', this.touch_handler);
      } else {
         this.mouse_handler = (mouseEvent /*: MouseEvent */) => this.mouseHandler(mouseEvent);
         this.canvas.addEventListener('mousedown', this.mouse_handler);
      }
   }
/*
```
### Mouse event handler

The mouse event handler starts and stops the drag-and-drop operation and updates the current event
location in`this.eventLocation.` Modifying the diagram is not generally done directly from this
routine; that is usually done from[`asyncPainter().`](#asynchronous-painting) An exception occurs
on normal termination by _shift-mouseup_, on which the handler
calls[`repaint()`](#asynchronous-painter)directly to update the diagram one last time.

```js
*/
   mouseHandler (mouseEvent /*: MouseEvent */) {
      if (!mouseEvent.shiftKey) {
         this.endDrag();
         return;
      }

      const bounding_box = this.canvas.getBoundingClientRect();
      this.eventLocation.x = ( (mouseEvent.clientX - bounding_box.left) / this.canvas.width) * 2 - 1;
      this.eventLocation.y = -( (mouseEvent.clientY - bounding_box.top) / this.canvas.height) * 2 + 1;

      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();

      switch (mouseEvent.type) {
      case 'mousedown':
         this.picked_object = this.pickedObject();
         if (this.picked_object != undefined) {
            this.canvas.addEventListener('mousemove', this.mouse_handler);
            this.canvas.addEventListener('mouseup', this.mouse_handler);
            this.canvas.style.cursor = 'move';  // change cursor to grab
            this.asyncPainter();  // start asynch painting
         }
         break;

      case 'mousemove':
         break;

      case 'mouseup':
         this.repaint();
         this.endDrag();
         break;

         // Unexpected events
      default:
         Log.warn(`DiagramDnD.mouseHandler unexpected event ${mouseEvent.type}`);
         this.endDrag();
      }
   }
 /*
 ```
 ### Touch event handler
 
Like the [mouse event handler](#mouse-event-handler), the touch handler starts and stops the
drag-and-drop operation and updates the current event location in`this.eventLocation.` Modifying the
diagram is not generally done directly from this routine; that is usually done
from[`asyncPainter().`](#asynchronous-painting) An exception occurs on normal termination by
*shift-mouseup*, on which the handler calls[`repaint()`](#asynchronous-painter)directly to update
the diagram one last time. There are a couple of significant differences, however:
* Mouse events associated with diagram rearrangement are easy to recognize because they are all
 modified by the *shift* key; touch events have no such discriminant. To distinguish between a short
 tap intended to display a tooltip and a tap-hold intended to reposition a node, the initial
 *touchstart* event is first checked to see whether it happened over a node or an arc. If it
 happened over a node it might be the start of a short tap intended for the tooltip handler, so the
 repositioning operation is set up as in the mouse event handler, but it is not performed
 immediately.  Instead,[`asyncPainter`](#asynchronous-painting)execution queued with a 300ms delay,
 the time of the event is recorded in`this.start_time,`and the event is allowed to propagate. If a
 *touchend* event occurs before the 300ms have elapsed the event was evidently the start of a quick
 tap, not a tap-hold, and the queued execution of`asyncPainter()`is cancelled and`endDrag()`called
 to clean up.  If no such event occurs,`asyncPainter`executes and redraws the diagram just as in the
 mouse event handler.
* It is straightforward to provide user feedback when a pick event using a mouse is successful: a
cursor change is easy to see and well understood. On a touch device, however, the finger that
performs the touch obscures the cursor, so another mechanism must be found. Nodes are easy to pick
because they are pretty large and it's easy to see the slight jump that occurs when they are
selected. (Since the touch is never in the exact center of the node, repainting the node with its
center directly under the touch always moves it a little.) Arcs, however, have a much narrower
target area and a much less noticeable jump, so on touch devices we change the color of the arc and
its arrowhead when it is picked, and then change it back upon completion of the operation.

 ```js
 */ 
   touchHandler (touchEvent /*: TouchEvent */) {
      const touchCount = touchEvent.touches.length
            + ((touchEvent.type == 'touchend') ? touchEvent.changedTouches.length : 0);
      const touch = (touchEvent.type == 'touchend') ? touchEvent.changedTouches[0] : touchEvent.touches[0];
      
      if (touchCount != 1) {
         this.endDrag();
         return;
      }

      const bounding_box = this.canvas.getBoundingClientRect();
      this.eventLocation.x = ( (touch.clientX - bounding_box.left) / this.canvas.width) * 2 - 1;
      this.eventLocation.y = -( (touch.clientY - bounding_box.top) / this.canvas.height) * 2 + 1;

      switch (touchEvent.type) {
      case 'touchstart': {
         const picked_object = this.picked_object = this.pickedObject();
         if (picked_object != undefined) {
            this.canvas.addEventListener('touchmove', this.touch_handler);
            this.canvas.addEventListener('touchend', this.touch_handler);
            
            if (picked_object.parent.name == 'lines') {
                picked_object.material.color.set('gray'); // turn arc gray to show it's been selected
                this.asyncPainter();
            } else {
                this.async_painter = window.setTimeout(() => this.asyncPainter(), 300);
            }
            this.start_time = touchEvent.timeStamp;
         } }
         break;

      case 'touchmove':
         if (this.picked_object != undefined) {
            touchEvent.stopPropagation();
            touchEvent.preventDefault();
         }
         break;

      case 'touchend':
         const picked_object = this.picked_object;
         if (picked_object != undefined) {
            // reset arc, arrowhead color
            if (picked_object.parent.name == 'lines') {
               picked_object.material.color.set(picked_object.userData.line.color);
            }

            // don't redraw if this appears to be a short tap over a node (to display a tooltip)
            //   redrawing makes the node jump in an unintended way
            if (touchEvent.timeStamp - this.start_time > 300 || picked_object.parent.name == 'lines') {
               this.repaint();
               touchEvent.preventDefault();  // prevents generation of mouse-like events (like a click)
            }

            this.endDrag();
            touchEvent.stopPropagation();  // prevents propagation that might cause, e.g., canvas rotation 
         }
         break;

      default:
         Log.warn(`DiagramDnD.touchHandler unexpected event ${touchEvent.type}`);
         this.endDrag();
      }
   }
/*
```
### Find picked object
This routine returns the top *sphere* or *line* at an `eventLocation`, or *null* if none exist.

[THREE.js](http://www.threejs.org/) has a convenient
[raycaster](https://threejs.org/docs/#api/en/core/Raycaster) class used for mouse picking.  However,
the [**THREE.Mesh**](https://threejs.org/docs/#api/en/objects/Mesh) objects created by
[**MeshLine**](https://github.com/spite/THREE.MeshLine) to achieve the wide lines used in most
Cayley diagrams (see discussion in [DisplayDiagram](./DisplayDiagram.js)) are not supported by
raycasting: you have to use the **MeshLine** object itself for raycasting, not the **THREE.Mesh**
object that created it.  Thus the [startDrag](#start-drag) routine must
* Collect all the objects we can drag and drop into `draggable_objects`
    * *spheres* (**THREE.Mesh** instances)
    * *lines* (**THREE.Line** instances for thin lines; and **THREE.Mesh** instances, generated from
      **MeshLine**, for wide lines)
* Form an array of `pickable_objects` from the `draggable_objects` by replacing the **THREE.Mesh**
  objects created from **MeshLine** with the **MeshLine** objects themselves
* Perform raycasting on the `pickable_objects` array
* If the closest resulting intersection is a **THREE.Mesh** or **THREE.Line** object, return that as
  the result. If instead the closest intersection is a **MeshLine** object, return the
  **THREE.Mesh** object that it generated
    * the **MeshLine** object is recognized as neither a **THREE.Mesh** object nor a **THREE.Line**
      object
    * a reference to the **THREE.Mesh** object generated by the **MeshLine** was placed in the
         `meshLine.geometry.userData` field by the `updateLine{s}` routines in
         [DisplayDiagram](./DisplayDiagram.js)

```js
*/
   pickedObject () /*: ?(THREE.Mesh | THREE.Line) */ {
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.eventLocation, this.displayDiagram.camera);

      // collect drag candidates, spheres & lines
      const draggable_objects /*: Array<THREE.Mesh | THREE.Line> */ =
            Array.from(((this.displayDiagram.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */)).concat(
            Array.from(((this.displayDiagram.getGroup('lines').children /*: any */) /*: Array<THREE.Mesh | THREE.Line> */)) );

       // replace Mesh objects with related MeshLines
       const pickable_objects = draggable_objects.map( (draggable) => draggable.userData.meshLine || draggable );
       
       // find intersection with closest object
       const intersects = this.raycaster.intersectObjects(pickable_objects, false);

       let result = (intersects.length == 0) ? null : ((intersects[0].object /*: any */) /*: THREE.Line | THREE.Mesh | MeshLine */);
       if (result && !result.isMesh && !result.isLine)
           // follow link in BufferGeometry created in DisplayDiagram back to Mesh
           result = ((((result /*: any */) /*: MeshLine */).geometry.userData /*: any */) /*: THREE.Mesh */);

       return ((result /*: any */) /*: ?(THREE.Mesh | THREE.Line) */);
   }
/*
```
### End drag

Generally clean up after a drag-and-drop operation
* remove event handlers that are only used during a manual rearrangement
* return the cursor to its default style (generally an arrow)
* stop [asynchronous painting](#asynchronous-painting)
* clear`this.picked_object`so even if the [asynchronous painter] runs it will exit without doing anything

```js
*/
   endDrag () {
      this.canvas.style.cursor = '';
      window.clearTimeout( ((this.async_painter /*: any */) /*: number */) );
      this.async_painter = null;
      this.picked_object = undefined;
      if (GEUtils.isTouchDevice()) {
         this.canvas.removeEventListener('touchmove', this.touch_handler);
         this.canvas.removeEventListener('touchend', this.touch_handler);   
      } else {
         this.canvas.removeEventListener('mousemove', this.mouse_handler);
         this.canvas.removeEventListener('mouseup', this.mouse_handler);
      }
   }
/*
```
### Asynchronous painting
Done asynchronously to avoid stacking up move events faster than we can paint them.
```js
*/
   asyncPainter () {
      this.repaint();
      if (this.picked_object != undefined) {
         this.async_painter = window.setTimeout(() => this.asyncPainter(), 0);
      }
   }

   // update line to run through current mouse position
   repaint () {
      if (this.picked_object != undefined) {
         if (this.picked_object.parent.name == 'lines') {
            this.redrawArc(this.picked_object);
         } else if (this.picked_object.parent.name == 'spheres') {
            this.redrawSphere( ((this.picked_object /*: any */) /*: THREE.Mesh */) );
         }
      }
   }
/*
```
### Redraw arc
Redraw the Cayley diagram, adjusting the offset so the arc is drawn under the pick point in its
original plane.  Updates the line offset of the associated [Diagram3D.Line](./Diagram3D.js)
at`line.userData,`and updates the arc and its associated arrowheads in`displayDiagram`.

<image src="../images/DiagramDnD_2.png" style="width: 605px; height: 400px; display: block;
       margin-left: auto; margin-right: auto"></img> <center><b>Arc reshaping
       geometry</b></center><br>

The figure above shows values used in the`redrawArc`calculations and their geometry (vector-valued
quantities shown in **bold**, scalars in *italics*, program variables in`code font`)
* &nbsp;**Camera** -- the observer's point of view; the`displayDiagram.camera`position
* &nbsp;**Origin** -- the coordinate origin`(0,0,0)`of the scene being viewed; the default center of
  the visualizer display
* **`start, end`**-- the start and end points of the arc being redrawn
* *`separation`*-- the distance between the**`start`**and**`end`**points
* **`center`**-- point used to determine the plane in which the arc will be drawn (see
[DisplayDiagram](./DisplayDiagram.js) for details)
* `arc_plane`-- the [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) determined by
the**`start, end,`**and**`center`**points
* **`raycaster.ray.origin`**-- the **Origin-Camera** vector
* **`raycaster.ray.direction`**-- a unit vector from the **Camera** to the pick event
* `pick_line`-- a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
through the scene in the direction of the pick event
* **`pick`**-- the intersection of the`pick_line`with`arc_plane`
* *`pick_u, pick_v`*--**`pick`**coordinates in the local **U-V** coordinate system
* *`pick_projection`*-- the projection of**`pick`**onto the**`start-end`**vector, a number between 0
  and 1
* *`offset`*-- the distance from the top of the arc to the**`start-end`**line
* *`pick_sign`*-- positive if the arc is concave towards the **`center;`** negative if it is convex

We use the [Raycasting](https://threejs.org/docs/#api/en/core/Raycaster),
[Plane](https://threejs.org/docs/#api/en/math/Plane), and
[Line3](https://threejs.org/docs/#api/en/math/Line3) classes from [THREE.js](https://threejs.org) to
calculate the new offset for the arc:
* Set`raycaster`from the position of the`displayDiagram.camera`and the pick event location.
* Create`pick_line,`a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
at**`raycaster.ray.origin`**through the scene in the direction of**`raycaster.ray.direction.`**
* Create`arc_plane,`the [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) through the
arc's**`start, end,`**and**`center`**points.
* Calculate*`pick_projection,`*the projection of the **start-pick** vector onto the **start-end**
vector as a percentage of the **start-end** vector, a number from 0 to 1.
    * Check that the**`pick`**is still over the middle of the line; if not, terminate the drag
    operation and pass the mouse/touch event along, to be treated as a command to reposition the
    whole diagram.
* Consider the local coordinate system **U-V**, centered at**`start`**, in the plane`arc_plane`(see
  diagram).
    * The points**`start, end, pick,`**and**`center`**are all contained in`arc_plane,`as well as the
    arc itself.  The problem of calculating the new line offset is two-dimensional in this
    coordinate system.
    * Calculate the local coordinates*`pick_u`*and*`pick_v`*of**`pick`**in the **U-V** coordinate
    system. (Note that in the current routine we really only calculate`|pick_v|,`since we chose the
    positive square root when a negative value would have been just as valid.)
    * A parabola passing through**`start, pick,`**and**`end`**in this coordinate system satisfies
    the equation <br>&nbsp;&nbsp;&nbsp;&nbsp;`v/offset = 4*(1 - u/separation)*(u/separation),`
    <br>so if the parabola passes through`u = pick_u`and`v = ±pick_v,`
    <br>&nbsp;&nbsp;&nbsp;&nbsp;`offset = ±pick_v * separation² / (4 * pick_u * (separation -
    pick_u)),` <br>where we still have to determine the sign.
    * The sign of the offset is positive if**`pick`**is on the opposite side of the **start-end**
    vector from**`center.`** This means that the**`start-pick-end`**triangle has the same
    orientation as the**`start-end-center`**triangle or, using vector cross products, that
    <br>&nbsp;&nbsp;&nbsp;&nbsp;**`(end-start`⨯`center-end)`·`(pick-start`⨯`end-pick)`** <br>is
    positive.

After combining these results and calculating the new arc offset, update the
[Diagram3D.Line](./Diagram3D.js) at`line.userData,`and use
[`this.displayDiagram`](./DisplayDiagram.js) methods to redraw the arc and its arrowhead.

```js
*/
   redrawArc (line /*: THREE.Line | THREE.Mesh */) {
      // update raycaster with new event location
      this.raycaster.setFromCamera(this.eventLocation, this.displayDiagram.camera);
      const pick_line = new THREE.Line3(this.raycaster.ray.origin,
                                        this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 100));
   
      const line_userData = (line.userData /*: LineUserData */);

      const start = line_userData.line.vertices[0].point;
      const end = line_userData.line.vertices[1].point;
      const center = this.displayDiagram._getCenter(line_userData.line);
      const arc_plane = new THREE.Plane().setFromCoplanarPoints(start, end, center);

      const separation = new THREE.Line3(start, end).distance();

      const pick = arc_plane.intersectLine(pick_line, new THREE.Vector3());
      const pick_projection = new THREE.Line3(start, end).closestPointToPointParameter(pick, true);
      if (pick_projection < 0.2 || pick_projection > 0.8) {  // check that pick is over middle of line
         this.endDrag();
         return;
      }

      const pick_u = pick_projection * separation;
      const pick_v = Math.sqrt(new THREE.Line3(start, pick).distanceSq() - pick_u * pick_u);
      const pick_sign = Math.sign(
         new THREE.Vector3().crossVectors(end.clone().sub(start), center.clone().sub(end))
            .dot(new THREE.Vector3().crossVectors(pick.clone().sub(start), end.clone().sub(pick))));
      const offset = pick_sign * separation * separation * pick_v / (4 * pick_u * (separation - pick_u));

      // set line offset in diagram
      line_userData.line.style = Diagram3D.CURVED;
      line_userData.line.offset = offset/separation;
       
      // redraw line, arrowheads
      this.displayDiagram.redrawLine(line);
   }
/*
```
### Redraw sphere
Redraws the Cayley diagram, moving the node in the plane normal to the camera-origin vector so that
it lies under the pick point. Updates the position of the associated
[Diagram3D.Node](./Diagram3D.js) at`sphere.userData.node,`and updates the position of the sphere and
its associated labels, highlighting, lines, and arrowheads in`displayDiagram`.

<image src="../images/DiagramDnD_1.png" style="width: 640px; height: 400px; display: block;
       margin-left: auto; margin-right: auto"></img> <center><b>Node repositioning
       geometry</b></center><br>

The figure above shows the values used in the`redrawSphere`calculation and their geometry
(vector-valued quantities shown in **bold**, program variables in`code font`):
* &nbsp;**Camera** -- the observer's point of view; the`displayDiagram.camera`position
* &nbsp;**Origin** -- the coordinate origin`(0,0,0)`of the scene being viewed; the default center of
  the visualizer display
* **`raycaster.ray.origin`**-- the **Origin-Camera** vector
* **`raycaster.ray.direction`**-- a unit vector from the **Camera** to the pick event
* `pick_line`-- a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
through the scene in the direction of the pick event
* **`camera_direction`**-- a unit vector from the **Origin** in the direction of the
  **Origin-Camera** vector
* **`curr_position`**-- vector to the current position of the node being repositioned
* `node_plane`-- a [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) normal to the
**Origin-Camera** vector containing the current node position
* **`new_position`**-- the point at which the**`pick_direction`**intersects`node_plane`

We use the [THREE.Raycaster](https://threejs.org/docs/#api/en/core/Raycaster),
[THREE.Plane](https://threejs.org/docs/#api/en/math/Plane), and
[THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) classes to calculate the new position for
the node:
* set`raycaster`from the position of the`displayDiagram.camera`and the pick event location
* create`pick_line,`a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
at**`raycaster.ray.origin`**through the scene in the direction of**`raycaster.ray.direction`**
* create`node_plane,`a [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) normal to the
**Origin-Camera** unit vector**`camera_direction`**that contains the current node
position**`curr_position`**
* calculate**`new_position,`**the point at which**`pick_line`**intersects`node_plane`

After finding the new position of the sphere, update the node position in the Diagram3D structure,
and use [`this.displayDiagram`](./DisplayDiagram.js) methods to update the sphere and its associated
highlighting, labels, lines, and arrowheads.

```js
*/
   redrawSphere (sphere /*: THREE.Mesh */) {
      // update raycaster with new event location
      this.raycaster.setFromCamera(this.eventLocation, this.displayDiagram.camera);

      const pick_line = new THREE.Line3(this.raycaster.ray.origin,
                                        this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 100));
      const camera_direction = this.raycaster.ray.origin.clone().normalize();
      const curr_position = (sphere.userData /*: SphereUserData */).node.point;
      const node_plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera_direction, curr_position);
      const new_position = node_plane.intersectLine(pick_line, new THREE.Vector3());
      
      // update Diagram3D.Node
      sphere.userData.node.point.set(...new_position.toArray());
      
      // move sphere
      this.displayDiagram.moveSphere(sphere, new_position);

      // redraw lines connected to sphere
      const node = sphere.userData.node;
      ((this.displayDiagram.getGroup('lines').children /*: any */) /*: Array<THREE.Mesh | THREE.Line> */)
         .forEach( (three_line) => {
            const line = three_line.userData.line;
            if (line.vertices[0].element == node.element || line.vertices[1].element == node.element) {
               this.displayDiagram.redrawLine(three_line);
            }
         } );
   }
}
/*
```
*/
// @flow

/*::
import BitSet from './BitSet.js';
import Diagram3D from './Diagram3D.js';
import GEUtils from './GEUtils.js';
import type {ElementTree, Elem, NodeTree, Nd} from './GEUtils.js';
import Library from './Library.js';
import XMLGroup from './XMLGroup.js';

export type layout = 0 | 1 | 2;
export type direction = 0 | 1 | 2;
export type StrategyArray = Array<[groupElement, layout, direction, number]>;

type MinCayleyDiagramJSON = {
   groupURL: string,
   diagram_name: ?string,
   arrowheadPlacement: number
}
*/

/*
 * To create a javascript approximation to nested classes we create a class definition
 *   with an 'internal use' name, and later assign it to CayleyDiagram.xxx
 */

class _CayleyDiagram_AbstractLayoutStrategy {
/*::
  +doLayout: (children: Array<Array<Diagram3D.Node>> ) => Array<Array<Diagram3D.Node>>;
   generator: groupElement;
  +layout: layout;
   direction: direction;
   nesting_level: number;
   bitset: BitSet;
*/
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      this.generator = generator;          // element# (not 0)
      this.direction = direction;          // 0/1/2 => X/Y/Z for linear, YZ/XZ/XY for curved
      this.nesting_level = nesting_level;  // 0 for innermost, increasing to outermost
   }

   width(nodes /*: Array<Diagram3D.Node> */, direction /*: direction */) /*: number */ {
      return nodes.reduce(
         (max /*: number */, node /*: Diagram3D.Node */) => Math.max(Math.abs(node.point.getComponent(direction)), max),
         0 );
   }
}

// Scale and translate children to distribute them from 0 to 1 along the <direction> line
class _CayleyDiagram_LinearLayout extends _CayleyDiagram_AbstractLayoutStrategy {
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      super(generator, direction, nesting_level);
   }

   get layout() /*: layout */ {
      return CayleyDiagram.LAYOUT.LINEAR;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
      const direction_vector = new THREE.Vector3(
         ...Array.from({length: 3}, (_, inx) => (this.direction == inx) ? 1 : 0));

      // number of children
      const num_children = children.length;

      // find a child diameter in <direction>, scale so all fit in [0,1] box
      const target_width = 1.4/(3*num_children - 1);  // heuristic
      const child_width = this.width(GEUtils.flatten_nd(children), this.direction);
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

class _CayleyDiagram_CurvedLayout extends _CayleyDiagram_AbstractLayoutStrategy {
/*::
   position: (r: number, theta: number) => THREE.Vector3;
 */
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
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
class _CayleyDiagram_CircularLayout extends _CayleyDiagram_CurvedLayout {
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
      super(generator, direction, nesting_level);
   }

   get layout() {
      return CayleyDiagram.LAYOUT.CIRCULAR;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
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
class _CayleyDiagram_RotatedLayout extends _CayleyDiagram_CurvedLayout {
/*::
   rotation: (theta: number) => THREE.Matrix4;
 */
   constructor(generator /*: groupElement */, direction /*: direction */, nesting_level /*: number */) {
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
      return CayleyDiagram.LAYOUT.ROTATED;
   }

   doLayout(children /*: Array<Array<Diagram3D.Node>> */) /*: Array<Array<Diagram3D.Node>> */ {
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

/*:: export default */
class CayleyDiagram extends Diagram3D {
/*::
   static BACKGROUND_COLOR: color;
   static NODE_COLOR: color;
   static LAYOUT: {[key: string]: layout};
   static DIRECTION: {[key: string]: direction};
   static AbstractLayoutStrategy: Class<_CayleyDiagram_AbstractLayoutStrategy>;
   static LinearLayout: Class<_CayleyDiagram_LinearLayout>;
   static CurvedLayout: Class<_CayleyDiagram_CurvedLayout>;
   static CircularLayout: Class<_CayleyDiagram_CircularLayout>;
   static RotatedLayout: Class<_CayleyDiagram_RotatedLayout>;

   strategies: Array<CayleyDiagram.AbstractLayoutStrategy>;
   diagram_name: ?string;
   ordered_nodes: NodeTree;
   chunk: number;  // chunking group.subgroups index; 0 (trivial subgroup) => no chunking

   // fields unused in GE, added for compatibility with JSON methods in DisplayDiagram.js
   elements: any;
   arrowColors: any;
 */
   constructor(group /*: XMLGroup */, diagram_name /*: ?string */) {
      super(group);
      this.background = CayleyDiagram.BACKGROUND_COLOR;
      this.strategies = [];

      this.chunk = 0;
      this.isCayleyDiagram = true;
      this.diagram_name = diagram_name;
      this.isGenerated = (diagram_name === undefined);
      this._update();
   }

   getStrategies() /*: StrategyArray */ {
      return this.strategies.map( (strategy) => [strategy.generator, strategy.layout, strategy.direction, strategy.nesting_level] );
   }

   setStrategies(strategy_parameter_array /*: StrategyArray */ ) {
      const param_array = strategy_parameter_array
         .map( (params) => { return {generator: params[0], layout: params[1], direction: params[2], nesting_level: params[3]} } );

      this.strategies = strategy_parameter_array
         .map( (parameters) => CayleyDiagram._createStrategy(...parameters) );

      this._update();
   }

    static _createStrategy(generator /*: number */, layout /*: layout */, direction /*: direction */, nesting_level /*: number */
                          ) /*: CayleyDiagram.AbstractLayoutStrategy */ {
      const class_by_layout = [CayleyDiagram.LinearLayout, CayleyDiagram.CircularLayout, CayleyDiagram.RotatedLayout];
      return new class_by_layout[layout](generator, direction, nesting_level);
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
      if (cayleyDiagram !== undefined) {
         this.nodes = cayleyDiagram.points.map(
            (point, element) => new Diagram3D.Node(element, point, {lineStyle: Diagram3D.STRAIGHT}));
         cayleyDiagram.arrows.forEach( (arrow) => this.addLines(arrow) );
         this.emitStateChange();
      }
   }

   _generateFromStrategy() {
      const node_list = this._generateNodes();
      this.ordered_nodes = this._transposeNodes(node_list);

      this.nodes = this._layout(this.ordered_nodes)
                       .sort( (a,b) => a.element - b.element );

      // makes lines for generators
      this.strategies.forEach( (strategy) => this.addLines(strategy.generator) );
      this.emitStateChange();
   }

   _generateNodes() /*: ElementTree */ {
      const generators = this.strategies.map( (strategy) => strategy.generator );

      const node_list = this.strategies.reduce( (nodes, strategy, inx) => {
         const [newNodes, newBitSet] = this._extendSubgroup(nodes, generators.slice(0, inx+1));
         this.strategies[inx].bitset = newBitSet;
         return (inx == 0) ? ((GEUtils.flatten_el(newNodes) /*: any */) /*: ElementTree */) : newNodes;
      }, [0] );

      this.emitStateChange();
      return node_list;
   }

   _extendSubgroup(H_prev /*: ElementTree */, generators /*: Array<groupElement> */) /*: [ElementTree, BitSet] */ {
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
      const result_bitset = new BitSet(this.group.order, GEUtils.flatten_el(H_prev));
      Array.from({length: this.group.elementOrders[new_generator]})
           .reduce( (cycle) => (cycle.push(this.group.mult(GEUtils.last(cycle), new_generator)), cycle), [0])
           .forEach( (el) => {
              if (!result_bitset.isSet(el)) {
                 result.push(deepMultiply(el, H_prev))
              }
           } );

      for (let inx = 1; inx < result.length; inx++) {
         let rep = -1;
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

   _transposeNodes(node_list /*: ElementTree */) /*: NodeTree */ {
      const copyPush = (arr /*: Array<groupElement> */, el /*: groupElement */) /*: Array<groupElement> */ => {
         const result = arr.slice();
         result.push(el);
         return result;
      };

      // index transformation
      const gen2nest /*: Array<number> */ = this.strategies.map( (_, index) => this.strategies.findIndex( (s) => s.nesting_level == index) );

      // allocate transpose according to space used in node_list
      const tmp /*: Array<number> */ = this.strategies.map( (_, inx) => eval('node_list' + Array(inx).fill('[0]').join('') + '.length') );
      const transpose_allocations /*: Array<number> */ = tmp.map( (_, inx, arr) => arr[gen2nest[inx]] );
      const makeEmpty = (transpose_index /*:: ?: number */ = 0) =>
            (transpose_index == transpose_allocations.length - 1) ? [] :
            Array(transpose_allocations[transpose_index]).fill().map( (_) => makeEmpty(transpose_index + 1) );

      // traverse node_list, inserting new Diagram3D.Node into transpose
      const traverse = (nodes /*: groupElement | ElementTree */, indices /*: Array<groupElement> */ = []) => {
         if (Array.isArray(nodes)) {
            nodes.forEach( (el,inx) => { traverse(el, copyPush(indices, inx)) } );
         } else {
            const line_style = indices.every(
               (index, strategy_index) => index == 0 || this.strategies[this.strategies.length - strategy_index - 1].layout == CayleyDiagram.LAYOUT.LINEAR
            ) ? Diagram3D.STRAIGHT : Diagram3D.CURVED;
            let walk /*: any */ = result;	// FIXME -- explain all this
            for ( let i = 0 ; i < indices.length - 1 ; i++ )
               walk = walk[indices[gen2nest[i]]];
            walk[indices[gen2nest[indices.length-1]]] = new Diagram3D.Node(nodes, undefined, {lineStyle: line_style});
         }
      }

      // now actually do the work
      const result /*: NodeTree */ = makeEmpty();
      traverse(node_list);

      return result;
   }

   _layout(nested_nodes /*: Diagram3D.Node | NodeTree */,
           nested_strategies /*: Array<CayleyDiagram.AbstractLayoutStrategy> */ = this.strategies.slice().sort( (a,b) => a.nesting_level - b.nesting_level )
           ) /*: Array<Diagram3D.Node> */ {

      if (Array.isArray(nested_nodes)) {
         const strategy = nested_strategies.pop();
         const child_results = [...nested_nodes.map( (children) => this._layout(children, nested_strategies) )]
         nested_strategies.push(strategy);
         const layout_results = strategy.doLayout(child_results);
         return GEUtils.flatten_nd(layout_results);
      } else {
         return [nested_nodes];
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
      const generators /*: Array<groupElement> */ = this.group.generators[0];
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
                                   [ordered_gens[1], 0, ((1-first_gen_dir /*: any */) /*: direction */), 1]]);       // see S_4
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

   emitStateChange() {
      const myURL /*: string */ = window.location.href;
      const thirdSlash /*: number */ = myURL.indexOf( '/', 8 );
      const myDomain /*: string */ = myURL.substring( 0, thirdSlash > -1 ? thirdSlash : myURL.length );
      window.postMessage( this.toJSON(), myDomain );
   }

   toJSON() /*: MinCayleyDiagramJSON */ {
      return {
         groupURL: this.group.URL,
         diagram_name: this.diagram_name,
         arrowheadPlacement: this.arrowheadPlacement
      };
   }

   fromJSON(json /*: MinCayleyDiagramJSON */) {
      this.diagram_name = json.diagram_name;
      this.arrowheadPlacement = json.arrowheadPlacement;
      var that = this;
      Library.getGroupOrDownload( json.groupURL )
             .then( ( group ) => { that.group = group; } );
   }
}


/* Initialize CayleyDiagram static variables */

CayleyDiagram.BACKGROUND_COLOR = '#E8C8C8';
CayleyDiagram.NODE_COLOR = '#8c8c8c';

CayleyDiagram.LAYOUT = {LINEAR: 0, CIRCULAR: 1, ROTATED: 2};
CayleyDiagram.DIRECTION = {X: 0, Y: 1, Z: 2, YZ: 0, XZ: 1, XY: 2};

CayleyDiagram.AbstractLayoutStrategy = _CayleyDiagram_AbstractLayoutStrategy;
CayleyDiagram.LinearLayout = _CayleyDiagram_LinearLayout;
CayleyDiagram.CircularLayout = _CayleyDiagram_CircularLayout;
CayleyDiagram.RotatedLayout = _CayleyDiagram_RotatedLayout;
// @flow
/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */
/*::
import XMLGroup from './XMLGroup.js';
import type {XMLSymmetryObject} from './XMLGroup.js';
import Diagram3D from './Diagram3D.js';

export default
 */
class SymmetryObject {
/*::
   static BACKGROUND_COLOR: color;
   static DEFAULT_SPHERE_COLOR: color;
   static DEFAULT_PATH_COLOR: color;
 */
   static _init() {
      SymmetryObject.BACKGROUND_COLOR = '#C8E8C8';
      SymmetryObject.DEFAULT_SPHERE_COLOR = '#8C8C8C';
      SymmetryObject.DEFAULT_PATH_COLOR = '#000000';
   }

   static generate(group /*: XMLGroup */, diagramName /*: string */) /*: Diagram3D */ {
      const symmetryObject =
            ((group.symmetryObjects.find( (obj) => obj.name == diagramName ) /*: any */) /*: XMLSymmetryObject */);

      const nodes = symmetryObject.spheres.map( (sphere, inx) =>
                                                new Diagram3D.Node(inx, sphere.point, {color: ((sphere.color || SymmetryObject.DEFAULT_SPHERE_COLOR) /*: color */), radius: sphere.radius}) );

      const lines = symmetryObject.paths.map( (path) => {
         const vertices = path.points.map( (point) => new Diagram3D.Point(point) );
         return new Diagram3D.Line(vertices, {color: path.color || SymmetryObject.DEFAULT_PATH_COLOR, arrowhead: false});
      } );

      return new Diagram3D(group, nodes, lines, {background: SymmetryObject.BACKGROUND_COLOR, isGenerated: false});
   }
}

// initialize static variables
SymmetryObject._init();
// @flow
/*
 * Routines to draw 3D ball-and-stick diagrams using three.js
 */
/*::
import BitSet from './BitSet.js';
import CayleyDiagram from './CayleyDiagram.js';
import type {layout, direction} from './CayleyDiagram.js';
import Diagram3D from './Diagram3D.js';
import GEUtils from './GEUtils.js';
import type {NodeTree, MeshTree} from './GEUtils.js';
import Log from './Log.md';
import MathML from './MathML.md';

export type CayleyDiagramJSON = {
   groupURL: string,
   _diagram_name: ?string,
   elements: void,
   zoomLevel: number,
   lineWidth: number,
   nodeScale: number,
   fogLevel: number,
   labelSize: number,
   arrowheadPlacement: number,
   arrowColors: Array<color>,
   _camera: Array<number>,
   highlights: {
      background: Array<void | null | color>,
      ring: Array<void | null | color>,
      square: Array<void | null | color>
   },
   strategies: Array<[groupElement, layout, direction, number]>,
   arrows: Array<?groupElement>,
   nodePositions: Array<{x: float, y: float, z: float}>,
   nodeRadii: Array<?float>,
   chunkIndex: ?number,
   arrowsData: Array<{style: number, offset: ?float}>
};

type Options = {
   container?: JQuery,
   trackballControlled?: boolean,
   width?: number,
   height?: number,
   fog?: boolean
};

export type SphereUserData = {node: Diagram3D.Node};
export type LineUserData = {
   line: Diagram3D.Line,
   vertices: Array<THREE.Vector3>,
   meshLine?: MeshLine
};

export default
 */
class DisplayDiagram {
/*::
   static groupNames: Array<string>;
   static DEFAULT_CANVAS_HEIGHT: number;
   static DEFAULT_CANVAS_WIDTH: number;
   static DEFAULT_BACKGROUND: color;
   static DEFAULT_NODE_COLOR: color;
   static DEFAULT_LINE_COLOR: color;
   static DEFAULT_FOG_COLOR: color;
   static IOS_LINE_WIDTH: number;
   static DEFAULT_ARC_OFFSET: number;
   static LIGHT_POSITIONS: Array<[number, number, number]>;

   diagram3D: Diagram3D;
   scene: THREE.Scene;
   camera: THREE.PerspectiveCamera;
   renderer: THREE.WebGLRenderer;
   camControls: THREE.TrackballControls;
 */
   /*
    * Create three.js objects to display data in container
    *
    * create a scene to hold all the elements such as lights and objects
    * create a camera, which defines the point of view
    * create a renderer, sets the size
    * add the output of the renderer to the container element (a jquery wrapped set)
    */
   constructor(options /*: Options */ = {}) {
      // Log.debug('DisplayDiagram');

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
      let container = options.container;
      if (container != undefined) {
         width = container.width();
         height = container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);

      this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true});
      this.setSize(width, height);

      if (container != undefined) {
         container.append(this.renderer.domElement);
         if (options.trackballControlled) {
            this.camControls = new THREE.TrackballControls(this.camera, container[0]);
         }
      }
   }

   setSize(w /*: number */, h /*: number */) {
      this.renderer.setSize(w, h);
   }
   getSize() /*: {w: number, h: number} */ {
       const size = this.renderer.getSize(new THREE.Vector2());
       return {w: size.width, h: size.height};
   }

   static setDefaults() {
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads', 'nodeHighlights', 'chunks']
      DisplayDiagram.DEFAULT_CANVAS_HEIGHT = 50;
      DisplayDiagram.DEFAULT_CANVAS_WIDTH = 50;
      DisplayDiagram.DEFAULT_BACKGROUND = '#E8C8C8';  // Cayley diagram background
      DisplayDiagram.DEFAULT_NODE_COLOR = '#8C8C8C';  // gray
      DisplayDiagram.DEFAULT_LINE_COLOR = '#000000';  // black
      DisplayDiagram.DEFAULT_FOG_COLOR = '#A0A0A0';
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
   getImage(diagram3D /*: Diagram3D */,
            options /*:: ?: {size?: 'small' | 'large', resetCamera?: boolean} */ = {}
           ) /*: Image */ {
      // Options parameter:
      // size: "small" or "large", default is "small"
      // resetCamera: true or false, default is true
      options = {size: (options.hasOwnProperty('size')) ? options.size : 'small',
                 resetCamera: (options.hasOwnProperty('resetCamera')) ? options.resetCamera : true};
      const img = new Image();

      this.scene.userData = diagram3D;

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
   showGraphic(diagram3D /*: Diagram3D */) {
      // Log.debug('showGraphic');

      // save diagram
      this.scene.userData = diagram3D;

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

   getGroup(name /*: string */) /*: THREE.Group */ {
      return ((this.scene.children.find( (el) => el.name == name ) /*: any */) /*: THREE.Group */);
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
   setCamera(diagram3D /*: Diagram3D */) {
      // Log.debug('setCamera');

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

   setBackground(diagram3D /*: Diagram3D */) {
      // Log.debug('setBackground');

      let background = diagram3D.background;
      if (background == undefined)
         background = DisplayDiagram.DEFAULT_BACKGROUND;
      this.renderer.setClearColor(background, 1.0);
   }

   // Create, arrange lighting
   updateLights(_diagram3D /*: Diagram3D */) {
      // Log.debug('updateLights');

      const lights = this.getGroup('lights');
      lights.remove(...lights.children);
      DisplayDiagram.LIGHT_POSITIONS.forEach( (position) => {
         const light = new THREE.DirectionalLight();
         light.position.set(...position);
         lights.add(light);
      } )
   }

   // Create a sphere for each node, add to scene as THREE.Group named "spheres"
   updateNodes (diagram3D /*: Diagram3D */, sphere_facets /*: number */ = 20) {
      // Log.debug('updateNodes');

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      const materialsByColor /*: Map<string, THREE.MeshPhongMaterial> */ = new Map(),
            geometriesByRadius /*: Map<number, THREE.SphereGeometry> */ = new Map();

      const default_color = DisplayDiagram.DEFAULT_NODE_COLOR.toString();
      const default_radius = 0.3 / Math.sqrt(diagram3D.nodes.length);
      diagram3D.nodes.forEach( (node) => {
         const color = (node.color === undefined) ? default_color : node.color.toString();
         let materialWithColor = materialsByColor.get(color);
         if (materialWithColor == undefined) {
            materialWithColor = new THREE.MeshPhongMaterial({color: node.color});
            materialsByColor.set(color, materialWithColor);
         }

         const radius = (node.radius == undefined) ? default_radius : node.radius;
         let geometryWithRadius = geometriesByRadius.get(radius);
         if (geometryWithRadius == undefined) {
            geometryWithRadius = new THREE.SphereGeometry(radius * diagram3D.nodeScale, sphere_facets, sphere_facets);
            geometriesByRadius.set(radius, geometryWithRadius);
         }

         const sphere = new THREE.Mesh(geometryWithRadius, materialWithColor);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         sphere.name = diagram3D.group.representation[node.element];
         spheres.add(sphere);
      } )
   }

   updateHighlights (diagram3D /*: Diagram3D */) {
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children);

      const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */),
            materialsByColor = spheres.reduce( (materials, sphere) => materials.set(sphere.material.color, sphere.material), new Map() );

      spheres.forEach( (sphere) => this.drawHighlight(sphere, materialsByColor) );
   }

   drawHighlight (sphere /*: THREE.Mesh */, materialsByColor /*: Map<THREE_Color, THREE.Material> */) {
      const node = ((this.scene.userData /*: any */) /*: Diagram3D */)
            .nodes[((sphere.userData /*: any */) /*: SphereUserData */).node.element],
            sphere_geometry = ((sphere.geometry /*: any */) /*: THREE.Geometry */);

      // Find sphere's desired color: priority is colorHighlight, then color, then default
      let color = node.colorHighlight;
      if (color == undefined) color = node.color;
      if (color == undefined) color = DisplayDiagram.DEFAULT_NODE_COLOR;
      const desiredColor = new THREE.Color(color);

      // If sphere is not desired color set material color to desired color
      if (!sphere.material.color.equals(desiredColor)) {
         let materialWithDesiredColor = materialsByColor.get(desiredColor);
         if (materialWithDesiredColor == undefined) {
            materialWithDesiredColor = new THREE.MeshPhongMaterial({color: desiredColor.getHex()});
            materialsByColor.set(desiredColor, materialWithDesiredColor);
         }
         sphere.material = materialWithDesiredColor;
         sphere_geometry.uvsNeedUpdate = true;
      }

      // if node has ring, draw it
      if (node.ringHighlight !== undefined) {
         this._drawRing(node, sphere_geometry.parameters.radius);
      }

      // if node has square, draw it
      if (node.squareHighlight !== undefined) {
         this._drawSquare(node, sphere_geometry.parameters.radius);
      }
   }

   _drawRing(node /*: Diagram3D.Node */, nodeRadius /*: number */) {
      // Expand ring to clear sphere
      const scale = 2.5 * nodeRadius;  // 2.5: experimental computer science in action...

      // create new canvas with enough pixels to get smooth circle
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw circle
      const context = canvas.getContext('2d');
      context.lineWidth = 0.66 / scale;  // scales to webGl lineWidth = 10
      const ringHighlight = node.ringHighlight;
      if (ringHighlight != undefined)
         context.strokeStyle = ringHighlight.toString();
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

   _drawSquare(node /*: Diagram3D.Node */, nodeRadius /*: number */) {
      // Expand square to clear ring (which clears sphere)
      const scale = 2.65 * nodeRadius;

      // create new canvas
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw square
      const context = canvas.getContext('2d');
      context.lineWidth = 1.2 / scale;  // scales to webGl lineWidth = 10
      const squareHighlight = node.squareHighlight;
      if (squareHighlight != undefined)
         context.strokeStyle = squareHighlight.toString();
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
   updateLabels(diagram3D /*: Diagram3D */) {
      // Log.debug('updateLabels');

      const labels = this.getGroup('labels');
      labels.remove(...labels.children);

      if (diagram3D.labelSize == 0) {
         return;
      }

      const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */),
            radius = ((spheres[0].geometry /*: any */) /*: THREE.Geometry */).parameters.radius;
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
         const node = ((sphere.userData /*: any */) /*: SphereUserData */).node;
         if (node.label === undefined || node.label == '') {
            return;
         };

         // make canvas big enough for any label and offset it to clear the node while still being close
         const canvas = document.createElement('canvas');
         canvas.id = `label_${node.element}`;
         const context = canvas.getContext('2d');

         const textLabel = MathML.toUnicode(node.label);
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
   updateLines (diagram3D /*: Diagram3D */, use_webgl_native_lines /*:: ?: boolean */ = false) {
      // Log.debug('updateLines');

      const lines = diagram3D.lines;
      const spheres = this.getGroup('spheres').children;
      const lineGroup = this.getGroup('lines');
      lineGroup.remove(...lineGroup.children);
      const userAgent /*: string */ = window.navigator.userAgent;
      const isIOS = !!userAgent.match(/iPad/i) || !!userAgent.match(/iPhone/i);
      // This generally works, but Chrome/Linux can't display its max (!?) -- punt for the moment
      // const maxLineWidth = this.renderer.context.getParameter(
      //   this.renderer.context.ALIASED_LINE_WIDTH_RANGE)[1];
      const maxLineWidth = 1;

      lines.forEach( (line) => {
         const vertices = line.vertices,
               lineColor = (line.color == undefined) ? DisplayDiagram.DEFAULT_LINE_COLOR : line.color,
               lineWidth = use_webgl_native_lines ? 1
                              : (isIOS ? DisplayDiagram.IOS_LINE_WIDTH
                                 : (this.getSize().w < 400 ? 1 : diagram3D.lineWidth)),
               line_vertices = this.getLineVertices(line),
               geometry = new THREE.Geometry();
         geometry.vertices = line_vertices;

         let newLine;
         if (lineWidth <= maxLineWidth) {
            const lineMaterial = new THREE.LineBasicMaterial({color: lineColor, linewidth: lineWidth});
            newLine = new THREE.Line(geometry, lineMaterial);
            newLine.userData = {line: line, vertices: line_vertices};
         } else {
            const lineMaterial = new MeshLineMaterial({
               color: new THREE.Color(lineColor),
               lineWidth: lineWidth,
               sizeAttenuation: false,
               side: THREE.DoubleSide,
               resolution: new THREE.Vector2(((window.innerWidth /*: any */) /*: float */),
                                             ((window.innerHeight /*: any */) /*: float */)),
               fog: true,
            });
            const meshLine = new MeshLine();
            meshLine.setGeometry(geometry);
            newLine = new THREE.Mesh(meshLine.geometry, lineMaterial);
            meshLine.geometry.userData = newLine;
            newLine.userData = {line: line, vertices: line_vertices, meshLine: meshLine};
         }
         lineGroup.add(newLine);
      } )
   }

   redrawLine (line_or_mesh /*: THREE.Line | THREE.Mesh */) {
      const line_userData = ((line_or_mesh.userData /*: any */) /*: LineUserData */);

      // Update object differently depending on whether it's a Line or a Mesh
      const new_vertices = this.getLineVertices(line_userData.line);
      line_userData.vertices = new_vertices;
      if (line_or_mesh.isLine) {
         // Just update geometry in current line if they're the same length
         const line = ((line_or_mesh /*: any */) /*: THREE.Line */);
         if (line.geometry.vertices.length != new_vertices.length) {
            line.geometry.dispose();
            line.geometry = new THREE.Geometry()
            line.geometry.vertices = new_vertices;
         }
         line.geometry.vertices = new_vertices;
         line.geometry.verticesNeedUpdate = true;
      } else {
         const mesh = ((line_or_mesh /*: any */) /*: THREE.Mesh */);
         
         // Create new Geometry
         const geometry = new THREE.Geometry();
         geometry.vertices = new_vertices;

         // Create new MeshLine
         const mesh_line = new MeshLine();
         mesh_line.setGeometry(geometry);
         line_userData.meshLine = mesh_line;

         // Replace geometry in current mesh and dispose of current geometry
         const old_geometry = mesh.geometry;
         mesh.geometry = ((mesh_line.geometry /*: any */) /*: THREE.BufferGeometry */);
         mesh.geometry.userData = mesh;  // create link in BufferGeometry back to Mesh
         old_geometry.dispose();
      }

      if (line_userData.line.arrowhead) {
         this.redrawArrowhead(line_or_mesh);
      }
   }

   getLineVertices (line /*: Diagram3D.Line */) /*: Array<THREE.Vector3> */ {
      const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */),
            vertices = line.vertices;

      if (vertices[0].isPoint) {
         return vertices.map( (vertex) => vertex.point );
      }

      // offset center of arc 20% of the distance between the two nodes, in the plane of center/start/end
      if (line.style == Diagram3D.CURVED) {
         line.offset = (line.offset == undefined) ? 0.2 : line.offset;
         const points = this._curvePoints(line);
         return points;
      }

      // arc around intervening points
      line.offset = undefined;
      const get_radius = (sphere) => ((sphere.geometry /*: any */) /*: THREE.Geometry */).parameters.radius,
            thisSphere = ((spheres.find( (sphere) => get_radius(sphere) !== undefined ) /*: any */) /*: THREE.Mesh */),
            radius = get_radius(thisSphere),
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
               line.offset = 1.7*radius/Math.sqrt(start2end_sq);
               const points = this._curvePoints(line);
               return points;
            }
      }

      return vertices.map( (vertex) => vertex.point );
   }

   // inherent problem with this approach if start, end, and center are co-linear
   _curvePoints(line /*: Diagram3D.Line */) /*: Array<THREE.Vector3> */ {
      const start = line.vertices[0].point,
            end = line.vertices[1].point,
            center = this._getCenter(line),
            midpoint = start.clone().add(end).multiplyScalar(0.5),
            plane_normal = new THREE.Vector3().crossVectors(start.clone().sub(center), end.clone().sub(center)).normalize(),
            start_end_normal = new THREE.Vector3().crossVectors(end.clone().sub(start), plane_normal).normalize(),
            offset = ((line.offset /*: any */) /*: float */) * end.clone().sub(start).length(),
            middle = midpoint.clone().addScaledVector(start_end_normal, 2*offset),
            curve = new THREE.QuadraticBezierCurve3(start, middle, end),
            points = curve.getPoints(10);
      line.middle = middle;
      return points;
   }

   _getCenter(line /*: Diagram3D.Line */) /*: THREE.Vector3 */ {
      const centerOK = (point) => new THREE.Vector3().crossVectors(startPoint.clone().sub(point), endPoint.clone().sub(point)).lengthSq() > 1.e-4;
      const startNode = ((line.vertices[0] /*: any */) /*: Diagram3D.Node */),
            endNode = ((line.vertices[1] /*: any */) /*: Diagram3D.Node */),
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

      Log.warn("can't find center for line curve!");
      line.center = new THREE.Vector3();
      return line.center;
   }

   updateArrowheads(diagram3D /*: Diagram3D */) {
      // Log.debug('updateArrowheads');

      const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
      const lines = ((this.getGroup('lines').children /*: any */) /*: Array<THREE.Line | THREE.Mesh> */);;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      const arrowheadPlacement = diagram3D.arrowheadPlacement;

      lines.forEach( (line) => {
         if (! ((line.userData /*: any */) /*: LineUserData */).line.arrowhead) {
            return;
         }
         const lineData = ((line.userData /*: any */) /*: LineUserData */).line,
               startNode = ((lineData.vertices[0] /*: any */) /*: Diagram3D.Node */),
               startPoint = startNode.point,
               endNode = ((lineData.vertices[1] /*: any */) /*: Diagram3D.Node */),
               endPoint = endNode.point,
               geometry = ((spheres[endNode.element].geometry /*: any */) /*: THREE.Geometry */),
               nodeRadius = geometry.parameters.radius,
               center2center = startPoint.distanceTo(endPoint),
               headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
               headWidth = 0.6 * headLength,
               arrowLength = 1.1 * headLength,
               color = line.material.color.getHex();
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
         arrowhead.userData = line;
         arrowheads.add(arrowhead);
      } )
   }

   redrawArrowhead (line /*: THREE.Line | THREE.Mesh */) {
      const arrowheadPlacement = ((this.scene.userData /*: any */) /*: Diagram3D */).arrowheadPlacement,
            arrowheads = this.getGroup('arrowheads'),
            lineData = ((line.userData /*: any */) /*: LineUserData */).line,
            startNode = ((lineData.vertices[0] /*: any */) /*: Diagram3D.Node */),
            startPoint = startNode.point,
            endNode = ((lineData.vertices[1] /*: any */) /*: Diagram3D.Node */),
            endPoint = endNode.point,
            spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */),
            geometry = ((spheres[endNode.element].geometry /*: any */) /*: THREE.Geometry */),
            nodeRadius = geometry.parameters.radius,
            center2center = startPoint.distanceTo(endPoint),
            headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
            headWidth = 0.6 * headLength,
            arrowLength = 1.1 * headLength,
            color = line.material.color.getHex(),
            old_arrowhead = arrowheads.children.find( (arrowhead) => (arrowhead.userData == line) );
      if (center2center <= 2*nodeRadius) {
         return;
      }
      if (old_arrowhead != undefined) {
         arrowheads.remove(old_arrowhead);
      } else {
         const s = 1;
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
      const new_arrowhead = new THREE.ArrowHelper(arrowDir, arrowStart, arrowLength, color, headLength, headWidth);
      new_arrowhead.userData = line;
      arrowheads.add(new_arrowhead);
   }

   updateChunking(_diagram3D /*: Diagram3D */) {
      // Log.debug('updateChunking');

      const diagram3D /*: CayleyDiagram */ = ((_diagram3D /*: any */) /*: CayleyDiagram */);

      // remove old chunks
      const chunks = this.getGroup('chunks');
      chunks.remove(...chunks.children);

      // find new chunk
      if (!diagram3D.isCayleyDiagram || diagram3D.chunk == 0) {
         return;
      }

      // utility functions
      const centroid = (points /*: Array<THREE.Vector3> */) =>
            points.reduce( (sum, point) => sum.add(point), new THREE.Vector3() ).multiplyScalar(1/points.length);

      const getGeometry = () => {
         // get points of subgroup
         const subgroup_index = diagram3D.chunk,
               chunk_members = diagram3D.group.subgroups[subgroup_index].members,
               chunk_points = chunk_members.toArray().map( (el) => diagram3D.nodes[el].point ),
               chunk_size = chunk_points.length;

         // find (x,y,z) extrema of subgroup nodes
         const [X_min, X_max, Y_min, Y_max, Z_min, Z_max] = chunk_points.reduce(
            ([Xm,XM,Ym,YM,Zm,ZM], p /*: THREE.Vector3 */) => [Math.min(Xm,p.x),Math.max(XM,p.x),Math.min(Ym,p.y),Math.max(YM,p.y),Math.min(Zm,p.z),Math.max(ZM,p.z)],
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);

         let padding;
         if (chunk_size == diagram3D.group.order) {
            padding = 0.2 * Math.max(X_max - X_min, Y_max - Y_min, Z_max - Z_min);
         } else {
            const coset_membership /*: Array<number> */ =
                  diagram3D.group
                           .getCosets(chunk_members, true)
                           .reduce( (mem, coset, inx) => {
                              coset.toArray().forEach( (el) => mem[el] = inx );
                              return mem;
                           }, Array(chunk_size) );
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
         color: '#303030',
         opacity: 0.2,
         transparent: true,
         side: THREE.FrontSide,
         depthWrite: false,  // needed to keep from obscuring labels underneath
         depthTest: false,
      } );

      let subgroup_name;  // MathML subgroup name, generated first time through
      const createChunks = (arr /*: NodeTree */, desired, current = diagram3D.strategies.length - 1) /*: Array<THREE.Mesh> */ => {
         if (current == desired) {
            const nodes = GEUtils.flatten_nd(arr);
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
            // arr is an array of NodeTrees at this point, though the logic that ensures this is convoluted
            const boxes = ((arr.map( (el) => createChunks(((el /*: any */) /*: NodeTree */), desired, current-1)
                                   ) /*: any */) /*: Array<Array<THREE.Mesh>> */);
            const all_boxes = GEUtils.flatten_msh(((boxes /*: any */) /*: MeshTree */));
            const strategy = diagram3D.strategies[current];
            if (strategy.layout == CayleyDiagram.LAYOUT.ROTATED) {
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

      const last_strategy = diagram3D.strategies.findIndex( (strategy) => strategy.bitset.equals(diagram3D.group.subgroups[diagram3D.chunk].members) );
      chunks.add(...createChunks(diagram3D.ordered_nodes, last_strategy));
   }

   // Render graphics, recursing to animate if a TrackballControl is present
   render() {
      this.renderer.render(this.scene, this.camera);
      if (this.camControls !== undefined) {
         window.requestAnimationFrame( () => this.render() );
         this.camControls.update();
      }
   }

   updateZoomLevel(diagram3D /*: Diagram3D */) {
      this.camera.zoom = diagram3D.zoomLevel;
      this.camera.updateProjectionMatrix();
   }

   updateLineWidth(diagram3D /*: Diagram3D */) {
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
   }

   updateNodeRadius(diagram3D /*: Diagram3D */) {
      this.updateNodes(diagram3D);
      this.updateHighlights(diagram3D);
      this.updateLabels(diagram3D);
      this.updateArrowheads(diagram3D);
   }

   // reduce fog level by increasing 'far' parameter (experimentally determined coefficients :-)
   //   (diagram3D.fogLevel is in [0,1])
   updateFogLevel(diagram3D /*: Diagram3D */) {
      // distance of furthest point from (0,0,0)
      const squaredRadius = diagram3D.nodes.reduce( (sqrad,nd) => Math.max(sqrad, nd.point.lengthSq()), 0 );
      const sceneRadius = (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
      const cameraDistance = this.camera.position.length();
      this.scene.fog.color = new THREE.Color(diagram3D.background || DisplayDiagram.DEFAULT_BACKGROUND);
      this.scene.fog.near = cameraDistance - sceneRadius - 1;
      this.scene.fog.far = (diagram3D.fogLevel == 0) ? 100 : (cameraDistance + sceneRadius*(5 - 4*diagram3D.fogLevel));
   }

   updateLabelSize(diagram3D /*: Diagram3D */) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D /*: Diagram3D */) {
      this.updateArrowheads(diagram3D);
   }

   // move a Node and its associated label, highlights, lines, etc. to a new location
   moveSphere(sphere /*: THREE.Mesh */, location /*: THREE.Vector3 */) {
      // clear existing highlights
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children.filter(
         (highlight) => GEUtils.equals(highlight.position.toArray(), sphere.position.toArray())
      ));

      // change sphere position
      sphere.position.set(...location.toArray());

      // find sphere_index and update the corresponding label's position
      const spheres = ((this.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */);
      const sphere_index = spheres.findIndex( (sp) => sp.uuid == sphere.uuid );
      const label = this.getGroup('labels').children[sphere_index];
      label.position.set(...location.toArray());

      // update highlights
      const materialsByColor = spheres.reduce( (materials, sphere) => materials.set(sphere.material.color, sphere.material), new Map() );
      this.drawHighlight(sphere, materialsByColor);
   }

   // get objects at point x,y using raycasting
   getObjectsAtPoint (x /*: number */, y /*: number */) /*: Array<THREE.Object3D> */ {
      const mouse = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      const spheres = this.getGroup('spheres').children;
      let intersects = raycaster.intersectObjects(spheres, false);
      if (intersects.length == 0) {
         const chunks = this.getGroup('chunks').children;
         intersects = raycaster.intersectObjects(chunks, false);
      }

      return intersects.map( (intersect) => intersect.object );
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition(element /*: number */, cayleyDiagram /*: CayleyDiagram */) /*: {x: number, y: number} */ {
      const point3d = cayleyDiagram.nodes[element].point.clone(),
            point2d = point3d.project( this.camera );
      return { x: point2d.x/2 + 1/2, y: -point2d.y/2 + 1/2 };
   }

   // two serialization functions
   toJSON(cayleyDiagram /*: CayleyDiagram */) /*: CayleyDiagramJSON */ {
      const tmp = {
         groupURL: cayleyDiagram.group.URL,
         _diagram_name: cayleyDiagram.diagram_name,
         elements: cayleyDiagram.elements,
         zoomLevel: cayleyDiagram.zoomLevel,
         lineWidth: cayleyDiagram.lineWidth,
         nodeScale: cayleyDiagram.nodeScale,
         fogLevel: cayleyDiagram.fogLevel,
         labelSize: cayleyDiagram.labelSize,
         arrowheadPlacement: cayleyDiagram.arrowheadPlacement,
         arrowColors: cayleyDiagram.arrowColors,
         _camera: this.camera.matrix.toArray(),
         highlights: {
            background: (cayleyDiagram.nodes.map( n => n.colorHighlight ) /*: Array<void | null | color> */),
            ring: (cayleyDiagram.nodes.map( n => n.ringHighlight ) /*: Array<void | null | color> */),
            square: (cayleyDiagram.nodes.map( n => n.squareHighlight ) /*: Array<void | null | color> */)
         },
         strategies: cayleyDiagram.getStrategies(),
         arrows: cayleyDiagram.lines.map( x => x.arrow )
            .filter( ( v, i, s ) => s.indexOf( v ) === i ), // incl. each only 1x
         nodePositions: cayleyDiagram.nodes.map( node => {
            return { x: node.point.x, y: node.point.y, z: node.point.z };
         } ),
         nodeRadii: cayleyDiagram.nodes.map( node => node.radius ),
         chunkIndex: cayleyDiagram.chunk,
         arrowsData: cayleyDiagram.lines.map( ( arrow, index ) => {
            return { style: arrow.style, offset: arrow.offset };
         } )
      };
      // Log.debug( 'Sending:', tmp );
      return tmp;
   }

   fromJSON(json /*: CayleyDiagramJSON */, cayleyDiagram /*: CayleyDiagram */) {
      // Log.debug( 'Received:', json );
      // no check for has own property, because we want to erase it
      // if it isn't included in the diagram
      cayleyDiagram.diagram_name = json._diagram_name;
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
         ((json.arrows /*: any */) /*: Array<groupElement> */).map( x => cayleyDiagram.addLines( x ) );
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
      cayleyDiagram.chunk = json.chunkIndex || 0;
      if ( json.arrowsData )
         json.arrowsData.map( ( arrow, index ) => {
            cayleyDiagram.lines[index].style = arrow.style;
            cayleyDiagram.lines[index].offset = arrow.offset;
         } );
   }
}
// @flow
/*::
import DisplayMulttable from './DisplayMulttable.js';
import GEUtils from './GEUtils.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

export type Coloration = 'Rainbow' | 'Grayscale' | 'None';

export default
 */
class Multtable {
/*::
   static COLORATION: {[key: string]: Coloration};

   group: XMLGroup;
   elements: Array<groupElement>;
   separation: number;
   organizingSubgroup: number;
   _coloration: Coloration;
   _colors: ?Array<color>;
   backgrounds: void | Array<color>;
   borders: void | Array<color | void>;
   corners: void | Array<color | void>;
 */   
   constructor(group /*: XMLGroup */) {
      this.group = group;
      this.reset();
   }

   reset() {
      this.separation = 0;
      this.organizeBySubgroup(this.group.subgroups.length - 1);
      this.coloration = Multtable.COLORATION.RAINBOW;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroupIndex /*: number */) /*: Multtable */ {
      const subgroup = this.group.subgroups[subgroupIndex];
      this.elements = GEUtils.flatten_el(
         this.group.cosetsArray(GEUtils.flatten_el(this.group.closureArray(subgroup.generators)), false) );
      this.organizingSubgroup = subgroupIndex;
      this._colors = null;
      return this;
   }

   setSeparation (separation /*: number */) {
       this.separation = separation;
   }

   get colors() /*: Array<color> */ {
      let result;
      if (this.backgrounds != undefined) {
         result = this.backgrounds;
      } else if (this._colors != undefined) {
         result = this._colors;
      } else {
         const frac = (inx, max, min) => Math.round(min + inx * (max - min) / this.group.order);

         let fn;
         switch (this.coloration) {
         case Multtable.COLORATION.RAINBOW:
            fn = (inx) => GEUtils.fromRainbow(frac(inx, 100, 0)/100);
            break;
         case Multtable.COLORATION.GRAYSCALE:
            fn = (inx) => {
               const lev = frac(inx, 255, 60);  // start at 60 (too dark and you can't see the label)
               return `rgb(${lev}, ${lev}, ${lev})`;
            };
            break;
         case Multtable.COLORATION.NONE:
            fn = (inx) => DisplayMulttable.BACKGROUND;
            break;
         }
      
         this._colors = result = (this.elements.map( (el,inx) => [inx, el] ) /*: Array<[number, groupElement]> */)
                                               .sort( ([_a, x], [_b, y]) => x - y )
                                               .map( ([inx,_]) => fn(inx) );
      }

      return result;
   }

   get coloration() /*: Coloration */ {
      return this._coloration;
   }
      
   set coloration(coloration /*: Coloration */) {
      this._coloration = coloration;
      this._colors = null;
   }

   get stride() /*: number */ {
      return (this.organizingSubgroup == undefined) ? this.group.order : this.group.subgroups[this.organizingSubgroup].order;
   }

   get size() /*: number */ {
      return this.group.order + this.separation * ((this.group.order/this.stride) - 1);
   }

   swap(i /*: number */, j /*: number */) {
      // $FlowFixMe: Flow doesn't seem to understand this sort of deconstructing
      [this.elements[i], this.elements[j]] = [this.elements[j], this.elements[i]];
      this._colors = null;
   }

   position(index /*: number */) /*: void | number */ {
      return (index < 0 || index > this.group.order) ? undefined : index + this.separation * Math.floor(index/this.stride);
   }

   index(position /*: number */) /*: void | number */ {
      const inx = Math.floor(position - this.separation * Math.floor(position / (this.stride + this.separation)));
      return (inx < 0 || inx > this.group.order - 1) ? undefined : inx;
   }

   /*
    * Highlight routines
    *   if only one color is needed (a common case) make each highlight color different
    *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
    */
   highlightByBackground(elements /*: Array<Array<groupElement>> */) {
      const backgrounds = this.backgrounds = new Array(this.group.order).fill(DisplayMulttable.BACKGROUND);
      elements.forEach( (els, colorIndex) => {
         els.forEach( (el) => backgrounds[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
      } );
   }

   highlightByBorder(elements /*: Array<Array<groupElement>> */) {
      const borders = this.borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            els.forEach( (el) => borders[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
         } );
      }
   }

   highlightByCorner(elements /*: Array<Array<groupElement>> */) {
      const corners = this.corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            els.forEach( (el) => corners[el] = GEUtils.fromRainbow(colorIndex/elements.length) );
         } );
      }
   }

   clearHighlights() {
      this.backgrounds = undefined;
      this.borders = undefined;
      this.corners = undefined;
   }
}

Multtable.COLORATION = {RAINBOW: 'Rainbow', GRAYSCALE: 'Grayscale', NONE: 'None'};
// @flow
/*::
import Log from './Log.md';
import Multtable from './Multtable.js';
import type {Coloration} from './Multtable.js';

export type MulttableJSON = {
   groupURL: string,
   elements: Array<groupElement>,
   separation: number,
   organizingSubgroup: number,
   coloration: Coloration,
   highlights: {
      background: void | Array<color>,
      border: void | Array<color | void>,
      corner: void | Array<color | void>
   }
}

type Options = {
   container?: JQuery,
   width?: number,
   height?: number,
   size?: string
};

export default
 */
class DisplayMulttable {
/*::
   static DEFAULT_CANVAS_HEIGHT: number;
   static DEFAULT_CANVAS_WIDTH: number;
   static ZOOM_STEP: number;
   static MINIMUM_FONT: number;
   static BACKGROUND: string;
   options: Options;
   canvas: HTMLCanvasElement;
   context: CanvasRenderingContext2D;
   zoomFactor: number;
   translate: {dx: number, dy: number};
   transform: THREE.Matrix3;
   multtable: Multtable;
   permutationLabels: void | Array<void | Array<string>>;
 */
   // height & width, or container
   constructor(options /*: Options */ = {}) {
      Log.debug('DisplayMulttable');

      DisplayMulttable._setDefaults();

      this.options = options;

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      const container = options.container;
      if (container !== undefined) {
         width = container.width();
         height = container.height();
      } else {
         width = (options.width === undefined) ? DisplayMulttable.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayMulttable.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.canvas = (($(`<canvas/>`)[0] /*: any */) /*: HTMLCanvasElement */);  // Narrowing for Flow
      this.setSize( width, height );
      this.context = this.canvas.getContext('2d');

      if (container !== undefined) {
         container.append(this.canvas);
      }
      this.zoomFactor = 1;  // user-supplied scale factor multiplier
      this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
      this.transform = new THREE.Matrix3();  // current multtable -> screen transformation
   }

   setSize (w /*: number */, h /*: number */){
      this.canvas.width = w;
      this.canvas.height = h;
   }

   getSize() /*: {w: number, h: number} */ {
      return {w: this.canvas.width, h: this.canvas.height};
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
      DisplayMulttable.ZOOM_STEP = 0.1;
      DisplayMulttable.MINIMUM_FONT = 2;
      DisplayMulttable.BACKGROUND = '#F0F0F0';
   }

   getImage(multtable /*: Multtable */, options /*:: ?: {size: 'small' | 'large'} */ = {size: 'small'}) /*: Image */ {
      if ( options.size == 'large' )
         this.showLargeGraphic(multtable);
      else
         this.showSmallGraphic(multtable);
      const img = new Image();
      img.src = this.canvas.toDataURL();
      return img;
   }

   // Small graphic has no grouping, no labels, doesn't change canvas size
   showSmallGraphic(multtable /*: Multtable */) {
      const frac = (inx, max) => Math.round(max * inx / multtable.group.order);
      const colors = multtable.colors;

      const width = this.canvas.width;
      const height = this.canvas.height;
      multtable.elements.forEach( (i,inx) => {
         multtable.elements.forEach( (j,jnx) => {
            this.context.fillStyle = (colors[multtable.group.mult(j,i)] || DisplayMulttable.BACKGROUND).toString();
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
   showLargeGraphic(multtable /*: Multtable */) {
      if (multtable != this.multtable) {
         this.multtable = multtable;
         this.permutationLabels = (multtable.group.longestLabel[0] == '(') ? Array(multtable.group.order) : undefined;
      }

      // note that background shows through in separations between cosets
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.fillStyle = DisplayMulttable.BACKGROUND;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // set up scaling, translation from multtable units to screen pixels
      const scale = this.zoomFactor * Math.min(this.canvas.width / multtable.size, this.canvas.height / multtable.size, 200);

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
            const x /*: number */ = multtable.position(inx) || 0;
            const y /*: number */ = multtable.position(jnx) || 0;

            const product = multtable.group.mult(multtable.elements[jnx], multtable.elements[inx]);

            // color box according to product
            this.context.fillStyle = (multtable.colors[product] || DisplayMulttable.BACKGROUND).toString();
            this.context.fillRect(x, y, 1, 1);

            // draw borders if cell has border highlighting
            if (multtable.borders != undefined && multtable.borders[product] != undefined) {
               this._drawBorder(x, y, scale, multtable.borders[product]);
            }

            // draw corner if cell has corner highlighting
            if (multtable.corners !== undefined && multtable.corners[product] != undefined) {
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
            const x = multtable.position(inx) || 0;
            const y = multtable.position(jnx) || 0;
            const product = multtable.group.mult(multtable.elements[jnx], multtable.elements[inx]);
            this._drawLabel(x, y, product, scale, fontScale);
         }
      }
   }

   _drawBorder(x /*: number */, y /*: number */, scale /*: number */, color /*: color */) {
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

   _drawCorner(x /*: number */, y /*: number */, scale /*: number */, color /*: color */) {
      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.moveTo(x, y);
      this.context.lineTo(x+0.2, y);
      this.context.lineTo(x, y+0.2);
      this.context.fill();
   }

   _drawLabel(x /*: number */, y /*: number */, element /*: number */, scale /*: number */, fontScale /*: number */) {
      const width = (text /*: string */) => (text === undefined) ? 0 : this.context.measureText(text).width;

      const label = this.multtable.group.labels[element];
      const permutationLabels = this.permutationLabels;
      if (permutationLabels === undefined) {
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         this.context.fillText(label, labelLocation.x, labelLocation.y);
      } else {    // break permutations into multiple lines
         let permutationLabel = permutationLabels[element];
         if (permutationLabel === undefined) {   // seen this label before?
            // split whole label into multiple lines if needed
            const cycles = ((label.match(/[(][^)]*[)]/g) /*: any */) /*: RegExp$matchResult */);
            const lines /*: Array<string> */ = [];
            let last = 0;
            for (const cycle of cycles) {
               if (width(lines[last]) + width(cycle) < 0.8 * scale) {
                  lines[last] = (lines[last] == undefined) ? cycle : lines[last].concat(cycle);
               } else {
                  if (lines[last] != undefined) {
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
            permutationLabels[element] = permutationLabel = lines;
         }

         const fontHeight = fontScale * 19 / 14;
         const labelLocation = new THREE.Vector2(x+1/2, y+1/2).applyMatrix3(this.transform);
         const maxLineWidth = permutationLabel.reduce( (max, line /*: string */) => Math.max(max, width(line)), 0 );
         let xStart = labelLocation.x - maxLineWidth/2;
         let yStart = labelLocation.y - fontHeight*(permutationLabel.length - 1)/2;
         for (const line /*: string */ of permutationLabel) {
            this.context.fillText(line, xStart, yStart);
            yStart += fontHeight;
         }
      }
   }

   // interface for zoom-to-fit GUI command
   reset() {
      this.zoomFactor = 1;
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

   zoom(factor /*: number */) {
      this._centeredZoom(factor -  1);
      return this;
   }

   // changing the translation keeps the center of the model centered in the canvas
   _centeredZoom(dZoom /*: number */) {
      this.zoomFactor = this.zoomFactor * (1 + dZoom);
      this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
   }

   // deltaX, deltaY are in screen coordinates
   move(deltaX /*: number */, deltaY /*: number */) {
      this.translate.dx += deltaX;
      this.translate.dy += deltaY;
      return this;
   }

   // Compute Multtable 0-based row, column from canvas-relative screen coordinates by inverting this.transform
   //   returns null if point is outside Multtable
   xy2rowXcol(canvasX /*: number */, canvasY /*: number */) /*: ?{row: number, col: number} */ {
      const mult = new THREE.Vector2(canvasX, canvasY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const x = this.multtable.index(mult.x);
      const y = this.multtable.index(mult.y);
      return (x == undefined || y == undefined) ? null : {col: x, row: y};
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition(element /*: number */, multtable /*: Multtable */) {
      const max = multtable.position( multtable.group.order - 1 ) + 1;
      const index = multtable.elements.indexOf( element );
      return { x: 0.5 / max, y: ( multtable.position( index ) + 0.5 ) / max };
   }

   // two serialization functions
   toJSON(multtable /*: Multtable */) /*: MulttableJSON */ {
      return {
         groupURL: multtable.group.URL,
         elements: multtable.elements,
         separation: multtable.separation,
         organizingSubgroup: multtable.organizingSubgroup,
         coloration: multtable.coloration,
         highlights: {
            background: multtable.backgrounds,
            border: multtable.borders,
            corner: multtable.corners
         }
      };
   }
   fromJSON(json /*: MulttableJSON */, multtable /*: Multtable */) {
      if ( json.elements ) multtable.elements = json.elements;
      if ( json.separation ) multtable.separation = json.separation;
      if ( json.organizingSubgroup ) multtable.organizingSubgroup = json.organizingSubgroup;
      if ( json.coloration ) multtable.coloration = json.coloration;
      if ( json.highlights && json.highlights.background )
         multtable.backgrounds = json.highlights.background;
      if ( json.highlights && json.highlights.border )
         multtable.borders = json.highlights.border;
      if ( json.highlights && json.highlights.corner )
         multtable.corners = json.highlights.corner;
   }
}
//@flow
/*::
import XMLGroup from './XMLGroup.js';

export type Highlights = {background: Array<color>; border: Array<color>; top: Array<color>};

type Coordinate = {x: float, y: float};
type Path = {
   pts: Array<Coordinate>,
   partIndex?: number,
   part?: Array<Array<groupElement>>,
   cycleIndex?: number,
   cycle?: Array<groupElement>,
   pathIndex?: number
};

export default
*/
class CycleGraph {
/*::
   static SOME_SETTING_NAME: string;
   group: XMLGroup;
   SOME_SETTING_NAME: string;
   elements: Array<groupElement>;
   cycles: Array<Array<groupElement>>;
   positions: Array<Coordinate>;
   rings: Array<number>;
   cyclePaths: Array<Path>;
   partIndices: Array<number>;
   bbox: {left: number, right: number, top: number, bottom: number};
   closestTwoPositions: number;
   highlights: Highlights;
 */   
   constructor(group /*: XMLGroup */) {
      this.group = group;
      this.layOutElementsAndPaths();
      this.findClosestTwoPositions();
      this.reset();
   }

   static _init() {
      CycleGraph.SOME_SETTING_NAME = 'its default value';
   }

   // gcd of two natural numbers
   static gcd(n /*: number */, m /*: number */) /*: number */ { return m ? CycleGraph.gcd( m, n % m ) : n; }

   // orbit of an element in the group, but skipping the identity
   orbitOf(g /*: groupElement */) /*: Array<groupElement> */ {
      var result = [ 0 ];
      var next;
      while ( next = this.group.mult( result[result.length-1], g ) )
         result.push( next );
      result.shift();
      return result;
   }

   // element to a power
   raiseToThe(h /*: groupElement */, n /*: number */) /*: groupElement */ {
      var result = 0;
      for ( var i = 0 ; i < n ; i++ ) result = this.group.mult( result, h );
      return result;
   }

   // how soon does the orbit of g intersect the given list of elements?
   // that is, consider the smallest power of g that appears in the array;
   // at what index does it appear?
   howSoonDoesOrbitIntersect(g /*: groupElement */, array /*: Array<groupElement> */) /*: number */ {
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
   bestPowerRelativeTo(h /*: groupElement */, g /*: groupElement */) /*: number */ {
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
   static easeUp(t /*: float */) /*: float */ {
      return ( Math.cos( ( 1 - t ) * Math.PI ) + 1 ) / 2;
   }
   // and another going downhill, from (0,1) to (1,0)
   static easeDown(t /*: float */) /*: float */ { return 1 - CycleGraph.easeUp( 1 - t ); }

   // generic linear interpolation function
   static interp(A /*: float */, B /*: float */, t /*: float */) /*: float */ { return ( 1 - t ) * A + t * B; }

   // mutating a point in the upper half plane to sit within the arc
   // defined by two given angles alpha and beta, pulled toward the
   // center of that arc with a specific level of gravity, 0<=g<=1.
   static mutate(x /*: float */, y /*: float */, alpha /*: float */, beta /*: float */, g /*: float */) /*: Coordinate */ {
      var r = Math.sqrt( x*x + y*y );
      var theta = Math.atan2( y, x );
      var theta2 = CycleGraph.interp( alpha, beta, theta/Math.PI );
      var x2 = r * Math.cos( theta2 );
      var y2 = r * Math.sin( theta2 );
      var cx = Math.cos( ( alpha + beta ) / 2 ) / 2;
      var cy = Math.sin( ( alpha + beta ) / 2 ) / 2;
      return {
         x: CycleGraph.interp( x2, cx, g ),
         y: CycleGraph.interp( y2, cy, g )
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
            return aName.length < bName.length ? -1 : (aName.length > bName.length ?  1 : 0);
         } );
      }
      // for ( var i = 0 ; i < this.group.order ; i++ ) Log.debug( i, this.group.representations[this.group.representationIndex][i] );

      // compute a list of cycles
      var cycles /*: Array<Array<groupElement>> */ = [ ];
      var notYetPlaced /*: Array<groupElement> */ = eltsByName.slice();
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
      // Log.debug( 'cycle', JSON.stringify( cycles ) );

      // partition the cycles, forming a list of lists.
      // begin with all cycles in their own part of the partition,
      // and we will unite parts until we can no longer do so.
      var partition /*: Array<Array<Array<groupElement>>> */ = cycles.map( cycle => [ cycle ] );
      var that = this;
      function uniteParts ( partIndex1 /*: number */, partIndex2 /*: number */ ) {
         partition[partIndex2].forEach( cycle => {
            var cycleGen = cycle[0];
            var partGen = partition[partIndex1][0][0];
            var replacement = that.raiseToThe( cycleGen,
               that.bestPowerRelativeTo( cycleGen, partGen ) );
            partition[partIndex1].push( that.orbitOf( replacement ) );
         } );
         partition.splice( partIndex2, 1 );
      }
      function flattenPart ( part /*: Array<Array<groupElement>> */ ) /*: Array<groupElement> */ {
         return part.reduce( ( acc, cur ) => acc.concat( cur ) );
      }
      function arraysIntersect ( a1 /*: Array<groupElement> */, a2 /*: Array<groupElement> */ ) /*: boolean */ {
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
      // Log.debug( 'partition', JSON.stringify( partition ) );
      // sanity check:
      // partition.forEach( ( part, i ) => {
      //    partition.forEach( ( otherPart, j ) => {
      //       if ( i > j ) return;
      //       part.forEach( ( cycle, ii ) => {
      //          otherPart.forEach( ( otherCycle, jj ) => {
      //             const inSamePart = ( i == j );
      //             const commonElt = cycle.find( ( x ) => otherCycle.indexOf( x ) > -1 );
      //             if ( !inSamePart && typeof( commonElt ) != 'undefined' ) {
      //                Log.err( `Cycle ${ii} in part ${i} is ${cycle} `
      //                       + `and cycle ${jj} in part ${j} is ${otherCycle} `
      //                       + `and they share ${commonElt}.` );
      //             }
      //          } );
      //       } );
      //    } );
      // } );

      // assign arc sizes to parts of the partition
      // (unless there is only one part, the degenerate case)
      if ( partition.length > 1 ) {
         // find the total sizes of all cycles in each part
         var partSizes /*: Array<number> */ = [ ];
         for ( var i = 0 ; i < partition.length ; i++ ) {
            var size = 0;
            for ( var j = 0 ; j < partition[i].length ; j++ )
               size += partition[i][j].length;
            partSizes.push( size );
         }
         // assign angles proportional to those sizes,
         // but renormalize to cap the max at 180 degrees if needed
         var total /*: number */ = 0;
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
      // Log.debug( 'cumsums', cumsums );

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
      // Log.debug( 'angle-ified', cumsums );

      // assign locations in the plane to each element,
      // plus create paths to be drawn to connect them
      this.positions = Array( this.group.order ).fill( null );  // marker to show we haven't computed them yet
      this.positions = [ { x: 0, y: 0 } ]; // identity at origin
      this.rings = Array( this.group.order ).fill( 0 );
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
                   // Log.debug( `rings[${curr}] := ${cycleIndex}` );
                   this.positions[curr] = f( this.rings[curr], i, 1 );
               }
               var path /*: Path */ = {pts: []};
               const step = 0.02;
               // Log.debug( `connecting ${this.rings[prev]} to ${this.rings[curr]}` );
               // if ( prev && curr && this.partIndices[prev] != this.partIndices[curr] )
               //    Log.err( `index[${prev}]=${this.partIndices[prev]}!=${this.partIndices[curr]}=index[${curr}]` );
               for ( var t = 0 ; t <= 1+step/2 ; t += step ) {
                  var ring1 = f( this.rings[prev], i, t );
                  var ring2 = f( this.rings[curr], i, t );
                  var et = CycleGraph.easeUp( t );
                  path.pts.push( {
                     x: CycleGraph.interp( ring1.x, ring2.x, et ),
                     y: CycleGraph.interp( ring1.y, ring2.y, et )
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
      this.bbox = { left: 0, right: 0, top: 0, bottom: 0 };
      this.cyclePaths.forEach( points => {
         points.pts.forEach( pos => {
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
   _partitionToColorArray(partition /*: Array<Array<groupElement>> */, start /*: groupElement */) /*: Array<color> */ {
      var result = Array(this.group.order);
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

   highlightByBackground(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.background =
         this._partitionToColorArray( partition, 0 );
   }

   highlightByBorder(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.border =
         this._partitionToColorArray( partition, 120 );
   }

   highlightByTop(partition /*: Array<Array<groupElement>> */) {
      if ( !this.highlights ) this.highlights = { };
      this.highlights.top =
         this._partitionToColorArray( partition, 240 );
   }

   clearHighlights() {
      this.highlights = { };
   }
}

CycleGraph._init();
// @flow
/*::
import Log from './Log.md';
import CycleGraph from './CycleGraph.js';
import type {Highlights} from './CycleGraph.js';

type Options = {width?: number, height?: number, container?: JQuery};

export type CycleGraphJSON = {groupURL: string, highlights: Highlights, elements: Array<groupElement>}

export default
 */
class DisplayCycleGraph {
/*::
   static DEFAULT_MIN_CANVAS_HEIGHT: number;
   static DEFAULT_MIN_CANVAS_WIDTH: number;
   static DEFAULT_MIN_RADIUS: number; 
   static DEFAULT_ZOOM_STEP: number;
   static DEFAULT_CANVAS_WIDTH: number;
   static DEFAULT_CANVAS_HEIGHT: number;

   canvas: HTMLCanvasElement;
   context: CanvasRenderingContext2D;
   options: Options;
   zoomFactor: number;
   translate: {dx: number, dy: number};
   transform: THREE.Matrix3;
   cycleGraph: CycleGraph;
   radius: number;
 */
   constructor(options /*: Options */) {
      Log.debug('DisplayCycleGraph');

      DisplayCycleGraph._setDefaults();

      if (options === undefined) {
         options = {};
      }

      this.canvas = (($(`<canvas/>`)[0] /*: any */) /*: HTMLCanvasElement */);
      let width = (options.width === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_WIDTH : options.width;
      let height = (options.height === undefined) ? DisplayCycleGraph.DEFAULT_CANVAS_HEIGHT : options.height;
      const container = options.container;
      if (container != undefined) {
         // take canvas dimensions from container (if specified), option, or default
         width = container.width();
         height = container.height();
         container.append(this.canvas);
      }
      this.setSize( width, height );
      this.context = this.canvas.getContext('2d');
      this.options = options;
      this.zoomFactor = 1;  // user-supplied scale factor multiplier
      this.translate = {dx: 0, dy: 0};  // user-supplied translation, in screen coordinates
      this.transform = new THREE.Matrix3();  // current cycleGraph -> screen transformation
   }

   setSize(w /*: number */, h /*: number */) {
      this.canvas.width = w;
      this.canvas.height = h;
   }
   getSize() /*: {w: number, h: number} */ {
      return { w: this.canvas.width, h: this.canvas.height };
   }

   static _setDefaults() {
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_HEIGHT = 200;
      DisplayCycleGraph.DEFAULT_MIN_CANVAS_WIDTH = 200;
      DisplayCycleGraph.DEFAULT_MIN_RADIUS = 30;
      DisplayCycleGraph.DEFAULT_ZOOM_STEP = 0.1;  // zoom in/zoom out step
   }

   getImage(cycleGraph /*: CycleGraph */, options /*:: ?: {size?: 'small' | 'large'} */ = {} ) /*: Image */ {
      // Options parameter:
      // size: "small" or "large", default is "small"
      options = {size: (options.hasOwnProperty('size')) ? options.size : 'small'};
      if ( options.size == 'large' )
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
   showSmallGraphic(cycleGraph /*: CycleGraph */) {
      this.showLargeGraphic( cycleGraph, true );
   }

   // Draws the visualization at an optimal (large) size.
   // All the data needed about the group and how to lay it out in the
   // plane has been computed at construction time by the cycleGraph
   // object, and we can leverage that here and just do drawing.
   // The second parameter, which defaults to true, says whether to omit
   // the names inside the elements.  (False == normal behavior, true
   // == a smaller graphic in the end, useful for thumbnails.)
   showLargeGraphic(cycleGraph /*: CycleGraph */, hideNames /*: boolean */ = false) {
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
      let scale = this.zoomFactor * raw_scale;

      // translate center of scaled bbox to center of canvas
      let x_translate = (this.canvas.width - scale*(bbox.right + bbox.left))/2;
      let y_translate = (this.canvas.height - scale*(bbox.top + bbox.bottom))/2;

      // algorithm doesn't cover trivial group, treat it specially
      if (this.cycleGraph.group.order == 1) {
         const sideLength = Math.min(this.canvas.width, this.canvas.height);
         this.radius = sideLength / 10;
         scale = this.zoomFactor * sideLength / (sideLength + 4 * this.radius);
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
      this.context.strokeStyle = '#000';
      cycleGraph.cyclePaths.forEach( points => {
         var isDrawing = true; // was the last
         this.context.beginPath();
         points.pts.forEach( ( point, index ) => {
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
                // but you can't assume that we already did lineTo() the last point.
                var prev = points.pts[index-1];
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
            this.context.fillStyle = cycleGraph.highlights.background[elt].toString();
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
            this.context.fillStyle = cycleGraph.highlights.top[elt].toString();
            this.context.fill();
         }

         // draw the border around the node, defaulting to thin black,
         // but using whatever highlighting information for borders is
         // in the cycleGraph, and if it's there, making it thick
         this.context.beginPath();
         this.context.arc( pos.x, pos.y, this.radius, 0, 2 * Math.PI );
         if ( cycleGraph.highlights && cycleGraph.highlights.border
           && cycleGraph.highlights.border[elt] ) {
            this.context.strokeStyle = cycleGraph.highlights.border[elt].toString();
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
      this.zoomFactor = 1;
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

   zoom(factor /*: number */) {
      this._centeredZoom(factor -  1);
      return this;
   }

   // changing the translation keeps the center of the model centered in the canvas
   _centeredZoom(dZoom /*: float */) {
      this.zoomFactor = this.zoomFactor * (1 + dZoom);
      this.move(this.translate.dx * dZoom, this.translate.dy * dZoom);
   }

   // deltaX, deltaY are in screen coordinates
   move(deltaX /*: float */, deltaY /*: float */) {
      this.translate.dx += deltaX;
      this.translate.dy += deltaY;
      return this;
   }

   // given screen coordinates, returns element associated with node,
   //   or 'undefined' if not within one radius
   select(screenX /*: number */, screenY /*: number */) /*: void | groupElement */ {
      // compute cycleGraph coordinates from screen coordinates by inverting this.transform
      const cg_coords = new THREE.Vector2(screenX, screenY).applyMatrix3(new THREE.Matrix3().getInverse(this.transform));
      const index = this.cycleGraph.positions.findIndex( (pos) =>
         Math.sqrt( Math.pow( pos.x - cg_coords.x, 2 ) + Math.pow( pos.y - cg_coords.y, 2 ) ) < this.radius
      );
      return (index == -1) ? undefined : index;
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition(element /*: groupElement */, cycleGraph /*: CycleGraph */) /*: {x: float, y: float} */ {
      const virtualCoords = new THREE.Vector3( cycleGraph.positions[element].x,
                                               cycleGraph.positions[element].y, 0 ),
            // multiplying a transform by a vector does not translate it, unfortunately:
            untranslatedCanvasCoords = virtualCoords.applyMatrix3( this.transform ),
            // so we do the translation manually:
            translatedCanvasCoords = {
               x: this.transform.elements[6] + untranslatedCanvasCoords.x,
               y: this.transform.elements[7] + untranslatedCanvasCoords.y
            };
      return { x: translatedCanvasCoords.x / this.canvas.width,
               y: translatedCanvasCoords.y / this.canvas.height };
   }

   // two serialization functions
   toJSON(cycleGraph /*: CycleGraph */) /*: CycleGraphJSON */ {
      return {
         groupURL: cycleGraph.group.URL,
         highlights: cycleGraph.highlights,
         elements: cycleGraph.elements
      };
   }
   fromJSON(json /*: CycleGraphJSON */, cycleGraph /*: CycleGraph */) {
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
