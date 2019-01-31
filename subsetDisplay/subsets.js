var SubgroupNames = [],
    ElementNames = [];

class SSD {
   static _init() {
      SSD.subsetsURL = './subsetDisplay/subsets.html';
   }

   static clearMenus() {
      $('#subset_page .highlighted').removeClass('highlighted');
      $('#subset_page .menu:visible').remove();
      $('#subset_page .elements').remove();
   }

   /* Load, initialize subset display */
   static load($subsetWrapper) {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: SSD.subsetsURL,
                   success: (data) => {
                      $subsetWrapper.html(data);
                      SSD.setup_subset_page();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${SSD.subsetsURL}: ${err}`);
                   }
         } )
      } )
   }

   static setup_subset_page() {
      // Initialize list of all displayed subsets
      SSD.nextId = 0;
      SSD.nextSubsetIndex = 0;
      SSD.displayList = [];

      // clear displayed menus, highlighting
      SSD.clearMenus();

      // Register event handlers
      $(window).off('click', SSD.clearMenus).on('click', SSD.clearMenus)
               .off('contextmenu', SSD.clearMenus).on('contextmenu', SSD.clearMenus);
      $('#subset_page').off('contextmenu', SSD.contextMenuHandler).on('contextmenu', SSD.contextMenuHandler)
                       .off('dblclick', SSD.dblClickHandler).on('dblclick', SSD.dblClickHandler);

      // clear out displayed lists; show '(None)' placeholders
      $('ul.subset_page_content li').remove();
      $('p.placeholder').show();

      // Display all subgroups
      SSD.Subgroup.displayAll();
      MathJax.Hub.Queue(['Typeset', MathJax.Hub],
                        // save references to MathJax formatted H_{inx} in global variable
                        () => {
                           $('#subgroups')
                              .children()
                              .each( (inx, li) => {
                                 const childElements = $(li).children('span[tabindex]');
                                 SubgroupNames.push(childElements[0].outerHTML);
                                 Group.subgroups[inx].generators.toArray().forEach( (gen, jnx) => {
                                    ElementNames[gen] = childElements[jnx+2].outerHTML;
                                 } );
                              } );
                        });
   }

   /*
    * Double-click displays elements in subset
    */
   static dblClickHandler(event) {
      event.preventDefault();
      SSD.clearMenus();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[id];
         const subsetName = subset.name;
         const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
         const $menu = $(eval(Template.HTML('subsetElements_template')));
         $curr.addClass('highlighted').append($menu);
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, $menu[0]],
                           () => {
                              const [leftmost, rightmost] =
                                 $menu.find('span.mjx-chtml').toArray().reduce( ([l,r],span) => {
                                    const rect = span.getBoundingClientRect();
                                    return [l < rect.left ? l : rect.left, r > rect.right ? r : rect.right];
                                 }, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER] );
                              $menu.css({'width': rightmost - leftmost, 'max-width': ''});
                              Menu.setMenuLocations(event, $menu);
                              $menu.css('visibility', 'visible');
                           });
      }
   }

   /*
    * Left-click executes "action" attribute in menu item
    */
   static menuClickHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         eval($curr.attr('action'));
         SSD.clearMenus();
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'subset_page']);
      }
   }

   /*
    * Right-click displays context menu according to
    *   -- target class (subset_page_header or placeholder)
    *   -- li element id (<subset>.menu)
    */
   static contextMenuHandler(event) {
      const start = performance.now();
      event.preventDefault();
      const $curr = $(event.target).closest('p.subset_page_header, p.placeholder, li[id]');

      // unrecognized event
      if ($curr.length == 0) return;

      SSD.clearMenus();
      
      const isHeaderMenu = $curr[0].tagName == "P";
      const $menu = isHeaderMenu ?
                    $(eval(Template.HTML('headerMenu_template'))) :
                    SSD.displayList[$curr[0].id].menu;
      $menu.on('click', SSD.menuClickHandler);
      $curr.addClass('highlighted').append($menu);
      $menu.css('visibility', 'hidden');
      event.stopPropagation();

      MathJax.Hub.Queue(
         ['Typeset', MathJax.Hub, $menu[0]],
         () => {
            if (!isHeaderMenu) {
               SSD._makeLongLists($curr[0].id, $menu);
            }
            Menu.setMenuLocations(event, $menu);
            $menu.css('visibility', 'visible');
            console.log(`${performance.now() - start}`);
         });
   }

   static _makeLongLists(id, $menu) {
      const classes = ['.intersection', '.union', '.elementwise-product'];
      const operations = ['intersection', 'union', 'elementwiseProduct'];
      const printOps = ['intersection', 'union', 'elementwise product'];
      const node = SubgroupNames[id];
      for (let inx = 0; inx < classes.length; inx++) {
         const operation = operations[inx];
         const printOp = printOps[inx];
         let frag = '';
         for (let otherId = 0; otherId < SubgroupNames.length; otherId++) {
            if (id != otherId) {
               frag += 
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `the ${printOp} of ${node} with ${SubgroupNames[otherId]}</li>`;
            }
         }
         for (let otherId = SubgroupNames.length; otherId < SSD.displayList.length; otherId++) {
            if (id != otherId && SSD.displayList[otherId] !== undefined) {
               const otherName = $(`#${otherId}`).children()[1].outerHTML;
               frag += 
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `the ${printOp} of ${node} with ${otherName}</li>`;
            }
         }
         $menu.find(classes[inx]).html(frag);
      }
   }
}

SSD._init();
