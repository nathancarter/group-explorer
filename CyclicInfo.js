// @flow

/*::
import Template from './js/Template.md';
import Library from './js/Library.js';
import Log from './js/Log.md';
import setUpGAPCells from './js/ShowGAPCode.js';
import XMLGroup from './js/XMLGroup.js';
 */

var group /*: XMLGroup */;

$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
      .then( (_group) => {
         group = _group;
         formatGroup()
      } )
      .catch( Log.err );
}

function formatGroup() {
   let $rslt = $(document.createDocumentFragment())
       .append(eval(Template.HTML('header')));
   if (group.isCyclic) {
      const generator = group.generators[0][0];
      $rslt.append(eval(Template.HTML('cyclic')));
   } else {
      $rslt.append(eval(Template.HTML('non-cyclic')));
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);

   setUpGAPCells();
}
