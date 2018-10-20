// not sure if adding this method to Array is an altogether good idea, but it's awfully useful
//   Alternatives:  move it?  delete it? turn it into a free-standing function somewhere?

if (Array.prototype.equals === undefined) {
   Array.prototype.equals = function (other) {
      return Array.isArray(other) &&
             (this.length == other.length) &&
             this.every( (el,inx) => el == other[inx] );
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

      // Replacing named entities with values ensure that later fragment parsing succeeds...
      const cleanText = text.replace(/&Zopf;/g, "&#8484;")
                            .replace(/&times;/g, "&#215;")
                            .replace(/&ltimes;/g, "&#8905;")
                            .replace(/&rtimes;/g, "&#8906;")
                            .replace(/<br.>/g, "&lt;br/&gt;");  // hack to read fgb notes
      const $xml = $($.parseXML(cleanText));
      super(XMLGroup._multtable_from_xml($xml));

      this.$xml = $xml;
      this.name = $xml.find('name').first().html();
      this.shortName = $xml.find('name').first().attr('text');
      this.definition = $xml.find('definition').first().html();
      this.phrase = $xml.find('phrase').text();
      this.notes = $xml.find('notes').text();
      this.author = $xml.find('author').text();
      this._generators = (this._generators = XMLGroup._generators_from_xml($xml),
                          this._generators.length == 0 ? undefined : this._generators);
      this.representations = XMLGroup._representations_from_xml($xml);
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

   get representation() {
      return this.representations[this.representationIndex];
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

   // returns generators spec'd in XML, not those derived in subgroup computation
   static _generators_from_xml($xml) {
      return $xml.find('generators')
                 .map(function () {
                    return [
                       this.attributes[0].value.split(' ')
                           .map(function (el) { return parseInt(el) }) ]
                 })
                 .toArray();
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
      if (allSubgroups[allSubgroups.length - 1].members.popcount() != group.order) {
         isSolvable = false;
         if (group._generators !== undefined && group._generators.length != 0) {
            allSubgroups.push(
               new Subgroup(group, group.generators[0]).setAllMembers());
         }
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
      // remove old generators if they're also generated by the new element
      subgroup.generators.subtract(this.group.elementPowers[normalizer]);
      subgroup.generators.set(normalizer);
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
}

class IsomorphicGroups {
   static init() {
      if (IsomorphicGroups.map !== undefined) {
         return;
      }
      
      IsomorphicGroups.map = Library.getGroups()
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
                             .filter( H => G.orderClassSizes.equals(H.orderClassSizes) )
                             // .filter( H => G.subgroupOrders.equals(H.subgroupOrders) )
                             // .filter( H => G.conjClassSizes.equals(H.conjClassSizes) )
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
         if (!g2h.slice().sort( (a,b) => a - b ).equals(G.elements)) {
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
}
/*
# Templates

Most of what appears on the screen in GE3 is dynamic HTML, created at runtime by javascript and formatted by CSS stylesheets. This is often the result of a complex combination of HTML, CSS, and javascript, and it can difficult to read the code behind a web page to understand how the displayed data is derived and how it will appear. Every GE3 web page uses this 'template' pattern (though it may use others, too), making a template from a section of HTML with placeholders in it to represent data values that are to be replaced at runtime. This approach makes it easier to separate the layout of the data from the code that generates it. In GE3 this is done on the client side by javascript using HTML5 template tags and ES6 template literals.

## Example

*(Note that example code may be simplified from the actual implementation.)*

The subset display panel in the visualizer pages provides a ready example. The format for a subgroup is given by a template tag like this, similar to those in [subsets.html](../subsetDisplay/subsets.html):

```html
<template id="subgroup_template">
   <li id="${this.id}">
      ${this.name} = &lt; ${generators} &gt; is a subgroup of ${subgroupOrder}
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
     ${this.name} = &lt; ${generators} &gt; is a subgroup of order ${subgroupOrder}
 </li>`
```

Note the back ticks ` at the start and end of the string: this is an ES6 template literal.  When it is eval'd in a scope which has the referenced values defined, as excerpted from [SSD.Subgroups](../subsetDisplay/Subgroup.js):

```js
const generators = this.generators.toArray().map( el => math(group.representation[el]) ).join(', ');
const subgroupOrder = this.subgroup.order;
const subgroupLine = eval(Template.HTML('subgroup_template');
```

The expressions enclosed by curly braces ${...} are evaluated and replaced in the string. At this point (for one of the subgroups of <i>D<sub>4</sub></i>), `subgroupLine` will be a string of HTML like the following:

```html
<li id="1">
    <i>H<sub>1</sub></i> = &lt; <i>r<sup>2</sup></i> &gt; is a subgroup of order 2.
</li>
```

This can be appended to the list of subgroups in the DOM with a simple jQuery command

```js
$('#subgroups').append(subgroupLine)
```

to give the following line in the list of subgroups:

&nbsp;&nbsp;&nbsp;&nbsp;<i>H<sub>1</sub></i> = &lt; <i>r<sup>2</sup></i> &gt; is a subgroup of order 2.

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

class Library {
   static _init() {
      if (Library.groups === undefined) {
         Library.groups = [];
      }
   }

   static loadFromInvocation() {
      const hrefURL = new URL(window.location.href);
      return new Promise( (resolve, reject) => {
         if (hrefURL.searchParams.get('library') !== null) {
            const libraryBlobURL = hrefURL.searchParams.get('library');
            Library.getLibraryFromBlob(libraryBlobURL)
                   .then( (library) => {
                      const groupIndex = hrefURL.searchParams.get('index');
                      resolve({library: library, groupIndex: groupIndex})
                   } )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('group') !== null) {
            const groupBlobURL = hrefURL.searchParams.get('group');
            Library.getGroupFromBlob(groupBlobURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}))
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupJSONURL') !== null) {
            const groupJSONURL = hrefURL.searchParams.get('groupJSONURL');
            Library.getGroupFromJSONURL(groupJSONURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupJSON') !== null) {
            const groupJSONText = hrefURL.searchParams.get('groupJSON');
            var groupJSON;
            try {
               groupJSON = JSON.parse( groupJSONText );
            } catch ( error ) {
               reject( error );
            }
            Library.getGroupFromJSON(groupJSON)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupURL') !== null) {
            const groupURL = hrefURL.searchParams.get('groupURL');
            Library.getGroupFromURL(groupURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}))
                   .catch( (error) => reject(error) );
         } else {
            /*
             * When this page is loaded in an iframe, the parent window can
             * indicate which group to load by passing the full JSON
             * definition of the group in a postMessage() call to this
             * window, with the format { type : 'load group', group : G },
             * where G is the JSON data in question.
             */
            addEventListener( 'message', function ( event ) {
               if (event.data.type == 'load group') {
                  Library.getGroupFromJSON(event.data.group)
                         .then( (group) =>
                            resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                         .catch( (error) => reject(error) );
               }
            }, false );
         }
      } )
   }

   static getLibraryFromBlob(libraryBlobURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: libraryBlobURL,
                  success: (data) => {
                     Library.groups = data.map( jsonObject => XMLGroup.parseJSON(jsonObject) );
                     resolve(Library.groups);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${libraryBlobURL}: ${err}`);
                  }
         })
      } );
   }

   static getGroupFromBlob(groupBlobURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupBlobURL,
                  success: (data) => {
                     const group = XMLGroup.parseJSON(data);
                     resolve(group);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${libraryBlobURL}: ${err}`);
                  }
         })
      } );
   }

   static getGroupFromJSON(groupJSON) {
      return new Promise( (resolve, reject) => {
         try {
            resolve( XMLGroup.parseJSON( groupJSON ) );
         } catch ( error ) {
            reject( error );
         }
      } )
   }

   static getGroupFromJSONURL(groupJSONURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupJSONURL,
                  success: (json) => {
                     const group = XMLGroup.parseJSON(json);
                     resolve(group);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${groupJSON}: ${err}`);
                  }
         })
      } )
   }

   static getGroupFromURL(groupURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  success: (txt) => {
                     try {
                        const group = new XMLGroup(txt);
                        group.URL = groupURL;
                        resolve(group);
                     } catch (err) {
                        reject(`Error parsing ${groupURL}: ${err}`);
                     }
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${groupURL}: ${err}`);
                  }
         })
      } );
   }

   static addGroupFromText(groupFileText) {
   }

   static getGroups() {
      return Library.groups;
   }

   static add(group) {
      Library.groups.push(group);
      return Library.groups;
   }

   static findIndex(group) {
      return Library.groups.findIndex( (g) => g == group );
   }

   static openWithLibrary(pageURL, g, opts) {
      // routine can be invoked with several meanings for 'g'
      let groupIndex;
      if (typeof g == 'number') {	// we were passed the index of the group
         groupIndex = g;
      } else {				// we were passed the group itself
         groupIndex = Library.findIndex(g);
         if (groupIndex == -1) {	// the group was not in the library
            Library.add(g);		//   add it and pretend it was there all along
            groupIndex = Library.findIndex(g);
         }
      }

      // create Blob from library
      const blobURL = URL.createObjectURL(
         new Blob([JSON.stringify(Library.groups)], {type: 'application/json'}));

      // compute URL
      let url = Library._appendOptions(`./${pageURL}?library=${blobURL}&index=${groupIndex}`, opts);

      window.open(url);
   }

   static openWithGroup(pageURL, g, opts) {
      // routine can be invoked with several meanings for 'g'
      let group
      if (typeof g == 'number') {	// we were passed the index of the group
         group = Library.groups[g];
      } else {				// we were passed the group itself
         group = g;
      }

      // create Blob from group
      const blobURL = URL.createObjectURL(
         new Blob([JSON.stringify(group)], {type: 'application/json'}));

      // compute URL
      let url = Library._appendOptions(`./${pageURL}?group=${blobURL}`, opts);

      window.open(url);
   }

   // append optional parameters to the URL, if supplied
   static _appendOptions(url, options) {
      if (options !== undefined) {
         for (const option in options) {
            if (options[option] !== undefined) {
               url += `&${option}=${options[option]}`;
            }
         }
      }
      return url;
   }
}

