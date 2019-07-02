$(window).on('load', load);	// like onload handler in body

function load() {
   Library.loadFromURL()
          .then( (group) => formatGroup(group) )
          .catch( console.error );
}

function formatGroup(group) {
   const $rslt = $(document.createDocumentFragment())
      .append(eval(Template.HTML('header')));
   if (group.isAbelian) {
      $rslt.append(eval(Template.HTML('abelian')));
   } else {
      const [i,j] = group.nonAbelianExample;
      $rslt.append(eval(Template.HTML('non-abelian')));
   }

   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);

   window.group = group;
   setUpGAPCells();
}
