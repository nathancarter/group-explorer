/* @flow
# Menu Handling Utilities

Menus represent a group of actions a user can choose from. They are used in nearly every page and panel in GE3, from statically defined dropdowns to dynamically generated cascades. This class brings together the routines used in GE3 to create and manage them:
* [addMenus()](#addmenusmenus-location) -- create and place multi-level cascaded menus
* [setMenuLocation()](#setmenulocationmenu-location) -- place menu so it doesn't extend beyond the edge of the window
* [actionClickHandler()](#actionclickhandlerevent) -- click handler to execute user choice
* [pinSubMenu()](#pinsubmenuevent) -- toggle submenu visibility in cascaded menu
* [makeLink()](#makelinklabel-link) -- create menu-submenu link

Note that these are class methods and not instance methods or globals, so they must be invoked as `Menu.addMenus(...)`.
## Structure
Cascaded menus are stored as a collection of lists of user-selectable actions. 

User actions are specified in the '`action`' attribute of appropriate elements as javascript code, which will be executed
by the click handler upon selection.

Menu-submenu linkages are specified in the `link` attribute of an element, which contains the `id` attribute of the submenu.
For these elements the action is always `Menu.pinSubMenu(event)`, which exposes the linked submenu.
Linkages are generated from the [`link-template`](../docs/visualizerFramework_html.md#menu-submenu-link-template)
by [Menu.makeLink()](#makelinklabel-link).

Here is a small but realistic example taken from the
[Cayley diagram for S<sub>3</sub>](../CayleyDiagram.html?groupURL=groups/S_3.group),
seen by right-clicking on the <b>Subgroups</b> header in the Subsets panel:
```html
<ul id="header-menu" class="menu remove-on-clean">
    <li action="SSD.SubsetEditor.open()">Create S<sub>0</sub></li>
    <hr>
    <li action="Menu.pinSubMenu(event)" link="compute-menu">Compute <span class="menu-arrow"></span> </li>
    <li action="SSD.clearHighlights()">Clear all highlighting</li>
</ul>
<ul id="compute-menu" class="menu remove-on-clean">
    <li action="new SSD.ConjugacyClasses()">all conjugacy classes <i>CC</i><sub>i</sub></li>
    <li action="new SSD.OrderClasses()">all order classes <i>OC</i><sub>i</sub></li>
</ul>
```
(Note that:
* the 'remove-on-clean' class that both menus have indicates to [GEUtils.cleanWindow()](./GEUtils.js#geutilscleanwindow) this it is to remove this menu (as opposed to hiding it, or doing nothing with it)
* the &lt;span class="menu-arrow"&gt;&lt;/span&gt; element, defined in [menu.css](../style/menus.css), displays a gray right-pointing arrow at the right end of the label)

This approach of separate lists, instead of lists and sublists, was largely dictated by limitations of the Safari browser.

## Styling
Many of the features that make menus unique, such as the way they float above the surrounding text or the way they may
not be positioned according to their location in the document, are determined by stylesheets.
The styles found in [menus.css](../style/menu.css) are used throughout GE3, overridden as needed
in the individual modules.
```js
*/
import GEUtils from './GEUtils.js';
import Template from './Template.js';

/*::
type MenuTree = {id: string, children?: Array<MenuTree>};
*/

export default
class Menu {
/*::
   static MARGIN: number;  // number of pixels to leave between the menu and the edge of the window
 */
   static init() {
      Menu.MARGIN = 4;
   }
/*
```
### addMenus($menus, location)
This method places the elements of a set of cascaded menus within the browser window, and it associates the default
click event handler [`Menu.actionClickHandler()`](#actionclickhandlerevent) with them to execute the user's
selected action. The top menu is placed as near the desired `location` as possible, consistent with the following
constraints: the menus are placed by [`Menu.setMenuLocation()`](#setmenulocationmenu-location) so that they are within
the browser window; and by `Menu._setMenuTreeLocation()` so that when a submenu is exposed it does not cover its parent.
```js
*/
   static addMenus ($menus /*: JQuery */,
                    location /*: eventLocation */,
                    clickHandler /*: MouseEventListener */ = Menu.actionClickHandler)
   {
      // remove all other menus
      const $parent = $menus.first().parent();
      $menus.detach();
      $('.menu').remove();  // is this always the right thing to do?
      $parent.append($menus);

      // only consider non-empty menus
      const $non_empty_menus = $menus.filter('.menu').filter( (_,list) => list.childElementCount != 0 );

      // set click handler for each menu
      $non_empty_menus.each( (_inx, ul) => ul.addEventListener('click', clickHandler) );

      const menu_tree = Menu._getMenuTree($non_empty_menus);
      Menu._setMenuTreeLocation(menu_tree, location);

      $(`#${menu_tree.id}`).css('visibility', 'visible');
   }

