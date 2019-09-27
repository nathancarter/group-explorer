// @flow

/*::
import Template from './Template.js';

type MenuTree = {id: string, children?: Array<MenuTree>};

export default
*/
class Menu {
   static addMenus($menus /*: JQuery */, location /*: eventLocation */) {
      // remove all other menus
      const $parent = $menus.first().parent();
      $menus.detach();
      $('.menu').remove();  // be careful -- this may not always be appropriate
      $parent.append($menus);

      // only consider non-empty menus
      const $non_empty_menus = $menus.filter('ul.menu').filter( (_,ul) => ul.childElementCount != 0 );

      // set click handler for each menu
      $non_empty_menus.each( (_inx, ul) => ul.addEventListener('click', Menu.actionClickHandler) );

      const menu_tree = Menu._getMenuTree($non_empty_menus);
      Menu.setMenuTreeLocation(menu_tree, location);

      $(`#${menu_tree.id}`).css('visibility', 'visible');
   }

   static _getMenuTree($menus /*: JQuery */) /*: MenuTree */ {
      // find top menu:
      //    within each menu find each link and remove it from the set of potential targets
      //    the last man standing is the one with no links to it, the top menu
      const targets = new Set/*:: <string> */($menus.map( (_inx, ul) => ul.id ).toArray() );
      $menus.each( (_inx, menu) => {
         $(menu).find('li[link]').each( (_inx, li) => {
            const link = li.getAttribute('link');
            if (link != undefined) {
               targets.delete(link);
            }
         } )
      } );

      const top_menu_id = Array.from(targets)[0];

      // recursive routine to get menu tree for this menu
      const getMenuTreeFromID = (menu_id /*: string */) /* MenuTree */ => {
         const children = [];
         $menus.filter(`[id="${menu_id}"]`)
            .find('li[link]')
            .each( (_inx, li) => {
               const link = li.getAttribute('link');
               if (link != undefined) {
                  children.push(getMenuTreeFromID(link));
               }
            } );
         return {id: menu_id, children: children};
      }

      // find menu tree for top menu
      const result = getMenuTreeFromID(top_menu_id);
      return result;
   }

   static setMenuTreeLocation(menu_tree /*: MenuTree */, location /*: eventLocation */) {
      const MARGIN = 4;

      // set upper left corner of menu to base
      const $menu = $(`#${menu_tree.id}`);
      const menu_box = $menu[0].getBoundingClientRect();
      const body_box = $('#bodyDouble')[0].getBoundingClientRect();

      let {clientX, clientY} = location;

      // if it doesn't fit on the right push it to the left enough to fit
      if (clientX + menu_box.width > body_box.right - MARGIN)
         clientX = body_box.right - MARGIN - menu_box.width;
      
      // if it doesn't fit on the bottom push it up until it bumps into the top of the frame
      if (clientY + menu_box.height > body_box.bottom - MARGIN)
         clientY = body_box.bottom - MARGIN - menu_box.height
      if (clientY < body_box.top + MARGIN) {
         clientY = body_box.top + MARGIN;
         $menu.css('height', body_box.bottom - body_box.top - 2*MARGIN)  // fix margin, padding here?
              .css('overflow-y', 'scroll');
      }

      $menu.css('left', clientX)
           .css('top', clientY);
         
      // fit child menus
      //   put child on right if it fits, left if it doesn't
      //   recursively descend tree to fit each child menu
      if (menu_tree.children != undefined) {
         menu_tree.children.forEach( (child) => {
            const $link = $menu.find(`> [link=${child.id}]`);
            const link_box = $link[0].getBoundingClientRect();
            const child_box = $(`#${child.id}`)[0].getBoundingClientRect();
            const childX = (clientX + menu_box.width + child_box.width > body_box.right - MARGIN)
                  ? clientX - child_box.width
                  : clientX + menu_box.width;
            const childY = link_box.top;
            Menu.setMenuTreeLocation(child, {clientX: childX, clientY: childY})
         } )
      }
   }
   
   static actionClickHandler(event /*: MouseEvent */) {
      event.preventDefault();
      const $action = $(event.target).closest('[action]');
      if ($action.length != 0) {
         event.stopPropagation();
         eval($action.attr('action'));
         // if we've just executed a menu action that's not just exposing a sub-menu then we're done: remove the menu
         if ($action.parent().hasClass('menu') && $action.attr('link') == undefined) {
            $action.parent().parent().find('.menu').remove();
         }
      }
   }

   /* FIXME hovering
    *   if sub-menu is hidden, hide any other visible sub-menus and expose this sub-menu [and disable hover exposure of sub-menus]
    *   if sub-menu is already visible, hide it [and enable hover sub-menu exposure]
    */
   static pinMenu(event /*: MouseEvent */) {
      // find sub-menus exposed by this menu and hide them
      const hideSubMenus = ($list /*: JQuery */) => {
         $list.each( (_, el) => {
            const link = el.getAttribute('link');
            if (link != undefined) {
               const $target = $(`#${link}`);
               if ($target.css('visibility') == 'visible') {
                  $target.css('visibility', 'hidden');
                  hideSubMenus($target.children());
               }
            }
         } );
      };

      const $action = $(event.target).closest('[action]');
      const $element = $(`#${$action.attr('link')}`);
      const element_was_hidden = $element.css('visibility') == 'hidden';
      hideSubMenus($action.parent().children());
      if (element_was_hidden) {
         $element.css('visibility', 'visible');
      } else {
         $element.css('visibility', 'hidden');
      }
   }

   // Makes menu-submenu link from template in visualizerFramework/visualizer.html
   static makeLink(label /*: string */, link /*: string */) /*: html */ {
      return eval(Template.HTML('link-template'));
   }

   static setMenuLocations(event /*: eventLocation */, $menu /*: JQuery */) {
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
