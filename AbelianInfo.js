// @flow

/*::
import Log from './js/Log.js';
import XMLGroup from './js/XMLGroup.js';
import Library from './js/Library.js';
import Template from './js/Template.js';
 */

$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
      .then( (group) => formatGroup(group) )
      .catch( console.error );
}

function formatGroup(group) {
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

   window.group = group;
   setUpGAPCells();
}
