// @flow

import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import setUpGAPCells from './js/ShowGAPCode.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

export {loadGroup as load};

let group /*: XMLGroup */;

// Load group from invocation URL
function loadGroup() {
   Library
      .loadFromURL()
      .then( (_group) => {
         group = _group;
         formatGroup();
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

   setUpGAPCells(group);
}
