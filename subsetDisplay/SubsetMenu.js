// @flow
/*::
import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.md';
import Menu from '../js/Menu.md';
import Template from '../js/Template.md';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.SubsetMenu = class {
/*::
   static element_display_timeoutID: ?TimeoutID;
 */
   static init() {
      const subsetPage = $('#subset-control')[0];
      if (GEUtils.isTouchDevice()) {
         // register touchstart, touchmove, touchend events on subset page

         subsetPage.addEventListener('touchstart', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchmove', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchend', SSD.SubsetMenu.touchHandler);

         subsetPage.addEventListener('click', Menu.actionClickHandler);
      } else {
         // register contextmenu, dblclick
         subsetPage.addEventListener('contextmenu', Menu.actionClickHandler);
         subsetPage.addEventListener('dblclick', (event /*: MouseEvent */) => SSD.SubsetMenu.displayElements(event, event));
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
   static touchHandler(touchEvent /*: TouchEvent */) {
      // skip modified events, multi-touches
      if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
          || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
         return;
      }

      switch (touchEvent.type) {
      case 'touchstart':
         SSD.SubsetMenu.element_display_timeoutID = setTimeout( () => {
            SSD.SubsetMenu.displayElements(touchEvent, touchEvent.touches[0]);
         }, 500);
         break;

      case 'touchend':
         clearTimeout(SSD.SubsetMenu.element_display_timeoutID);
         break;
      }
   }

   static displayElements(event /*: Event */, location /*: eventLocation */) {
      event.preventDefault();
      GEUtils.cleanWindow();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[parseInt(id)];
         const subsetName = subset.name;
         const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
         const $menu = $(eval(Template.HTML('subset-elements-template')));
         $curr.addClass('highlighted').append($menu);
         Menu.setMenuLocation($menu, location);
         $menu.css('visibility', 'visible');
         event.stopPropagation();
      }
   }

   static showingOrderClasses() /*: boolean */ {
      return $('#partitions li.orderClass').length != 0;
   }

   static showingConjugacyClasses() /*: boolean */ {
      return $('#partitions li.conjugacyClass').length != 0;
   }

   static showingLeftCosets(id /*: groupElement */) /*: boolean */ {
      return $('#partitions li.leftCoset' + id).length != 0;
   }

   static showingRightCosets(id /*: groupElement */) /*: boolean */ {
      return $('#partitions li.rightCoset' + id).length != 0;
   }

   static makeLongList(id /*: groupElement */, template_name /*: string */) /*: html */ {
      const template = Template.HTML(template_name);
      const result = SSD.displayList.reduce(
         (list, item, other_id) => ((other_id == id) ? null : list.push(eval(template)), list), [] )
            .join('');
      return result;
   }

   static showHeaderMenu(event /*: MouseEvent */) {
      GEUtils.cleanWindow();
      const $menus = $(eval(Template.HTML('header-menu-template')))
            .appendTo($(event.target).closest('[action]')[0]);
      Menu.addMenus($menus, event);
   }

   static showMenu(event /*: MouseEvent */, id /*: number */) {
      GEUtils.cleanWindow();
      const $menus = SSD.displayList[id].menu
            .appendTo($(event.target).closest('li'));
      Menu.addMenus($menus, event);
   }
}
