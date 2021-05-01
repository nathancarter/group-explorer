// @flow

import BasicGroup from './BasicGroup.js';
import GEUtils from './GEUtils.js'
import IsomorphicGroups from './IsomorphicGroups.js';
import Log from './Log.js';
import MathUtils from './MathUtils.js';
import * as SheetModel from './SheetModel.js';
import Template from './Template.js';

export {summary, display, showZmnIsomorphismSheet, showNoZmnIsomorphismSheet};

/*::
import XMLGroup from './XMLGroup.js';

import type {StrategyParameters, Layout, Direction} from './CayleyDiagramView.js';
*/

// Load templates
const ZMN_INFO_URL = './html/ZmnInfo.html'
const LoadPromise = GEUtils.ajaxLoad(ZMN_INFO_URL)

let Group;

function summary (Group /*: XMLGroup */) /*: string */ {
    return (new Set(MathUtils.getFactors(Group.order)).size == 2 ? 'yes' : 'no');
}

async function display (group /*: XMLGroup */, $wrapper /*: JQuery */) {
  const templates = await LoadPromise

  if ($('template[id|="zmn"]').length == 0) {
    $('body').append(templates);
  }

  Group = group;
  $wrapper.html(formatZmnInfo());
}

function formatZmnInfo () /*: DocumentFragment */ {
    const $frag = $(document.createDocumentFragment());

    const factors = MathUtils.getFactors(Group.order);
    const [m, n, _] =
          factors.reduce( ([fac1, fac2, prev], el) => {
              if (el >= prev) {
                  fac1 *= el;
                  prev = el;
              } else {
                  fac2 *= el;
              }
              return [fac1, fac2, prev];
          }, [1, 1, 0] );
    const isZmn = (factors.length != 1) && (n != 1);
    if (factors.length == 1) {
        $frag.append(eval(Template.HTML('zmn-prime-template')));
    } else if (n == 1) {
        const facs = factors.slice(0,-1).join(', ') + ' and ' + factors.slice(-1).toString();
        $frag.append(eval(Template.HTML('zmn-nonZmnGroup-template')));
        for (let m = 2; m <= Math.sqrt(Group.order); m++) {
            if (Group.order % m == 0) {
                const n = Group.order / m;
                $frag.append(eval(Template.HTML('zmn-illustration-template')));
            }
        }
    } else {
        $frag.append(eval(Template.HTML('zmn-template')));
        $frag.append(eval(Template.HTML('zmn-illustration-template')));
    }

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}

function showZmnIsomorphismSheet ( m /*: groupElement */, n /*: groupElement */ ) {
    const Z = ( k ) => `ℤ<sub>${k}</sub>`
    const prod = ( A, B ) => `${A} × ${B}`
    const a = Group.elementOrders.indexOf( m );
    const b = Group.elementOrders.indexOf( n );
    const ab = Group.mult( a, b );
    const hmar = 20, vmar = 20, hsep = 20, vsep = 20,
          W = 300, H = W, hdrH = 50, txtH = 100;
    CreateNewSheet( [
        {
            className : 'TextElement',
            text : `Illustration of the isomorphism between ${prod(Z(m), Z(n))} and ${Z(m*n)}`,
            x : hmar, y : vmar,
            w : 3*W + 2*hsep, h : hdrH,
            fontSize : '20pt', alignment : 'center'
        },
        {
            // rectangular CD of Z_m x Z_n with arrows for a,b shown
            className : 'CDElement', groupURL : Group.URL,
            x : hmar, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ a, b ],
            arrowColors : [ '#660000', '#006600' ],
            strategies : [ {generator: a, layout: 'linear', direction: 'X', nestingLevel: 0},
                           {generator: b, layout: 'linear', direction: 'Y', nestingLevel: 1} ]
        },
        {
            // same as previous, plus arrow for ab
            className : 'CDElement', groupURL : Group.URL,
            x : hmar+hsep+W, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ a, b, ab ],
            arrowColors : [ '#660000', '#006600', '#000066' ],
            strategies : [ {generator: a, layout: 'linear', direction: 'X', nestingLevel: 0},
                           {generator: b, layout: 'linear', direction: 'Y', nestingLevel: 1} ]
        },
        {
            // circular CD of Z_mn with arrow for ab shown only
            className : 'CDElement', groupURL : Group.URL,
            x : hmar+2*hsep+2*W, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ ab ],
            arrowColors : [ '#000066' ],
            strategies : [ {generator: ab, layout: 'circular', direction: 'XY', nestingLevel: 0} ]
        },
        {
            className : 'TextElement',
            text : `A Cayley diagram of ${prod(Z(m), Z(n))} with generators of order ${m} and ${n} shown in red and green, respectively.`,
            x : hmar, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        },
        {
            className : 'TextElement',
            text : `The same Cayley diagram as on the left, but now with the product of the red and green generators also shown, colored blue.`,
            x : hmar+hsep+W, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        },
        {
            className : 'TextElement',
            text : `The same Cayley diagram as in the middle, but now with the red and green generators removed. The blue generator traverses all ${m*n} nodes, so we can arrange it in a cycle.`,
            x : hmar+2*hsep+2*W, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        }
    ] );
}

