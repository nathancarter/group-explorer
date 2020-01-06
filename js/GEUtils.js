// @flow
/*::
import Diagram3D from './Diagram3D.js';

export type Tree<T> = Array< T | Tree<T> >;

export default
 */
class GEUtils {
   static equals(a /*: Array<any> */, b /*: Array<any> */) /*: boolean */ {
      if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
         for (let inx = 0; inx < a.length; inx++) {
            if (a[inx] != b[inx]) {
               return false;
            }
         }
         return true;
      }
      return false;
   }

   static flatten/*:: <T> */(tree /*: Tree<T> */) /*: Array<T> */ {
      return tree.reduce(
         (flattened, el) => {
            if (Array.isArray(el)) {
               flattened.push(...GEUtils.flatten( ((el /*: any */) /*: Tree<T> */) ))
            } else {
               flattened.push(el)
            }
            return flattened;
         }, [] );
   }

   static last/*:: <T> */(arr /*: Array<T> */) /*: T */ {
      return arr[arr.length - 1];
   }

   // All arguments, including hue, are fractional values 0 <= val <= 1.0
   static fromRainbow(hue /*: float */, saturation /*:: ?: float */ = 1.0, lightness /*:: ?: float */ = .8) /*: color */ {
      return `hsl(${Math.round(360*hue)}, ${Math.round(100*saturation)}%, ${Math.round(100*lightness)}%)`
   }

   static isTouchDevice() /*: boolean */ {
      return 'ontouchstart' in window;
   }

   /*
    * Generally applicable routine that clears window of existing tooltips, menus, highlighting, etc. It is
    *    called from a high level (e.g., #bodyDouble) default click handler, or by a menu/tooltip routine just
    *    before it displays a new menu/tooltip or after it has finished performing a selected function.
    *
    * Actions taken are determined from the following classes applied to DOM elements:
    *    highlighted -- remove highlighting from list elements
    *    hide-on-clean -- hide statically generated lists, like faux-select options
    *    remove-on-clean -- remove dynamically-generated temporary artifacts, like menus and tooltips
    *    disable-on-clean -- disable buttons
    */
   static cleanWindow() {
      $('.highlighted').each( (_inx, el) => $(el).removeClass('highlighted') );
      $('.hide-on-clean').hide();
      $('.remove-on-clean').remove();
      $('.disable-on-clean').each( (_inx, el) => $(el).prop('disabled', true) );
   }
}
