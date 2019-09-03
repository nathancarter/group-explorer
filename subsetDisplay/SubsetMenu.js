// @flow
/*::
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.SubsetMenu = class {
/*::
   static lastEntry: {menuElement: ?HTMLElement, timeStamp: number};
 */
   static init() {
      SSD.SubsetMenu.lastEntry = {menuElement: undefined, timeStamp: 0};
      const subsetPage = $('#subset_page')[0];
      if (window.hasOwnProperty('ontouchstart')) {   // touch device?
         // register touchstart, touchmove, touchend events on subset page
         subsetPage.addEventListener('touchstart', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchmove', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchend', SSD.SubsetMenu.touchHandler);
      } else {
         // register contextmenu, dblclick
         subsetPage.addEventListener('contextmenu', SSD.SubsetMenu.mouseHandler);
         subsetPage.addEventListener('dblclick', SSD.SubsetMenu.mouseHandler);
     }
   }

   /*
    * Mouse right-click or touchscreen tap displays menu according to
    *   -- target class (subset_page_header or placeholder)
    *   -- li element id (<subset>.menu)
    *
    * Mouse double-click or touchscreen tap-hold displays elements in subset
    *   Following mouse click or touchscreen tap anywhere clears element display
    */
   static mouseHandler(mouseEvent /*: MouseEvent */) {
      switch (mouseEvent.type) {
      case 'dblclick':
         SSD.SubsetMenu.displayElements(mouseEvent, mouseEvent);
         break;

      case 'contextmenu':
         SSD_Menu.postMenu(mouseEvent, mouseEvent);
         break;
      }
   }

   static touchHandler(touchEvent /*: TouchEvent */) {
      // just skip modified events, multi-touches
      if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
          || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
         return;
      }

      switch (touchEvent.type) {

         // reset lastEntry
      case 'touchstart': {
         const touch /*: Touch */ = (touchEvent.changedTouches[0] /*: any */);
         const $target = $(document.elementFromPoint(touch.clientX, touch.clientY));
         const $menuHead = $target.closest('p.subset_page_header, p.placeholder, li[id]');
         SSD.SubsetMenu.lastEntry = {menuElement: $menuHead[0], timeStamp: touchEvent.timeStamp};
         touchEvent.stopPropagation(); }
         break;

         // update lastEntry, if needed
      case 'touchmove': {
         const touch /*: Touch */ = (touchEvent.changedTouches[0] /*: any */);
         const $target = $(document.elementFromPoint(touch.clientX, touch.clientY));
         const $menuHead = $target.closest('p.subset_page_header, p.placeholder, li[id]');
         if ($menuHead[0] != SSD.SubsetMenu.lastEntry.menuElement) {
            SSD.SubsetMenu.lastEntry = {menuElement: $menuHead[0], timeStamp: touchEvent.timeStamp};
         } }
         break;

         //   if there are menus, just use this tap to clear them
         //   otherwise, if interval is short, post menu; else popup elements display
      case 'touchend':
         if ($('#subset_page .menu:visible, #subset_page .elements').length != 0) {
            $('#bodyDouble').click();
         } else {
            const touch /*: Touch */ = (touchEvent.changedTouches[0] /*: any */);
            const $target = $(document.elementFromPoint(touch.clientX, touch.clientY));
            const $menuHead = $target.closest('p.subset_page_header, p.placeholder, li[id]');
            if ($menuHead[0] != SSD.SubsetMenu.lastEntry.menuElement) {  // did this event enter a new menuHead?
               SSD.SubsetMenu.lastEntry = {menuElement: $menuHead[0], timeStamp: touchEvent.timeStamp};
            }
            if (touchEvent.timeStamp - SSD.SubsetMenu.lastEntry.timeStamp < 500) {  // short touch?
               const menuObject = SSD_Menu.postMenu(touchEvent, touch);
            } else {
               SSD.SubsetMenu.displayElements(touchEvent, touch);
            }
         }
         break;
      }
   }

   static displayElements(event /*: Event */, location /*: {clientX: number, clientY: number} */) {
      event.preventDefault();
      $('#bodyDouble').click();
      const $curr = $(document.elementFromPoint(location.clientX, location.clientY)).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[parseInt(id)];
         const subsetName = subset.name;
         const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
         const $menu = $(eval(Template.HTML('subsetElements_template')));
         $curr.addClass('highlighted').append($menu);
         event.stopPropagation();

         const bounds /*: Array<ClientRect> */ =
               $menu.find('span.mjx-chtml').map( (_, span) => span.getBoundingClientRect() ).toArray();
         const extrema /*: {leftmost: number, rightmost: number} */ =
               bounds.reduce( (lr /*: {leftmost: number, rightmost: number} */, rect /*: ClientRect */) => {
                  return {leftmost: Math.min(lr.leftmost, rect.left), rightmost: Math.max(lr.rightmost, rect.right)}
               }, {leftmost: Number.MAX_SAFE_INTEGER, rightmost: Number.MIN_SAFE_INTEGER} );
         $menu.css({'width': extrema.rightmost - extrema.leftmost, 'max-width': ''});
         Menu.setMenuLocations(location, $menu);
         $menu.css('visibility', 'visible');
      }
   }
}

