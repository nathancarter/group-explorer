// @flow
/*::
export default
 */
class GEUtils {
   static equals(a /*: Array<any> */, b /*: Array<any> */) /*: boolean */ {
      return Array.isArray(a) &&
         Array.isArray(b) &&
         a.length == b.length &&
         a.every( (el, inx) => el == b[inx] );
   }

   static flatten/*:: <T> */(arr /*: Tree<T> */) /*: Array<T> */ {
      return arr.reduce(
         (flattened, el) => {
            if (Array.isArray(el)) {
               flattened.push(...GEUtils.flatten/*:: <T> */(el))
            } else {
               flattened.push(el)
            }
            return flattened;
         }, [] );
   }

   static last/*:: <T> */(arr /*: Array<T> */) /*: T */ {
      return arr[arr.length - 1];
   }
}
