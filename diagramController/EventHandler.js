// @flow

import GEUtils from '../js/GEUtils.js';
import Menu from '../js/Menu.js';
import XMLGroup from '../js/XMLGroup.js';

import * as DC from './diagram.js';
import * as CD from '../CayleyDiagram.js';

export function clickHandler(event /*: MouseEvent */) {
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
