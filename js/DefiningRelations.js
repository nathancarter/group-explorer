// @flow
/*
 * Find relations among a set of generators for a group
 *   (adapted from Butler, ch 5)
 *
 * Used in Sheet to check that a set mapping is a homomorphism
 */

import BitSet from './BitSet.js';
import BasicGroup from './BasicGroup.js';

let G /*: BasicGroup */;
let words /*: Array<Array<groupElement>> */;
let colored /*: Array<BitSet> */;		// colored[generator element] = BitSet for colored edges in Cayley diagram
let relators /*: Array<Array<groupElement>> */;

// Returns an array of relationships as an Array<Array<integer>>, in which, for example,
//   [[1,1], [2,2,2], [1,2,1,2]] means
//     1) el[1]*el[1] = e
//     2) el[2]*el[2]*el[2] = e
//     3) el[1]*el[2]*el[1]*el[2] = e
export function findRelations (group /*: BasicGroup */, generators /*: Array<groupElement> */ = group.generators[0]) /*: Array<Array<groupElement>> */ {
    G = group;

    words = [[]];
    generators.forEach( (gen) => words[gen] = [gen] );

    colored = [];
    generators.forEach( (gen) => colored[gen] = new BitSet(G.order) );

    relators = [];

    makeSpanningTree();

    const uncolored = colored.reduce( (edges, marks, generator) => {
        edges.push(...marks.clone().complement().toArray().map( (src) => [src, generator] ));
        return edges;
    }, []).sort( ([src1, gen1], [src2, gen2]) => {
        return (words[src2].length + words[G.mult(src2, gen2)].length) - (words[src1].length + words[G.mult(src1, gen1)].length);
    } );

    while (uncolored.length > 0) {
        const [source, generator] = uncolored.pop();
        if (colored[generator].isSet(source))
            continue;
        colored[generator].set(source);

        // make relator
        const dest = G.mult(source, generator);
        const relator = [...words[source], generator, ...([...words[dest]].reverse().map( (el) => -el ))];
        relators.push(relator);

        // apply relator to each node
        for (const element of G.elements) {
            // apply relator
            const [_, uncolored_edges] = relator.reduce( ([node, uncolored_edges], gen) => {
                if (gen < 0) {
                    const next = G.mult(node, G.inverses[-gen]);
                    if (!colored[-gen].isSet(next))
                        uncolored_edges.push([next, -gen]);
                    node = next;
                } else {
                    if (!colored[gen].isSet(node))
                        uncolored_edges.push([node, gen]);
                    node = G.mult(node, gen);
                }
                return [node, uncolored_edges];
            }, [element, []]);
            if (uncolored_edges.length == 1)
                colored[uncolored_edges[0][1]].set(uncolored_edges[0][0]);
        }
    }

    relators.forEach( (relator, inx) => relators[inx] = relator.map( (el) => (el < 0) ? G.inverses[-el] : el ) );
 
    return relators;
}

function makeSpanningTree () {
    const spanning_tree = [0];
    const in_tree = new BitSet(G.order, spanning_tree);
    for (let inx = 0; inx < spanning_tree.length; inx++) {
        const element = spanning_tree[inx];
        colored.forEach( (_, generator) => {
            const next = G.mult(element, generator);
            if (!in_tree.isSet(next)) {
                in_tree.set(next);
                spanning_tree.push(next);
                words[next] = (element == 0) ? [generator] : [...words[element], generator]
                colored[generator].set(element);
            }
        } )
    }
}