Library._init();
/*
 * generate {nodes, lines} from $xml data
 *
 * caller adds node color, label; line color, width
 */

class CayleyDiagram {
   constructor(group) {
      this.group = group;
   }

   static _init() {
      CayleyDiagram.BACKGROUND_COLOR = 0xE8C8C8;
      CayleyDiagram.NODE_COLOR = 0x8c8c8c;
   }

   static generate(group, diagramName) {
      // const [nodes, lines] = (diagramName === undefined) ? gen._generate() : gen._fromGroup(diagramName);
      let nodes, lines;
      if (diagramName === undefined) {
         [nodes, lines] = new CayleyDiagram(group)._generate();
         lines.forEach( (line) => { line.vertices = line.vertices.map( (vertex) => nodes[vertex] ) } );
      } else {
         [nodes, lines] = new CayleyDiagram(group)._fromGroup(diagramName);
      }

      const hashPoint = (point) => (((10 + point.x)*10 + point.y)*10 + point.z)*10;
      const linesByEndpoints = new Map();
      lines.forEach( (line) => {
         const start = hashPoint(line.vertices[0].point);
         const end = hashPoint(line.vertices[1].point);
         const forwardHash = 100000*start + end;
         const reverseHash = 100000*end + start;
         if (linesByEndpoints.has(reverseHash)) {
            linesByEndpoints.get(reverseHash).arrow = false;
         } else {
            linesByEndpoints.set(forwardHash, line);
         }
      } );

      const diagram = new Diagram3D(nodes, [...linesByEndpoints.values()]);
      diagram.background = CayleyDiagram.BACKGROUND_COLOR;
      diagram.setNodeColor(CayleyDiagram.NODE_COLOR)
             .setLineColors();

      return diagram;
   }

