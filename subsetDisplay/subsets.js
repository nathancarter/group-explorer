
class SSD {
   static clearMenus() {
      $('.highlighted').removeClass('highlighted');
      $('.menu:visible').remove();
      $('.elements').remove();
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
      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
   }

   // Double-click displays elements in subset
   static dblClickHandler(event) {
      event.preventDefault();
      SSD.clearMenus();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[id];
         const subsetName = subset.name;
         const subsetElements = subset
            .elements.toArray()
            .reduce( (elements, element) => {
               elements.push(math(group.representation[element]));
               return elements;
            }, [] )
            .join(', ');
         const $menu = $(eval(Template.HTML('#subsetElements_template')));
         $curr.addClass('highlighted').append($menu);
         SSD.setMenuLocations(event, $menu);
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
      }
   }

   // Left-click executes "action" attribute in menu item
   static menuClickHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         eval($curr.attr('action'));
         SSD.clearMenus();
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
      }
   }

   // Right-click executes action, which displays context menu
   static contextMenuHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         SSD.clearMenus();
         const $menu = eval($curr.attr('action')).on('click', SSD.menuClickHandler);
         $curr.addClass('highlighted').append($menu);
         SSD.setMenuLocations(event, $menu);
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
      }
   }

   static setMenuLocations(event, $menu) {
      // set left edge location so menu doesn't disappear to the right
      const left = event.clientX + $menu.outerWidth() > $(window).innerWidth() ?
                   $(window).innerWidth() - $menu.outerWidth() :
                   event.clientX;
      $menu.css({left: left});

      // set top edge to menu doesn't disappear off the bottom
      const top = event.clientY + $menu.outerHeight() > $(window).innerHeight() ?
                  $(window).innerHeight() - $menu.outerHeight() :
                  event.clientY;
      $menu.css({top: top});

      // do the same for subMenus
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, subMenu) => SSD.setSubMenuLocation($menu, $(subMenu)) );
   }

   static setSubMenuLocation($menu, $subMenu) {
      const bottomRoom = $(window).innerHeight() - ($subMenu.offset().top + $subMenu.outerHeight());
      if (bottomRoom < 0) {
         if ($subMenu.outerHeight() < $(window).innerHeight()) {
            $subMenu.css({top: bottomRoom});
         } else {
            $subMenu.css({top: -$subMenu.offset().top, height: $(window).innerHeight()})
         }
      }

      const rightRoom = $(window).innerWidth() -
                        ($menu.offset().left + $menu.outerWidth() + $subMenu.outerWidth());
      const leftRoom = $menu.offset().left - $subMenu.outerWidth();
      const widthMargin = ($subMenu.outerWidth() - $subMenu.width())/2;
      if (rightRoom > 0) {
         $subMenu.css({left: '100%'});
      } else if (leftRoom > 0) {
         $subMenu.css({right: '100%'});
      } else if (rightRoom > leftRoom) {
         $subMenu.css({left: $menu.outerWidth() + rightRoom - widthMargin});
      } else {
         $subMenu.css({right: $menu.outerWidth() + leftRoom - widthMargin});
      }

      $subMenu.children('li:has(span.menu-arrow)')
              .children('ul')
              .each( (_, subMenu) => SSD.setSubMenuLocation($subMenu, $(subMenu)) );
   }

   static setCascadeDirections($menu) {
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, child_menu) => {
              const $child_menu = $(child_menu);
              let direction = 'left';
              if ($menu.offset().left + $menu.width() + $(child_menu).width() > $(window).width()) {
                 direction = 'right';
              }
              $(child_menu).css(direction, '100%');
              setCascadeDirections( $(child_menu) );
           });
   }

   static getHeaderMenu($curr) {
      return $(eval(Template.HTML('#headerMenu_template')));
   }
}
