// @flow
/*::
import Diagram3D from './Diagram3D.js';

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

   static _flatten(arr /*: Array<any> */) /*: Array<any> */ {
      return arr.reduce(
         (flattened, el) => {
            if (Array.isArray(el)) {
               flattened.push(...GEUtils._flatten(el))
            } else {
               flattened.push(el)
            }
            return flattened;
         }, [] );
   }

   static flatten_el(arr /*: ElementTree | Array<Array<groupElement>> */) /*: Array<groupElement> */ {
      return GEUtils._flatten(arr);
   }
   static flatten_nd(arr /*: NodeTree */) /*: Array<Diagram3D.Node> */ {
      return GEUtils._flatten(arr);
   }
   static flatten_msh(arr /*: MeshTree */) /*: Array<THREE.Mesh> */ {
      return GEUtils._flatten(arr);
   }

   static last/*:: <T> */(arr /*: Array<T> */) /*: T */ {
      return arr[arr.length - 1];
   }
}
