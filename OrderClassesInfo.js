$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(group) )
          .catch( console.error );
}

function formatGroup(group) {
   const numOrderClasses = group.orderClasses.reduce( count => count + 1, 0);
   let $rslt = $(document.createDocumentFragment())
      .append(eval(Template.HTML('header')));
   if (numOrderClasses == 1) {
      $rslt.append(eval(Template.HTML('single')));
   } else {
      $rslt.append(eval(Template.HTML('multiple')));
      group.orderClasses.forEach( (members, order) =>
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
