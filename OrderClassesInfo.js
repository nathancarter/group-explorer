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
   const numOrderClasses = group.orderClasses.reduce( (num, bitset) => bitset.popcount() != 0 ? num+1 : num, 0);
   if (numOrderClasses == 1) {
      $rslt.append(eval(Template.HTML('single')));
   } else {
      $rslt.append(eval(Template.HTML('multiple')));
      group.orderClasses.forEach( (members, order) => {
         if (members.popcount() != 0) {
            $rslt.find('#order_class_list')
               .append($('<li>').html(
                    `Elements of order ${order}:&nbsp;` +
                     MathML.csList(members.toArray().map( (el) => group.representation[el] ))
               ))
         }
      } )
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'conjugacy_list']);

   setUpGAPCells(group);
}