class SSD_Menu {
/*::
   menuList: HTMLElement;
   subMenu: ?SSD_Menu;
 */
   constructor(menuList /*: HTMLElement */) {
      this.menuList = menuList;
      this.subMenu = null;
      $(menuList).css('visibility', 'visible');
      menuList.addEventListener('click', this.clickHandler);
      menuList.addEventListener('touchstart', this.touchHandler);
      menuList.addEventListener('touchend', this.touchHandler);
   }

   // Captures touchstart, touchend events to keep them from propagating to the subset_page event handler
   //   (let touchmove through to allow scrolling)
   touchHandler(touchEvent /*: TouchEvent */) {
      touchEvent.stopPropagation();
   }

   /* Handles click events on this.menuList, and stops their propagation to the subset_page event handler
    *   -- if there's a subMenu being displayed, just close it
    *   -- if the list item under this click has an action attribute, eval it
    *   -- if the list item under this click has a ul, open it as a subMenu
    */
   clickHandler(mouseEvent /*: MouseEvent */) {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
      if (this.subMenu) {        // is there's a submenu open, just close it
         this.subMenu.close();
         this.subMenu = null;
      } else {
         const $menuListItem = $(document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)).closest('li');
         if ($menuListItem.attr('action') == undefined) {
            this.subMenu = new SSD_Menu($menuListItem.find('> ul')[0]);
         } else {
            eval($menuListItem.attr('action'));
            SSD.clearMenus();
         }
      }
   }

   // Closes this menu's subMenu, if it exists, then removes this menu's event listeners and hides itself
   close() {
      if (this.subMenu) {
         this.subMenu.close();
      }
      this.menuList.removeEventListener('click', this.clickHandler);
      this.menuList.removeEventListener('touchend', this.touchHandler);
      this.menuList.removeEventListener('touchstart', this.touchHandler);
      $(this.menuList).css('visibility', 'hidden');
   }

   // Create entire menu tree for subset/header under this event, and display its first level
   static postMenu(event /*: Event */, location /*: {clientX: number, clientY: number} */) {
      event.preventDefault();

      const $curr = $(event.target).closest('p.subset_page_header, p.placeholder, li[id]');

      // unrecognized event
      if ($curr.length == 0) return;

      $('#bodyDouble').click();

      const isHeaderMenu = $curr[0].tagName == "P";
      const $menu = isHeaderMenu ?
                    $(eval(Template.HTML('headerMenu_template'))) :
                    SSD.displayList[parseInt($curr[0].id)].menu;
      new SSD_Menu($menu[0]);
      $curr.addClass('highlighted').append($menu);
      $menu.css('visibility', 'hidden');
      event.stopPropagation();

      if (!isHeaderMenu) {
         this.makeLongLists($curr[0].id, $menu);
      }
      Menu.setMenuLocations(location, $menu);
      $menu.css('visibility', 'visible');
   }

   // Create the intersection, union, and elementwise product subMenus
   static makeLongLists(_id /*: string */, $menu /*: JQuery */) {
      const id = parseInt(_id);
      const classes = ['.intersection', '.union', '.elementwise-product'];
      const operations = ['intersection', 'union', 'elementwiseProduct'];
      const printOps = ['intersection', 'union', 'elementwise product'];
      const node = SSD.displayList[id].name;
      for (let inx = 0; inx < classes.length; inx++) {
         const operation = operations[inx];
         const printOp = printOps[inx];
         let frag = '';
         for (let otherId = 0; otherId < group.subgroups.length; otherId++) {
            if (id != otherId) {
               frag +=
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `${MathML.sansText('the')} ${MathML.sansText(printOp)} ${MathML.sansText('of')} ${node} ${MathML.sansText('with')} ${SSD.displayList[otherId].name}</li>`;
            }
         }
         for (let otherId = group.subgroups.length; otherId < SSD.displayList.length; otherId++) {
            if (id != otherId && SSD.displayList[otherId] !== undefined) {
               const otherName = $(`#${otherId}`).children()[1].outerHTML;
               frag +=
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `${MathML.sansText('the')} ${MathML.sansText(printOp)} ${MathML.sansText('of')} ${node} ${MathML.sansText('with')} ${SSD.displayList[otherId].name}</li>`;
            }
         }
         $menu.find(classes[inx]).html(frag);
      }
   }
}
