// @flow

import BasicGroup from './BasicGroup.js';
import BitSet from './BitSet.js';
import GEUtils from './GEUtils.js';
import * as Library from './Library.js';
import Subgroup from './Subgroup.js';
import XMLGroup from './XMLGroup.js';

export default
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