function showNoZmnIsomorphismSheet ( m /*: groupElement */, n /*: groupElement */ ) {
    // define constants similar to those in showZmnIsomorphismSheet()
    const Z = ( k ) => `ℤ<sub>${k}</sub>`
    const prod = ( A, B ) => `${A} × ${B}`
    const hmar = 20, vmar = 20, hsep = 20, vsep = 20,
          W = 300, H = W, hdrH = 50, txtH = 100;
    // build the group Z_m x Z_n and find it in the group library.
    const elements = Array.from( {length: m * n}, ( _ /*: mixed */, i /*: number */ ) => i );
    const multtable = elements.map( (row /*: number */) => {
        const a1 = Math.floor( row / n );
        const b1 = row % n;
        return elements.map( (col /*: number */) => {
            const a2 = Math.floor( col / n );
            const b2 = col % n;
            return ( a1 + a2 ) % m * n + ( b1 + b2 ) % n;
        } );
    } );
    const tmpgp = new BasicGroup( multtable );
    const ZmxZn = ((IsomorphicGroups.find( tmpgp ) /*: any */) /*: XMLGroup */);
    // find elements in that group of the needed orders
    const f = ((IsomorphicGroups.isomorphism( tmpgp, ZmxZn ) /*: any */) /*: Array<groupElement> */);
    const a = f[n]; // of order m
    const b = f[1]; // of order n
    // and an element of maximal order, but not among <a>U<b>
    const aorbit = ZmxZn.elementPowers[a];
    const borbit = ZmxZn.elementPowers[b];
    const available = ZmxZn.elements.filter( e =>
                                             !ZmxZn.elementPowers[a].get( e ) && !ZmxZn.elementPowers[b].get( e ) );
    const orders /*: Array<groupElement> */ = available.map( e => ZmxZn.elementOrders[e] );
    const maxOrd = orders.reduce( ( a, b ) => Math.max( a, b ) );
    const maxOrdElt = available.filter( e => ZmxZn.elementOrders[e] == maxOrd )[0];
    // create a sheet based on that group and those elements
    CreateNewSheet( [
        {
            className : 'TextElement',
          text : `Why there is no isomorphism between ${prod(Z(m), Z(n))} and ${Z(m*n)}`,
            x : hmar, y : vmar,
            w : 3*W + 2*hsep, h : hdrH,
            fontSize : '20pt', alignment : 'center'
        },
        {
            // rectangular CD of Z_m x Z_n with arrows for a,b shown
            className : 'CDElement', groupURL : ZmxZn.URL,
            x : hmar, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ a, b ],
            arrowColors : [ '#660000', '#006600' ],
            strategies : [ {generator: a, layout: 'linear', direction: 'X', nestingLevel: 0},
                           {generator: b, layout: 'linear', direction: 'Y', nestingLevel: 1} ]
        },
        {
            // same as previous, plus arrow for maxOrdElt
            className : 'CDElement', groupURL : ZmxZn.URL,
            x : hmar+hsep+W, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ a, b, maxOrdElt ],
            arrowColors : [ '#660000', '#006600', '#000066' ],
            strategies : [ {generator: a, layout: 'linear', direction: 'X', nestingLevel: 0},
                           {generator: b, layout: 'linear', direction: 'Y', nestingLevel: 1} ]
        },
        {
            // circular CD of Z_mn with arrow for maxOrdElt shown only
            className : 'CDElement', groupURL : ZmxZn.URL,
            x : hmar+2*hsep+2*W, y : vmar+hdrH+vsep, w : W, h : H,
            arrows : [ maxOrdElt ],
            arrowColors : [ '#000066' ],
            strategies : [ {generator: maxOrdElt, layout: 'rotated', direction: 'XY', nestingLevel: 0 },
                           {generator: b, layout: 'linear', direction: 'Y', nestingLevel: 1} ]
        },
        {
            className : 'TextElement',
            text : `A Cayley diagram of ${prod(Z(m), Z(n))} with generators of order ${m} and ${n} shown in red and green, respectively.`,
            x : hmar, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        },
        {
            className : 'TextElement',
            text : `The same Cayley diagram as on the left, but now with the largest-order element of that group also shown, colored blue.`,
            x : hmar+hsep+W, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        },
        {
            className : 'TextElement',
            text : `The same Cayley diagram as in the middle, but now with the red and green generators removed. The blue generator creates ${m*n/maxOrd} cycles, not one.`,
            x : hmar+2*hsep+2*W, y : vmar+hdrH+H+2*vsep, w : W,
            alignment : 'center'
        }
    ] );
}

function CreateNewSheet (oldJSONArray /*: Array<Obj> */) {
    const newJSONArray = SheetModel.convertFromOldJSON(oldJSONArray)
    SheetModel.createNewSheet(newJSONArray)
}
