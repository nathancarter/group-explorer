// @flow

import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import * as SSD from './subsets.js';

export {initSubsetMenu, showingOrderClasses, showingConjugacyClasses, showingLeftCosets, showingRightCosets, makeLongList, showHeaderMenu, showMenu};

//displayElements, 
function initSubsetMenu() {
   const subsetPage = $('#subset-control')[0];
   if (GEUtils.isTouchDevice()) {
      // register touchstart, touchmove, touchend events on subset page

      subsetPage.addEventListener('touchstart', touchHandler);
      subsetPage.addEventListener('touchmove', touchHandler);
      subsetPage.addEventListener('touchend', touchHandler);

      subsetPage.addEventListener('click', subsetClickHandler);
   } else {
      // register contextmenu, dblclick
      subsetPage.addEventListener('contextmenu', subsetClickHandler);
      subsetPage.addEventListener('dblclick', (event /*: MouseEvent */) => displayElements(event, event));
   }
}

function subsetClickHandler (event /*: MouseEvent */) {
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

let element_display_timeoutID /*: ?TimeoutID */ = null;

/*
 * Mouse right-click or touchscreen tap displays menu according to
 *   -- target class (subset_page_header or placeholder)
 *   -- li element id (<subset>.menu)
 *
 * Mouse double-click or touchscreen tap-hold displays elements in subset
 *   Following mouse click or touchscreen tap anywhere clears element display
 */
function touchHandler(touchEvent /*: TouchEvent */) {
   // skip modified events, multi-touches
   if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
       || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
      return;
   }

   switch (touchEvent.type) {
   case 'touchstart':
      element_display_timeoutID = setTimeout( () => displayElements(touchEvent, touchEvent.touches[0]), 500);
      break;

   case 'touchend':
      element_display_timeoutID = clearTimeout(element_display_timeoutID);
      break;
   }
}

function displayElements(event /*: Event */, location /*: eventLocation */) {
   event.preventDefault();
   GEUtils.cleanWindow();
   const $curr = $(event.target).closest('li');
   const id = $curr.attr('id');
   if (id != undefined) {
      const subset = SSD.displayList[parseInt(id)];
      const subsetName = subset.name;
      const subsetElements = subset.elements.toArray().map( (el) => SSD.group.representation[el] );
      const $menu = $(eval(Template.HTML('subset-elements-template')));
      $curr.addClass('highlighted').append($menu);
      Menu.setMenuLocation($menu, location);
      $menu.css('visibility', 'visible');
      event.stopPropagation();
   }
}

function showingOrderClasses() /*: boolean */ {
   return $('#partitions li.orderClass').length != 0;
}

function showingConjugacyClasses() /*: boolean */ {
   return $('#partitions li.conjugacyClass').length != 0;
}

function showingLeftCosets(id /*: groupElement */) /*: boolean */ {
   return $('#partitions li.leftCoset' + id).length != 0;
}

function showingRightCosets(id /*: groupElement */) /*: boolean */ {
   return $('#partitions li.rightCoset' + id).length != 0;
}

function makeLongList(id /*: groupElement */, template_name /*: string */) /*: html */ {
   const template = Template.HTML(template_name);
   const result = SSD.displayList.reduce(
      (list, item, other_id) => ((other_id == id) ? null : list.push(eval(template)), list), [] )
         .join('');
   return result;
}

function showHeaderMenu(event /*: MouseEvent */) {
   GEUtils.cleanWindow();
   const $menus = $(eval(Template.HTML('header-menu-template')))
         .appendTo($(event.target).closest('[action]')[0]);
   Menu.addMenus($menus, event, subsetClickHandler);
}

function showMenu(event /*: MouseEvent */, id /*: number */) {
   GEUtils.cleanWindow();
   const $menus = SSD.displayList[id].menu
         .appendTo($(event.target).closest('li'));
   Menu.addMenus($menus, event, subsetClickHandler);
}