   _fromGroup(diagramName) {
      const cayleyDiagram = this.group.cayleyDiagrams.find( (cd) => cd.name == diagramName );
      const nodes = cayleyDiagram.points.map( (point, element) => new Diagram3D.Node(element, point) );
      const lines =
         cayleyDiagram.arrows.reduce(
            (lines, arrow) =>
               this.group.elements.reduce(
                  (lines, element) => {
                     const start = nodes[element];
                     const end = nodes[this.group.mult(element, arrow)];
                     lines.push(new Diagram3D.Line([start, end], {userData: arrow}));
                     return lines;
                  },
                  lines ),
            []);
      return [nodes, lines];
   }

   _generate() {
      let nodes, lines, cosets;
      if (this.group.order == 1) {
         return this._genNull(0);
      }
      let generators = this.group.generators[0];

      const genOrders = generators.map(el => this.group.elementOrders[el]);
      const orderedGenerators = generators
         .slice()
         .sort((el1, el2) => this.group.elementOrders[el1] - this.group.elementOrders[el2])
      if (generators.length == 1) {
         cosets = this._getCosets(generators);
         [nodes, lines] = this._genCircle('xy', generators[0], cosets[0], this._genNull)(0)
      } else if (generators.length == 2) {
         if (   genOrders[0] * genOrders[1] == this.group.order
             && (   (genOrders[0] == 2 && genOrders[1] > 2)
                 || (genOrders[1] == 2 && genOrders[0] > 2) ) )
            {
               cosets = this._getCosets(orderedGenerators);
               [nodes, lines] =
                  this._genRotation('xy', orderedGenerators[1], cosets[1],
                                    this._genLine('x', orderedGenerators[0], cosets[0], this._genNull))(0);
            } else {
               if (genOrders[0] * genOrders[1] < this.group.order) {
                  orderedGenerators.reverse();
               }
               cosets = this._getCosets(orderedGenerators);
               [nodes, lines] =
                  this._genLine('x', orderedGenerators[1], cosets[1],
                                this._genLine('y', orderedGenerators[0], cosets[0], this._genNull))(0);
            }

         // these are flat, so set all normals to 'z' axis
         for (let i = 0; i < lines.length; i++) {
            const zAxis = new THREE.Vector3(0,0,1);
            if (lines[i].normal !== undefined) {
               lines[i].normal = zAxis;
            }
         }
      } else {
         cosets = this._getCosets(orderedGenerators);
         let fn = this._genNull,
             directions = ['z', 'y', 'x'];
         for (let i = 0; i < generators.length; i++) {
            fn = this._genLine(directions[i % 3], orderedGenerators[i], cosets[i], fn);
         }
         [nodes, lines] = fn(0);
      }

      nodes.sort((el1,el2) => el1.element - el2.element);
      return [nodes, lines];
   }

   _getCosets(gens) {
      const subGroups = [],
            cosets = [];

      // get subgroups
      for (let i = 0, curr = new BitSet(this.group.order); i < gens.length - 1; i++) {
         curr.set(gens[i]);
         for (let j = 0; j < this.group.subgroups.length; j++) {
            if (this.group.subgroups[j].members.contains(curr)) {
               curr = this.group.subgroups[j].members.clone();
               subGroups.push(curr);
               break;
            }
         }
      }
      subGroups.push(new BitSet(this.group.order).setAll());

      // get coset partitioning
      cosets.push(this.group.elementPowers[gens[0]].toArray());
      for (let i = 1; i < subGroups.length; i++) {
         const todo = subGroups[i].clone(),
               prev = subGroups[i-1],
               coset = [];
         cosets.push(coset);
         while (! todo.isEmpty()) {
            for (let j = 0; j < todo.len; j++) {
               // get first element of todo and put it in partition
               if (todo.isSet(j)) {
                  coset.push(j);
                  // for each product in element*prev clear setting in todo
                  for (let k = 0; k < prev.len; k++) {
                     if (prev.isSet(k)) {
                        todo.clear(this.group.multtable[j][k])
                     }
                  }
                  break;
               }
            }
         }
      }

      return cosets;
   }

   // just returns element at (0,0,0) so containing step can move to where it wants
   _genNull(startElement) {
      return [ [new Diagram3D.Node(startElement, new THREE.Vector3(0,0,0))], [] ];
   }

