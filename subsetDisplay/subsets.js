
class SSD {
   static clearMenus() {
      $('.highlighted').removeClass('highlighted');
      $('.menu:visible').remove();
   }

   static setup_subset_page() {
      SSD.Subgroup.init();
      SSD.Subset.init();
      SSD.Partition.init();

      SSD.redisplay_subset_page();
   }

   // this will pick up a change in group.representation
   static redisplay_subset_page() {
      // clear out displayed lists; show '(None)' placeholders
      $('ul.subset_page_content li').remove();
      $('p.placeholder').show();

      // clear displayed menus, highlighting
      $(window).off('click', SSD.clearMenus)
               .on('click', SSD.clearMenus)
               .off('contextmenu', SSD.clearMenus)
               .on('contextmenu', SSD.clearMenus);
      SSD.clearMenus();

      // Display from data
      SSD.Subgroup.displayAll();
      SSD.Subset.displayAll();
      SSD.Partition.displayAll();

      $('#subset_page').off('click', SSD.clickHandler).on('click', SSD.clickHandler);

      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
   }

   static clickHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         if ($curr.hasClass('hasMenu')) {
            SSD.clearMenus();
            const $menu = eval($curr.attr('action'));
            $curr.addClass('highlighted').append($menu);
            SSD.setMenuLocations(event, $menu);
            event.stopPropagation();
         } else {
            eval($curr.attr('action'));
         }
      }
      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
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
