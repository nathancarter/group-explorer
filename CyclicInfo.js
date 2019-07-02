$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(group) )
          .catch( console.error );
}

function formatGroup(group) {
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