   // discover cascaded menu tree by examining menu id's and links
   static _getMenuTree ($menus /*: JQuery */) /*: MenuTree */ {
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

      // recursive routine to get menu tree beneath this menu
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

   static _setMenuTreeLocation (menu_tree /*: MenuTree */, location /*: eventLocation */) {
      const $menu = $(`#${menu_tree.id}`);
      const {clientX, clientY} = Menu.setMenuLocation($menu, location);

      // fit child menus
      //   put child on right if fits within window, left if it doesn't
      //   recursively descend tree to fit each child menu
      const menu_box = $menu[0].getBoundingClientRect();
      const body_box = $('body')[0].getBoundingClientRect();
      if (menu_tree.children != undefined) {
         menu_tree.children.forEach( (child) => {
            const $link = $menu.find(`> [link=${child.id}]`);
            const link_box = $link[0].getBoundingClientRect();
            const child_box = $(`#${child.id}`)[0].getBoundingClientRect();
            const childX = (clientX + menu_box.width + child_box.width > body_box.right - Menu.MARGIN)
                  ? clientX - child_box.width
                  : clientX + menu_box.width;
            const childY = link_box.top;
            Menu._setMenuTreeLocation(child, {clientX: childX, clientY: childY})
         } )
      }
   }
/*
```
### setMenuLocation($menu, location)
This routine places the passed `$menu` as near to the desired `location` as it can, consistent with
the constraint that the `$menu` should not extend beyond the edge of the window; it returns the location
at which it placed the `$menu`.

While this routine is used by default in placing cascaded menus, it is also used for placing tooltips.
As such it is called from a variety of routines, including all of the main visualizers.
```js
*/
   static setMenuLocation ($menu /*: JQuery */, location /*: eventLocation */) /*: eventLocation */ {
      // set upper left corner of menu to base
      const menu_box = $menu[0].getBoundingClientRect();
      const body_box = $('body')[0].getBoundingClientRect();

      let {clientX, clientY} = location;

      // if it doesn't fit on the right push it to the left enough to fit
      if (clientX + menu_box.width > body_box.right - Menu.MARGIN)
         clientX = body_box.right - Menu.MARGIN - menu_box.width;

      // if it doesn't fit on the bottom push it up until it bumps into the top of the frame
      if (clientY + menu_box.height > body_box.bottom - Menu.MARGIN)
         clientY = body_box.bottom - Menu.MARGIN - menu_box.height
      if (clientY < body_box.top + Menu.MARGIN) {
         clientY = body_box.top + Menu.MARGIN;
         $menu.css('height', body_box.bottom - body_box.top - 2*Menu.MARGIN)
              .css('overflow-y', 'scroll');
      }

      $menu.css('left', clientX)
           .css('top', clientY);

      return {clientX: clientX, clientY: clientY};
   }
/*
```
### actionClickHandler(event)
This is the default click handler for cascaded menus.  It executes the user choice specified in the 'action'
attribute of the menu item. '`event`' is the click event passed by the browser's event dispatcher.

Starting at the target element specified in `event`, the handler works its way towards the root of the
document tree until it encounters an element with an `action` attribute, which it then executes by way of `eval`.

In addition to being the default click handler for cascaded menus installed by
[Menu.addMenus()](#addmenusmenus-location), it is used as the click handler for many
menus in the [subsetDisplay](../subsetDisplay) and [diagramController](../diagramController) modules.
```js
*/
   static actionClickHandler (event /*: MouseEvent */) {
      event.preventDefault();
      const $action = $(event.target).closest('[action]');
      if ($action.length != 0) {
         event.stopPropagation();
         eval($action.attr('action'));
         // if we've just executed a menu action that's not just exposing a sub-menu
         //   then we're done: clean up the window
         if ($action.parent().hasClass('menu') && $action.attr('link') == undefined) {
            GEUtils.cleanWindow();  // is this always the right thing to do?
         }
      }
   }
/*
```
### pinSubMenu(event)
Toggle submenu visibility in cascaded menu; the action of a menu-submenu link created by [makeLink()](#makelinklabel-link).
* If the linked submenu is hidden, expose it and hide any other visible submenus (recursively) of the parent menu
* If the linked submenu is visible, hide it (recursively).

(*The following additional hovering behavior is not yet implemented:*
* *If the linked submenu is hidden, disable hover exposure of other submenus*
* *If the linked submenu is visible, enable hover submenu exposure*)

This routine is only referenced in the
[visualizerFramework template](../docs/visualizerFramework_html.md#menu-submenu-link-template)
used by [Menu.makeLink()](#makelinklabel-link).
```js
*/
   static pinSubMenu (event /*: MouseEvent */) {
      // find submenus exposed by this menu and hide them
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
/*
```
### makeLink(label, link)
Create a menu-submenu link in cascaded menus from `link-template` in
[visualizerFramework/visualizer.html](../docs/visualizerFramework_html.md#menu-submenu-link-template).
  * label -- text to be displayed in menu element
  * link -- submenu id

Cascaded menus are principally used in the [subsetDisplay](../subsetDisplay) and [diagramController](../diagramController) modules.
```js
*/
   static makeLink (label /*: string */, link /*: string */) /*: html */ {
      return eval(Template.HTML('link-template'));
   }
}

Menu.init();
/*
```
*/
