$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(window.group = group) )
          .catch( console.error );
}

function formatGroup(group) {
   const $rslt = $(document.createDocumentFragment())
      .append(eval(Template.HTML('header')));

   factors = MathUtils.getFactors(group.order);
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
   if (factors.length == 1) {
      $rslt.append(eval(Template.HTML('non-Z_mn-group-prime')));
   } else if (n == 1) {
      const facs = factors.slice(0,-1).join(', ') + ' and ' + factors.slice(-1);
      $rslt.append(eval(Template.HTML('non-Z_mn-group')));
   } else {
      $rslt.append(eval(Template.HTML('Z_mn-group')));
   }

   $('body').append($rslt);

   $( '.show-illustration' ).on( 'click', function ( event ) {
      event.preventDefault();
      const m = parseInt( event.target.getAttribute( 'data-m' ) );
      const n = parseInt( event.target.getAttribute( 'data-n' ) );
      showZnmIsomorphismSheet( m, n );
   } );
   $( '.show-no-illustration' ).on( 'click', function ( event ) {
      event.preventDefault();
      const m = parseInt( event.target.getAttribute( 'data-m' ) );
      const n = parseInt( event.target.getAttribute( 'data-n' ) );
      showNoZnmIsomorphismSheet( m, n );
   } );
}

function statement ( m, n, bool ) {
   return MathML.sans( MathML.sub( '&Zopf;', m * n ) )
        + ` is ${bool ? '' : 'not '}isomorphic to `
        + MathML.sans( `<msub><mi>&Zopf;</mi><mn>${m}</mn></msub>`
                     + '<mo>&times;</mo>'
                     + `<msub><mi>&Zopf;</mi><mn>${n}</mn></msub>` );
}

function allOffers ( product ) {
   var result = [ ];
   for ( var m = 2 ; m <= Math.sqrt( product ) ; m++ ) {
      if ( product % m == 0 ) {
         const n = product / m;
         result.push( `<a href="" class="show-no-illustration" data-m="${m}" data-n="${n}">`
                    + `Click here</a> to see why ${statement( m, n, false )}.` );
      }
   }
   return '<p>' + result.join( '</p><p>' ) + '</p>';
}

function showZnmIsomorphismSheet ( m, n ) {
   const Z = ( k ) => `<msub><mi>&#8484;</mi><mn>${k}</mn></msub>`;
   const prod = ( A, B ) => `<mrow>${A}<mo>&#215;</mo>${B}</mrow>`;
   const a = group.elementOrders.indexOf( m );
   const b = group.elementOrders.indexOf( n );
   const ab = group.mult( a, b );
   const hmar = 20, vmar = 20, hsep = 20, vsep = 20,
         W = 300, H = W, hdrH = 50, txtH = 100;
   CreateNewSheet( [
      {
         className : 'TextElement',
         text : 'Illustration of the isomorphism between '
              + mathml2text( prod(Z(m),Z(n)) )
              + ' and ' + mathml2text( Z(m*n) ),
         x : hmar, y : vmar,
         w : 3*W + 2*hsep, h : hdrH,
         fontSize : '20pt', alignment : 'center'
      },
      {
         // rectangular CD of Z_m x Z_n with arrows for a,b shown
         className : 'CDElement', groupURL : group.URL,
         x : hmar, y : vmar+hdrH+vsep, w : W, h : H,
         arrows : [ a, b ],
         arrowColors : [ '#660000', '#006600' ],
         strategies : [ [ a, 0, 0, 0 ], [ b, 0, 1, 1 ] ]
      },
      {
         // same as previous, plus arrow for ab
         className : 'CDElement', groupURL : group.URL,
         x : hmar+hsep+W, y : vmar+hdrH+vsep, w : W, h : H,
         arrows : [ a, b, ab ],
         arrowColors : [ '#660000', '#006600', '#000066' ],
         strategies : [ [ a, 0, 0, 0 ], [ b, 0, 1, 1 ] ]
      },
      {
         // circular CD of Z_mn with arrow for ab shown only
         className : 'CDElement', groupURL : group.URL,
         x : hmar+2*hsep+2*W, y : vmar+hdrH+vsep, w : W, h : H,
         arrows : [ ab ],
         arrowColors : [ '#000066' ],
         strategies : [ [ ab, 1, 2, 0 ] ]
      },
      {
         className : 'TextElement',
         text : `A Cayley diagram of ${mathml2text( prod(Z(m),Z(n)) )}, `
              + `with generators of order ${m} and ${n} shown in `
              + `red and green, respectively.`,
         x : hmar, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      },
      {
         className : 'TextElement',
         text : `The same Cayley diagram as on the left, but now `
              + `with the product of the red and green generators `
              + `also shown, colored blue.`,
         x : hmar+hsep+W, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      },
      {
         className : 'TextElement',
         text : `The same Cayley diagram as in the middle, but now `
              + `with the red and green generators removed.  `
              + `The blue generator traverses all ${m*n} nodes, `
              + `so we can arrange it in a cycle.`,
         x : hmar+2*hsep+2*W, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      }
   ] );
}

