// @flow
/*::
import Template from './js/Template.js';
import Library from './js/Library.js';
import XMLGroup from './js/XMLGroup.js';

var group : XMLGroup;
var MathJax : any;
 */
$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(group) )
          .catch( console.error );
}

function formatGroup(group /*: XMLGroup */) {
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

   window.group = group;
   setUpGAPCells();
}
