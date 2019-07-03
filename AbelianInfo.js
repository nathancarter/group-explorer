// @flow

/*::
import Library from './js/Library.js';
import Log from './js/Log.js';
import setUpGAPCells from './js/ShowGAPCode.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';
 */

var group /*: XMLGroup */;

$(window).on('load', load);	// like onload handler in body


function load() {
   Library.loadFromURL()
          .then( (_group) => {
              group = _group;
              formatGroup();
          } )
          .catch( console.error );
}

function formatGroup() {
   const $rslt = $(document.createDocumentFragment())
         .append(eval(Template.HTML('header')));
   const nonAbelianExample = group.nonAbelianExample;
   if (nonAbelianExample == undefined) {
      $rslt.append(eval(Template.HTML('abelian')));
   } else {
      const [i,j] = nonAbelianExample;
      $rslt.append(eval(Template.HTML('non-abelian')));
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);

   setUpGAPCells();
}