   // distributes elements along the line [-1,1]
   _genLine(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction, generator, coset, innerLoop) {
         return function(startElement) {
            Log.log('genLine');
            const directionVectors = {x: [1,0,0], y: [0,1,0], z: [0,0,1]},
                  normalVectors = {x: [0,1,0], y: [1,0,0], z: [1,0,0]},
                  directionVector = new THREE.Vector3(...directionVectors[direction]),
                  normalVector = new THREE.Vector3(...normalVectors[direction]),
                  numNodes = coset.length,
                  scale = 2/(3*numNodes - 1),
                  xScale = (new THREE.Matrix4()).makeScale(
                     ...(new THREE.Vector3(1,1,1)).add(
                        directionVector.clone().multiplyScalar(scale-1)).toArray()),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  lines = [],
                  nodes = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*i/numNodes - 3*(numNodes - 1)/(3*numNodes - 1),
                     xLate = (new THREE.Matrix4()).makeTranslation(
                        ...directionVector.clone().multiplyScalar(trans).toArray()),
                     xForm = xLate.multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop lines
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {             // for each group
               for (let j = 0; j < nodeGroupLength; j++) {  // for each element in a group
                  let currNode = nodeGroups[i][j].element,
                      nextNode = group.multtable[currNode][generator];
                  if (   numNodes > 2
                      && i == numNodes - 1
                      && nextNode == nodeGroups[0][j].element)
                     {
                        lines.push(new Diagram3D.Line([currNode, nextNode],
                                                      {userData: generator, normal: new THREE.Vector3(1,0,0)}));
                     } else {
                        lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                     }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }

   // distributes elements around a circle of radius 1 centered at [0,0]
   _genCircle(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction,  generator, coset, innerLoop) {
         return function (startElement) {
            Log.log('genCircle');
            const normalVectors = {xy: [0,0,1], yz: [1,0,0], xz: [0,1,0]},
                  normalVectorCoordinates = normalVectors[direction],
                  axis = normalVectorCoordinates[0] == 1 ? [0, 1, 0] :
                         (normalVectorCoordinates[1] == 1 ? [0, 0, 1] : [1, 0, 0]),
                  numNodes = coset.length,
                  normalVector = new THREE.Vector3(...normalVectorCoordinates),
                  plane = (new THREE.Vector3(1,1,1)).sub(normalVector),
                  scale = Math.sqrt(1 - Math.cos(2*Math.PI/numNodes))/2,
                  xScale = (new THREE.Matrix4()).scale(
                     plane.clone().multiplyScalar(scale/(scale+1)).add(normalVector.clone())),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  lines = [],
                  nodes = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*Math.PI*(1/4 - i/numNodes),
                     xLate = (new THREE.Matrix4()).makeTranslation(
                        ...(new THREE.Vector3(...axis))
                        .applyAxisAngle(normalVector, trans)
                        .multiplyScalar(1/(scale+1))
                        .toArray()),
                     xForm = xLate.multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop arcs
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {          // for each group
               for (let j = 0; j < nodeGroupLength; j++) {   // for each element in a group
                  const currNode = nodeGroups[i][j].element,
                        nextNode = group.multtable[currNode][generator];
                  if (group.elementOrders[generator] > 2) {
                     lines.push(new Diagram3D.Line([currNode, nextNode],
                                                   {userData: generator, normal: normalVector}));
                  } else {
                     lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                  }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }

   // distributes elements around a circle of radius 1 centered at [0,0]
   //   and rotates innerLoop product around center
   _genRotation(_direction, _generator, _coset, _innerLoop) {
      return function(group, direction, generator, coset, innerLoop) {
         return function (startElement) {
            Log.log('genRotation');
            const normalVectors = {xy: [0,0,1], yz: [1,0,0], xz: [0,1,0]},
                  normalVectorCoordinates = normalVectors[direction],
                  axis = normalVectorCoordinates[0] == 1 ? [0, 1, 0] :
                         (normalVectorCoordinates[1] == 1 ? [0, 0, 1] : [1, 0, 0]),
                  numNodes = coset.length,
                  normalVector = new THREE.Vector3(...normalVectorCoordinates),
                  scale = Math.sqrt(1 - Math.cos(2*Math.PI/numNodes))/2,
                  xLate = (new THREE.Matrix4()).makeTranslation(
                     ...(new THREE.Vector3(...axis)).multiplyScalar(-1/(scale+1)).toArray()),
                  xScale = (new THREE.Matrix4()).makeScale(
                     ...(new THREE.Vector3(1, 1, 1)).multiplyScalar(scale/(scale+1))
                     .sub(normalVector.clone().multiplyScalar(-1/(scale+1))).toArray()),
                  generatedElements = coset.map(el => group.multtable[startElement][el]),
                  nodeGroups = [],
                  nodes = [],
                  lines = [];

            // get inner loop nodes and lines
            for (let i = 0; i < numNodes; i++) {
               const element = generatedElements[i],
                     trans = 2*Math.PI*(-1/4 - i/numNodes),
                     xRot = (new THREE.Matrix4()).makeRotationAxis(normalVector, trans),
                     xForm = xRot.multiply(xLate).multiply(xScale);

               let childNodes, childLines;
               [childNodes, childLines] = innerLoop(element);
               for (let j = 0; j < childNodes.length; j++) {
                  childNodes[j].point = childNodes[j].point.applyMatrix4(xForm);
               }
               nodeGroups.push(childNodes);
               lines.push(...childLines);
            }

            // make outer loop arcs
            const nodeGroupLength = nodeGroups[0].length;
            for (let i = 0; i < numNodes; i++) {          // for each group
               for (let j = 0; j < nodeGroupLength; j++) {   // for each element in a group
                  const currNode = nodeGroups[i][j].element,
                        nextNode = group.multtable[currNode][generator];
                  if (group.elementOrders[generator] > 2) {
                     lines.push(new Diagram3D.Line([currNode, nextNode],
                                                   {userData: generator, normal: normalVector}));
                  } else {
                     lines.push(new Diagram3D.Line([currNode, nextNode], {userData: generator}));
                  }
               }
            }

            // flatten nodeGroups
            for (let i = 0; i < numNodes; i++) {
               nodes.push(...nodeGroups[i]);
            }

            // sort nodes
            return [nodes.sort((el1, el2) => el1.element - el2.element), lines];
         }
      } (this.group, _direction, _generator, _coset, _innerLoop);
   }
}

// initialize static variables
CayleyDiagram._init();
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
         this.scene.fog = new THREE.Fog(DisplayDiagram.DEFAULT_FOG_COLOR, 2, 100);
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
      this.renderer.setSize(width, height);

      if (options.container !== undefined) {
         options.container.append(this.renderer.domElement);
      }

      if (options.trackballControlled) {
         this.camControls = new THREE.TrackballControls(this.camera, options.container[0]);
      }
   }

   static setDefaults() {
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads', 'nodeHighlights']
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

   // Small graphics don't need high resolution features:
   //   Many-faceted spheres, labels, thick lines, arrows?
   getImageURL(diagram3D) {
      const img = new Image();
      this.showGraphic(diagram3D);
      img.src = this.renderer.domElement.toDataURL();
      return img;
   }

   // Display diagram
   showGraphic(diagram3D) {
      Log.log('showGraphic');

      diagram3D.normalize();

      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D);
      this.updateHighlights(diagram3D);
      this.updateLabels(diagram3D);
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
      this.render();
   }

   getGroup(name) {
      return this.scene.children.find( (el) => el.name == name );
   }

   // Position and point the camera to the center of the scene
   setCamera(diagram3D) {
      Log.log('setCamera');

      if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
         this.camera.position.set(3, 0, 0);
         this.camera.up.set(0, 0, 1);
      } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
         this.camera.position.set(0, 3, 0);
         this.camera.up.set(0, 0, 1);
      } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
         this.camera.position.set(0, 0, 3);
         this.camera.up.set(0, 1, 0);
      } else {
         this.camera.position.set(2, 2, 2);
         this.camera.up.set(0, 1, 0);
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
   updateNodes(diagram3D) {
      Log.log('updateNodes');

      const defaultNodeRadius = 0.3 / Math.sqrt(diagram3D.nodes.length);

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      diagram3D.nodes.forEach( (node) => {
         const nodeColor = (node.color === undefined) ? DisplayDiagram.DEFAULT_NODE_COLOR : node.color,
               nodeRadius = (node.radius === undefined) ? defaultNodeRadius : node.radius,
               scaledNodeRadius = diagram3D.nodeScale * nodeRadius,
               sphereMaterial = new THREE.MeshPhongMaterial({color: nodeColor}),
               sphereGeometry = new THREE.SphereGeometry(scaledNodeRadius, 20, 20),
               sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         spheres.add(sphere);
      } )
   }

   updateHighlights(diagram3D) {
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children);

      this.getGroup('spheres').children.forEach( (sphere) => {
         const node = diagram3D.nodes[sphere.userData.node.element];

         // Find sphere's desired color: priority is colorHighlight, color, or default
         const desiredColor = new THREE.Color(
            (node.colorHighlight !== undefined) ? node.colorHighlight :
            ((node.color !== undefined) ? node.color :
             DisplayDiagram.DEFAULT_NODE_COLOR) );
         // If sphere is not desired color set material color to desired color
         if (!sphere.material.color.equals(desiredColor)) {
            sphere.material.color = new THREE.Color(desiredColor);
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

      const spheres = this.getGroup('spheres').children;

      spheres.forEach( (sphere) => {
         const node = sphere.userData.node;
         if (node.label === undefined || node.label == '') {
            return;
         };

         // make canvas big enough for any label and offset it to clear the node while being close
         const canvas = document.createElement('canvas');
         canvas.id = `label_${node.element}`;
         const context = canvas.getContext('2d');

         const radius = sphere.geometry.parameters.radius;
         const scale = 12 * radius * diagram3D.labelSize;
         const textLabel = mathml2text(node.label);
         canvas.width = 2048;
         canvas.height = 256;
         context.fillStyle = 'rgba(0, 0, 0, 1.0)';
         context.font = '120pt Arial';
         const xoff = 600 * Math.sqrt(radius) / diagram3D.labelSize;
         context.fillText(textLabel, xoff, 0.7*canvas.height);

         const texture = new THREE.Texture(canvas)
         texture.needsUpdate = true;

         const labelMaterial = new THREE.SpriteMaterial({ map: texture });

         const label = new THREE.Sprite( labelMaterial );
         label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);

         label.center = new THREE.Vector2(0.0, 0.0);
         label.position.set(node.point.x, node.point.y, node.point.z);

         labels.add(label);
      } )
   }

   /*
    * Draw lines between nodes
    *   An arc is drawn in the plane specified by the normal vector if one is given
    */
   updateLines(diagram3D) {
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
               lineWidth = isIOS ? DisplayDiagram.IOS_LINE_WIDTH : diagram3D.lineWidth,
               lineMaterial =
                  lineWidth <= maxLineWidth ?
                  new THREE.LineBasicMaterial({color: lineColor, linewidth: lineWidth}) :
                  new MeshLineMaterial({
                     color: new THREE.Color(lineColor),
                     lineWidth: lineWidth,
                     sizeAttenuation: false,
                     side: THREE.DoubleSide,
                     resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                  });

         var geometry = new THREE.Geometry();
         if (line.normal === undefined) {
            geometry.vertices = vertices.map( (vertex) => vertex.point );
         } else {
            // Put bow in arc so that (start, middle, end) is clockwise when viewed from normal
            const normal = line.normal,
                  start = vertices[0].point,
                  end = vertices[vertices.length - 1].point,
                  offset = (line.arcOffset === undefined) ?
                           DisplayDiagram.DEFAULT_ARC_OFFSET : line.arcOffset,
                  // (start + end)/2 - (end - start) X normal
                  middle = start.clone().add(end).multiplyScalar(0.5).sub(
                     end.clone().sub(start).cross(normal).multiplyScalar(offset)),
                  curve = new THREE.QuadraticBezierCurve3(start, middle, end),
                  points = curve.getPoints(10);
            geometry.vertices = points;
         }

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

   updateArrowheads(diagram3D) {
      Log.log('updateArrowheads');

      const spheres = this.getGroup('spheres').children;
      const lines = this.getGroup('lines').children;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      lines.filter( (line) => line.userData.line.arrow )
           .forEach( (line) => {
              const lineData = line.userData.line,
                    vertices = line.userData.vertices,
                    numNodes = vertices.length,
                    numSegments = numNodes - 1,
                    startNode = vertices[0],
                    endNode = vertices[numNodes - 1],
                    nodeRadius = spheres[lineData.vertices[lineData.vertices.length - 1].element].geometry.parameters.radius,
                    center2center = endNode.clone().sub(startNode).length(),
                    dLength = center2center / numSegments;
              if (center2center <= 2*nodeRadius) {
                 return;
              }
              const headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
                    headWidth = 0.6 * headLength,
                    start2tip = nodeRadius + headLength +
                                diagram3D.arrowheadPlacement*(center2center - 2*nodeRadius - headLength),
                    tipSegment = Math.floor(start2tip/dLength),
                    tip = vertices[tipSegment].clone().add(
                       vertices[tipSegment+1].clone().sub(vertices[tipSegment]).multiplyScalar(
                          start2tip/dLength - tipSegment)),
                    start2base = start2tip - headLength,
                    baseSegment = Math.floor(start2base/dLength),
                    base = vertices[baseSegment].clone().add(
                       vertices[baseSegment+1].clone().sub(vertices[baseSegment]).multiplyScalar(
                          start2base/dLength - baseSegment)),
                    arrowDir = tip.clone().sub(base).normalize(),
                    color = line.userData.color,
                    arrowhead = new THREE.ArrowHelper(arrowDir, base, 1.1*headLength, color, headLength, headWidth);
              arrowheads.add(arrowhead);
           } )
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
      this.updateArrowheads(diagram3D);
   }

   // reduce fog level by increasing 'far' parameter (experimentally determined parameters :-)
   updateFogLevel(diagram3D) {
      const cameraDistance = this.camera.position.length();
      this.scene.fog.far = (diagram3D.fogLevel == 0) ? 100 : (cameraDistance + 6 - 7*diagram3D.fogLevel);
   }

   updateLabelSize(diagram3D) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D) {
      this.updateArrowheads(diagram3D);
   }
}

// MathML Utilities

// Enclose MathML fragment from, e.g., .group file, in <math>..</math> tags
function math(fragment) {
   return (fragment === undefined) ? ''
	: '<math xmlns="http://www.w3.org/1998/Math/MathML">' + fragment + '</math>';
}


// Routines for manipulating subset of MathML used in .group files
// Subset has only signed numeric subscripts and superscripts

// Transform MathML subset into HTML with <sub>...</sub> and <sup>...</sup> markup
function mathml2html(mathml) {
   if (xsltProcessor === undefined) {
      xsltProcessor = new XSLTProcessor();
      xsltProcessor.importStylesheet($.parseXML(MATHML_2_HTML));
   }
   return xsltProcessor.transformToFragment($($.parseXML(mathml))[0], document);
}


// Unicode characters for numeric subscripts, superscripts
var subscripts =
   {0: '\u2080', 1: '\u2081', 2: '\u2082', 3: '\u2083', 4: '\u2084',
    5: '\u2085', 6: '\u2086', 7: '\u2087', 8: '\u2088', 9: '\u2089' };
var superscripts =
   {0: '\u2070', 1: '\u00B9', 2: '\u00B2', 3: '\u00B3', 4: '\u2074',
    5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079',
    '-': '\u207B'};

// Transform MathML subset into Unicode text with numeric subscripts and superscripts
function mathml2text(mathml) {
   let $html = $( mathml2html(mathml) );

   return html2text($html);
}

function html2text($html) {
   $html.find('sub').each( (_,el) =>
      $(el).text(
         $(el).text().split('').map(ch => subscripts[ch]).join(''))
   );
   $html.find('sup').each( (_,el) =>
      $(el).text(
         $(el).text().split('').map(ch => superscripts[ch]).join(''))
   );

   return $html.text();
}

// XSLT code to transform MathML subset into HTML
var xsltProcessor;

const MATHML_2_HTML =
   `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

<xsl:template match="math">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="mfenced">
  <xsl:value-of select="@open"/><xsl:text> </xsl:text>
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
      <xsl:text> </xsl:text>
    </xsl:if>
  </xsl:for-each>
  <xsl:text> </xsl:text><xsl:value-of select="@close"/>
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

/*
 * Structure used to describe Cayley diagram, symmetry object to DrawDiagram
 */

class Diagram3D {
   constructor(nodes = [], lines = [], options) {
      this.nodes = nodes;
      this.lines = lines;
      this.background = undefined;
      this.zoomLevel = 1;
      this.lineWidth = 1;
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
      return this;
   }

   setNodeLabels(labels) {
      this.nodes.forEach( (nd) => nd.label = labels[nd.element] );
      return this;
   }

   // add a line from each element to arrow*element; set arrow in userData
   addLines(arrow) {
      Group.elements.forEach( (el) => {
         const product = Group.mult(el, arrow);
         if (el == Group.mult(product, arrow)) {  // no arrows if bi-directional
            if (el < product) {  // don't add 2nd line if bi-directional
               this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]], {userData: arrow, arrow: false}))
            }
         } else {
            this.lines.push(new Diagram3D.Line([this.nodes[el], this.nodes[product]], {userData: arrow, arrow: true}))
         }
      } )
   }
            
   // remove all lines with userData = arrow
   removeLines(arrow) {
      this.lines = this.lines.filter( (line) => line.userData != arrow );
   }

   setLineColors() {
      const generators = Array.from(new Set(this.lines.map( (line) => line.userData )));
      this.lines.forEach( (line) => line.color = ColorPool.colors[generators.findIndex( (el) => el == line.userData )] );
      return this;
   }

   // Normalize scene: translate to centroid, radius = 1
   normalize() {
      const centroid = this.nodes
                           .reduce( (cent, nd) => cent.add(nd.point), new THREE.Vector3(0,0,0) )
                           .multiplyScalar(1/this.nodes.length);
      const squaredRadius = this.nodes
                                .reduce( (sqrad,nd) => Math.max(sqrad, nd.point.distanceToSquared(centroid)), 0 );
      const radius = (squaredRadius == 0) ? 1 : 1/Math.sqrt(squaredRadius);  // in case there's only one element
      const xForm = (new THREE.Matrix4()).set(radius, 0,      0,      -centroid.x,
                                              0,      radius, 0,      -centroid.y,
                                              0,      0,      radius, -centroid.z,
                                              0,      0,      0,      1);
      this.nodes.forEach( (node) => node.point.applyMatrix4(xForm) );
      this.lines.forEach( (line) => line.vertices
                                        .forEach( (vertex) => {
                                           if (vertex.element === undefined) {
                                              vertex.point.applyMatrix4(xForm)
                                           }
                                        } ) );
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
   }

   clearHighlights() {
      this._setNodeField('colorHighlight', group.elements, undefined);
      this._setNodeField('ringHighlight', group.elements, undefined);
      this._setNodeField('squareHighlight', group.elements, undefined);
   }
}

Diagram3D.Point = class Point {
   constructor(point) {
      this.point = (Array.isArray(point)) ? new THREE.Vector3(...point) : point;
   }
}

Diagram3D.Node = class Node extends Diagram3D.Point {
   constructor(element, point, options) {
      super(point);
      this.element = element;
      this.color = 0xDDDDDD;
      this.label = '';
      this.radius = undefined;
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
      this.arrow = true;
      this.userData = undefined;
      this.normal = undefined;
      this.arcOffset = undefined;
      if (options !== undefined) {
         for (const opt in options) {
            this[opt] = options[opt];
         }
      }
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
         return new Diagram3D.Line(vertices, {color: path.color, arrow: false});
      } );

      return new Diagram3D(nodes, lines, {background: SymmetryObject.BACKGROUND_COLOR});
   }
}

// initialize static variables
SymmetryObject._init();

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
      this.elements = this.group.elements.slice();
      this.separation = 0;
      this.colors = Multtable.COLORATION_RAINBOW;
      this._stride = this.group.order;
      this.clearHighlights();
   }

   organizeBySubgroup(subgroup) {
      this.elements = [];
      const cosets = this.group.getCosets(subgroup.members);
      cosets.forEach( (coset) => this.elements.push(...coset.toArray()) );
      this._stride = subgroup.order;
      return this;
   }

   get colors() {
      return (this._backgrounds === undefined) ? this._colors : this._backgrounds;
   }

   get borders() {
      return this._borders;
   }

   get corners() {
      return this._corners;
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
      this._colors = this.group.elements.map( (_, inx) => fn(inx) );
   }

   /*
    * Highlight routines
    *   if only one color is needed (a common case) make each highlight color different
    *   if n colors are needed just start with hsl(0,100%,80%) and move 360/n for each new color
    */
   highlightByBackground(elements) {
      this._backgrounds = new Array(this.group.order).fill(DisplayMulttable.BACKGROUND);
      elements.forEach( (els, colorIndex) => {
         const colorFraction = Math.round(360 * colorIndex / elements.length);
         const color = `hsl(${colorFraction}, 100%, 80%)`;
         els.forEach( (el) => this._backgrounds[el] = color );
      } );
   }

   highlightByBorder(elements) {
      this._borders = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this._borders[el] = 'hsl(120, 100%, 80%)' );
      } else {
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this._borders[el] = color );
         } );
      }
   }

   highlightByCorner(elements) {
      this._corners = new Array(this.group.order).fill(undefined);
      if (elements.length == 1) {
         elements[0].forEach( (el) => this._corners[el] = 'hsl(240, 100%, 80%)' );
      } else {
         this._corners = new Array(this.group.order).fill(undefined);
         elements.forEach( (els, colorIndex) => {
            const colorFraction = Math.round(360 * colorIndex / elements.length);
            const color = `hsl(${colorFraction}, 100%, 80%)`;
            els.forEach( (el) => this._corners[el] = color );
         } );
      }
   }

   clearHighlights() {
      this._backgrounds = undefined;
      this._borders = undefined;
      this._corners = undefined;
   }

   get stride() {
      return this._stride;
   }
}

Multtable._init();
 class ColorPool {
   static init() {
      /*
       * Distinct colors that show up well on CayleyDiagram.BACKGROUND_COLOR
       * from https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors
       */
      ColorPool.colors = [
         '#911eb4',  /* purple */
         '#469990',  /* teal */
         '#808000',  /* olive */
         '#e6194b',  /* red */
         '#ffffff',  /* white */
         '#f58231',  /* orange */
         '#000000',  /* black */
         '#f032e6',  /* magenta */
         '#4363d8',  /* blue */
         '#3cb44b',  /* green */
         '#800000',  /* maroon */
      ];
   }

   static pushCSS(color) {
      ColorPool.colors.push(color);
   }

   static popCSS() {
      return ColorPool.colors.pop();
   }

   static popHex() {
      return new THREE.Color(ColorPool.popCSS()).getHex();
   }
}

ColorPool.init();


class DisplayMulttable {
   // height & width, or container
   constructor(options) {
      Log.log('DisplayMulttable');

      DisplayMulttable._setDefaults();

      if (options === undefined) {
         options = {};
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

      this.canvas = $(`<canvas width="${width}" height="${height}">`)[0];
      this.context = this.canvas.getContext('2d');

      if (options.container !== undefined) {
         options.container.append(this.canvas);
      }
   }

   static _setDefaults() {
      DisplayMulttable.DEFAULT_CANVAS_HEIGHT = 100;
      DisplayMulttable.DEFAULT_CANVAS_WIDTH = 100;
      DisplayMulttable.BACKGROUND = '#F0F0F0';
      DisplayMulttable.DEFAULT_FONT = '14pt Arial';
      DisplayMulttable.DEFAULT_FONT_HEIGHT = 19;
   }

   getImageURL(multtable) {
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
            this.context.fillStyle = colors[multtable.group.mult(i,j)];
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
   // Separation slider maps [0,1] => [0,boxSize]
   showLargeGraphic(multtable) {
      this.context = this.canvas.getContext('2d');
      this.context.font = DisplayMulttable.DEFAULT_FONT;
      const fontHeight = DisplayMulttable.DEFAULT_FONT_HEIGHT;

      const labels = multtable.group.elements.map( (el) => mathml2text(multtable.group.representation[el]) );
      const longestLabel = labels.reduce( (longest, label) => (label.length > longest.length) ? label : longest, '' );
      const longestLabelWidth =  this._measuredWidth(longestLabel);
      const rowEstimate = this._isPermutation(longestLabel) ? Math.ceil(Math.sqrt(longestLabelWidth/fontHeight)/2) : 1;
      const boxSize = Math.floor(Math.max(3*fontHeight*rowEstimate, 1.25*longestLabelWidth/rowEstimate));

      const order = multtable.group.order;
      const stride = multtable.stride;

      const separation = multtable.separation*boxSize;
      const canvasSize = order*boxSize + (order/stride - 1)*separation;
      this.canvas.height = canvasSize;
      this.canvas.width = canvasSize;

      // note that background shows through in separations between cosets
      this.context.fillStyle = DisplayMulttable.BACKGROUND;
      this.context.fillRect(0, 0, canvasSize, canvasSize);

      this.context.font = DisplayMulttable.DEFAULT_FONT;
      this.context.textAlign = 'left';       // fillText x coordinate is left-most end of string
      this.context.textBaseline = 'middle';  // fillText y coordinate is center of upper-case letter

      for (let inx = 0; inx < group.order; inx++) {
         for (let jnx = 0; jnx < group.order; jnx++) {
            // be sure to skip the separation between cosets as needed
            const x = boxSize*inx + separation*Math.floor(inx/stride);
            const y = boxSize*jnx + separation*Math.floor(jnx/stride);

            const product = multtable.group.mult(multtable.elements[inx], multtable.elements[jnx]);

            // color box according to product
            this.context.fillStyle = multtable.colors[product];
            this.context.fillRect(x, y, boxSize, boxSize);

            // draw borders if cell has border highlighting
            if (multtable.borders !== undefined && multtable.borders[product] !== undefined) {
               this._drawBorder(x, y, boxSize, boxSize, multtable.borders[product]);
            }

            // draw corner if cell has corner highlighting
            if (multtable.corners !== undefined && multtable.corners[product] !== undefined) {
               this._drawCorner(x, y, boxSize, boxSize, multtable.corners[product]);
            }

            this._drawLabel(x, y, boxSize, boxSize, labels[product], fontHeight);
         }
      }
   }

   _drawBorder(x, y, width, height, color) {
      this.context.beginPath();
      this.context.strokeStyle = color;
      this.context.lineWidth = 2;
      this.context.moveTo(x, y+height-1);
      this.context.lineTo(x, y);
      this.context.lineTo(x+width-1, y);
      this.context.stroke();

      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 1;
      this.context.moveTo(x+2.5, y+height-2.5);
      this.context.lineTo(x+2.5, y+2.5);
      this.context.lineTo(x+width-2.5, y+2.5);
      this.context.lineTo(x+width-2.5, y+height-2.5);
      this.context.closePath();
      this.context.stroke();
   }

   _drawCorner(x, y, width, height, color) {
      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.strokeStyle = 'black';
      this.context.moveTo(x, y);
      this.context.lineTo(x+0.2*width, y);
      this.context.lineTo(x, y+0.2*height);
      this.context.fill();
   }

   _drawLabel(x, y, width, height, label, fontHeight) {
      this.context.fillStyle = 'black';
      const rows = [];
      if (this._isPermutation(label)) {
         // this looks like a permutation --
         //    they can be long, so split it into multiple lines if needed
         const cycles = label.match(/[(][^)]*[)]/g);
         let last = 0;
         for (const cycle of cycles) {
            if (this._measuredWidth(rows[last]) + this._measuredWidth(cycle) < 0.75*width) {
               rows[last] = (rows[last] === undefined) ? cycle : rows[last].concat(cycle);
            } else {
               if (rows[last] !== undefined) {
                  last++;
               }
               if (this._measuredWidth(cycle) < 0.75*width) {
                  rows[last] = cycle;
               } else {
                  // cut cycle up into row-sized pieces
                  const widthPerCharacter = this._measuredWidth(cycle) / cycle.length;
                  const charactersPerRow = Math.ceil(0.75*width / widthPerCharacter);
                  for (let c = cycle;;) {
                     if (this._measuredWidth(c) < 0.75*width) {
                        rows[last++] = c;
                        break;
                     } else {
                        rows[last++] = c.slice(0, c.lastIndexOf(' ', charactersPerRow));
                        c = c.slice(c.lastIndexOf(' ', charactersPerRow)).trim();
                     }
                  }
               }
            }
         }
      } else {
         rows[0] = label;
      }

      const maxRowWidth = rows.reduce( (max, row) => (max > this._measuredWidth(row)) ? max : this._measuredWidth(row), 0 );
      let xStart = x + width/2 - maxRowWidth/2;
      let yStart = y + height/2 - fontHeight*(rows.length - 1)/2;
      for (const row of rows) {
         this.context.fillText(row, xStart, yStart);
         yStart += fontHeight;
      }
   }

   _measuredWidth(str) {
      return (str === undefined) ? 0 : this.context.measureText(str).width;
   }

   _isPermutation(str) {
      return str[0] == '(';
   }
}
