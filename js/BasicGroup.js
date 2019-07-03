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
