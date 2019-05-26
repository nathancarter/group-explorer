// @flow
/*::
import Library from './js/Library.js';
import MathML from './js/MathML.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

var group : XMLGroup;
 */
$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(group) )
          .catch( console.error );
}

function formatGroup(group /*: XMLGroup */) {
   const nonEmptyOrderClasses = group.orderClasses.filter( (bitset) => bitset.popcount() != 0 );
   const numOrderClasses = nonEmptyOrderClasses.length;
   let $rslt = $(document.createDocumentFragment())
      .append(eval(Template.HTML('header')));
   if (numOrderClasses == 1) {
      $rslt.append(eval(Template.HTML('single')));
   } else {
      $rslt.append(eval(Template.HTML('multiple')));
      nonEmptyOrderClasses.forEach( (members, order) =>
         $rslt.find('#order_class_list')
              .append($('<li>').html(
                 MathML.sans('<mtext>Elements of order ' + order + ' :&nbsp;</mtext>') +
                 MathML.csList(members.toArray().map( (el) => group.representation[el] ))
              )))
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'conjugacy_list']);

   window.group = group;
   setUpGAPCells();
}
