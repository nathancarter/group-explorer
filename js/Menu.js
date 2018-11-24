
class Menu {
   static setMenuLocations(event, $menu) {
      // set top edge so menu grows down until it sits on the bottom, up until it reaches the top
      if ($menu.outerHeight() > $(window).innerHeight()) {
         $menu.css({top: 0, height: $(window).innerHeight()});    // too tall for window
      } else if (event.clientY + $menu.outerHeight() > $(window).innerHeight()) {
         $menu.css({top: $(window).innerHeight() - $menu.outerHeight()});    // won't fit below click
      } else {
         $menu.css({top: event.clientY});  // fits below click
      }

      // set left edge location so menu doesn't disappear to the right
      if (event.clientX + $menu.outerWidth() > $(window).innerWidth()) {
         $menu.css({left: $(window).innerWidth() - $menu.outerWidth()});
      } else {
         $menu.css({left: event.clientX});
      }

      // similarly for submenus (but they also have to avoid covering the main menu)
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, subMenu) => Menu.setSubMenuLocation($menu, $(subMenu)) );
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
              .each( (_, subMenu) => Menu.setSubMenuLocation($subMenu, $(subMenu)) );
   }
}
