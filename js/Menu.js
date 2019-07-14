// @flow
/*::
  export default
*/
class Menu {
   static setMenuLocations(event /*: {clientX: number, clientY: number} */, $menu /*: JQuery */) {
      const menuBox = $menu[0].getBoundingClientRect();
      const menuHeight = menuBox.height;
      const windowHeight = 0.99*window.innerHeight;
      // set top edge so menu grows down until it sits on the bottom, up until it reaches the top
      if (menuHeight > windowHeight) {
         $menu.css({top: 0, height: windowHeight, 'overflow-y': 'auto'});    // too tall for window
      } else if (event.clientY + menuHeight > windowHeight) {
         $menu.css({top: windowHeight - menuHeight});    // won't fit below click
      } else {
         $menu.css({top: event.clientY});  // fits below click
      }

      // set left edge location so menu doesn't disappear to the right
      const menuWidth = menuBox.width;
      const windowWidth /*: float */ = window.innerWidth;
      if (event.clientX + menuWidth > windowWidth) {
         $menu.css({left: windowWidth - menuWidth});
      } else {
         $menu.css({left: event.clientX});
      }

      // similarly for submenus (but they also have to avoid covering the main menu)
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, subMenu) => Menu.setSubMenuLocation($menu, $(subMenu)) );
   }

   static setSubMenuLocation($menu /*: JQuery */, $subMenu /*: JQuery */) {
      const parentBox = $subMenu.parent()[0].getBoundingClientRect();
      const menuBox = $menu[0].getBoundingClientRect();
      const subMenuBox = $subMenu[0].getBoundingClientRect();
      const windowHeight = 0.99*window.innerHeight;
      const bottomRoom = windowHeight - (parentBox.top + subMenuBox.height);
      if (parentBox.top + subMenuBox.height < windowHeight) {  // subMenu can drop down from parent
         $subMenu.css({top: parentBox.top});
      } else if (subMenuBox.height < windowHeight) {  // subMenu fits in window, but not below parent
         $subMenu.css({top: windowHeight - subMenuBox.height});
      } else {  // subMenu doesn't fit in window
         $subMenu.css({top: 0, height: windowHeight, 'overflow-y': 'auto'})
      }

      const windowWidth /*: float */ = window.innerWidth;
      const rightRoom = windowWidth - (menuBox.right + subMenuBox.width);
      const leftRoom = menuBox.left - subMenuBox.width;
      const overlap = (subMenuBox.width - $subMenu.width())/2;
      if (rightRoom > 0) {
         $subMenu.css({left: menuBox.right - overlap});
      } else if (leftRoom > 0) {
         $subMenu.css({left: menuBox.left - subMenuBox.width + overlap});
      } else if (rightRoom > leftRoom) {
         $subMenu.css({left: windowWidth - subMenuBox.width});
      } else {
         $subMenu.css({left: 0});
      }

      $subMenu.children('li:has(span.menu-arrow)')
              .children('ul')
              .each( (_, subMenu) => Menu.setSubMenuLocation($subMenu, $(subMenu)) );
   }
}