function showNoZnmIsomorphismSheet ( m, n ) {
   // define constants similar to those in showZnmIsomorphismSheet()
   const Z = ( k ) => `<msub><mi>&#8484;</mi><mn>${k}</mn></msub>`;
   const prod = ( A, B ) => `<mrow>${A}<mo>&#215;</mo>${B}</mrow>`;
   const hmar = 20, vmar = 20, hsep = 20, vsep = 20,
         W = 300, H = W, hdrH = 50, txtH = 100;
   // build the group Z_m x Z_n and find it in the group library.
   const elements = Array( m * n ).fill( null ).map( ( _, i ) => i );
   const multtable = elements.map( row => {
      const a1 = Math.floor( row / n );
      const b1 = row % n;
      return elements.map( col => {
         const a2 = Math.floor( col / n );
         const b2 = col % n;
         return ( a1 + a2 ) % m * n + ( b1 + b2 ) % n;
      } );
   } );
   const tmpgp = new BasicGroup( multtable );
   const ZmxZn = IsomorphicGroups.find( tmpgp );
   // find elements in that group of the needed orders
   const f = IsomorphicGroups.isomorphism( tmpgp, ZmxZn );
   const a = f[n]; // of order m
   const b = f[1]; // of order n
   // and an element of maximal order, but not among <a>U<b>
   const aorbit = ZmxZn.elementPowers[a];
   const borbit = ZmxZn.elementPowers[b];
   const available = ZmxZn.elements.filter( e =>
      !ZmxZn.elementPowers[a].get( e ) && !ZmxZn.elementPowers[b].get( e ) );
   const orders = available.map( e => ZmxZn.elementOrders[e] );
   const maxOrd = orders.reduce( ( a, b ) => Math.max( a, b ) );
   const maxOrdElt = available.filter( e => ZmxZn.elementOrders[e] == maxOrd )[0];
   // create a sheet based on that group and those elements
   CreateNewSheet( [
      {
         className : 'TextElement',
         text : 'Why there is no isomorphism between '
              + mathml2text( prod(Z(m),Z(n)) )
              + ' and ' + mathml2text( Z(m*n) ),
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
         strategies : [ [ a, 0, 0, 0 ], [ b, 0, 1, 1 ] ]
      },
      {
         // same as previous, plus arrow for maxOrdElt
         className : 'CDElement', groupURL : ZmxZn.URL,
         x : hmar+hsep+W, y : vmar+hdrH+vsep, w : W, h : H,
         arrows : [ a, b, maxOrdElt ],
         arrowColors : [ '#660000', '#006600', '#000066' ],
         strategies : [ [ a, 0, 0, 0 ], [ b, 0, 1, 1 ] ]
      },
      {
         // circular CD of Z_mn with arrow for maxOrdElt shown only
         className : 'CDElement', groupURL : ZmxZn.URL,
         x : hmar+2*hsep+2*W, y : vmar+hdrH+vsep, w : W, h : H,
         arrows : [ maxOrdElt ],
         arrowColors : [ '#000066' ],
         strategies : [ [ maxOrdElt, 2, 0, 0 ], [ b, 0, 1, 1 ] ]
      },
      {
         className : 'TextElement',
         text : `A Cayley diagram of ${mathml2text( prod(Z(m),Z(n)) )}, `
              + `with generators of order ${m} and ${n} shown in `
              + `red and green, respectively.`,
         x : hmar, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      },
      {
         className : 'TextElement',
         text : `The same Cayley diagram as on the left, but now `
              + `with the largest-order element of that group `
              + `also shown, colored blue.`,
         x : hmar+hsep+W, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      },
      {
         className : 'TextElement',
         text : `The same Cayley diagram as in the middle, but now `
              + `with the red and green generators removed.  `
              + `The blue generator creates ${m*n/maxOrd} cycles, `
              + `not one.`,
         x : hmar+2*hsep+2*W, y : vmar+hdrH+H+2*vsep, w : W, h : H,
         alignment : 'center'
      }
   ] );
}
