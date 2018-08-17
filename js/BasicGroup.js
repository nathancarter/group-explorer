
/*
 * Class holds group defined only by a multiplication table
 */

class BasicGroup {
   constructor (multtable) {
      if (multtable === undefined) return;

      this.multtable = multtable;

      // derived properties
      this.order = this.multtable.length;
      this.elements = this.multtable[0];
      this.inverses = this.elements.map(el => this.multtable[el].indexOf(0));
      this.isAbelian = this.multtable.every(
         (el, i) => this.multtable[i].every(
            (el, j) => (this.multtable[i][j] == this.multtable[j][i])
         ));
      [this.elementPowers, this.elementPrimePowers] = this.getElementPowers(this);
      this.elementOrders = this.elementPowers.map(el => el.popcount());
      this.isCyclic = this.elementOrders.some(el => el == this.order);
      this.orderClasses = this.getOrderClasses(this.elementOrders);
      this.conjugacyClasses = this.getConjugacyClasses(this.elements);
      this._isSolvable = undefined;
      this._subgroups = undefined;
      this._isSimple = undefined;
      this._generators = undefined;
   }

   static parseJSON(jsonObject, _group) {
      const group = (_group === undefined) ? Object.assign(new BasicGroup, jsonObject) : _group;

      group.elementPowers = jsonObject.elementPowers.map(
         (el, inx) => Object.assign(new BitSet, jsonObject.elementPowers[inx]));
      group.elementPrimePowers = jsonObject.elementPrimePowers.map(
         (el, inx) => Object.assign(new BitSet, jsonObject.elementPrimePowers[inx]));
      group.conjugacyClasses = jsonObject.conjugacyClasses.map(
         (el, inx) => Object.assign(new BitSet, jsonObject.conjugacyClasses[inx]));
      group.orderClasses = group.orderClasses.reduce(
         (acc, el, inx) => { if (el != null) {
            acc[inx] = Object.assign(new BitSet, el);
         }; return acc; }, [] );
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
      if (this._generators === undefined) {
         const generatorIndexes = function* (curr, max, lev, _sel) {
            const sel = _sel === undefined ? [] : _sel;
            if (lev == 0) {
               yield sel;
            } else if (curr < max) {
               for (let inx = curr; inx < max; inx++) {
                  const newSel = sel.slice();
                  newSel.push(inx);
                  yield *generatorIndexes(inx + 1, max, lev - 1, newSel);
               }
            }
         }

         this._generators = [this.subgroups[this.subgroups.length-1].generators.toArray()];
         const maxLevels = Math.min(5, this._generators[0].length);
         for (let levels = 2; levels < maxLevels; levels++) {
            for (const generators of generatorIndexes(1, this.order, levels)) {
               if (this.closure(generators).popcount() == this.order) {
                  this._generators = [generators];
               }
            }
         }
      }
      return this._generators;
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
      const mult = (isLeft || true) ?
                   (a,b) => this.multtable[a][b] : (a,b) => this.multtable[b][a];
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
      const cosets = this.getCosets(subgroupBitset);
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
      return new BasicGroup(newMult);
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
      return new BasicGroup(newMult);
   }

   mult(a,b) {
      return this.multtable[a][b];
   }
}
