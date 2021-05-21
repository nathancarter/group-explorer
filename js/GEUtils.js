// @flow

/* global $ */

/*::
export type Tree<T> = Array< T | Tree<T> >;
 */

import { THREE } from '../lib/externals.js'

export { htmlToContext }

export default
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
   static fromRainbow(hue /*: float */, saturation /*:: ?: float */ = 1.0, lightness /*:: ?: float */ = .8) /*: css_color */ {
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
    *    display-none-on-clean -- hide structures so they don't take up space
    *    visibility-hidden-on-clean -- hide structures but let them continue to occupy space
    *    remove-on-clean -- remove dynamically-generated temporary artifacts, like menus and tooltips
    *    disable-on-clean -- disable buttons
    */
   static cleanWindow() {
      $('.highlighted').each( (_inx, el) => $(el).removeClass('highlighted') );
      $('.display-none-on-clean').hide();
      $('.visibility-hidden-on-clean').css('visibility', 'hidden');       
      $('.remove-on-clean').remove();
      $('.disable-on-clean').each( (_inx, el) => $(el).prop('disabled', true) );
   }

  static ajaxLoad (url /*: string */) /*: Promise<string> */ {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
      cache: false, // need this during development (and maybe migration?) to keep from loading stale .html pages
        success: (data /*: string */) => {
          resolve(data)
        },
        error: (_jqXHR, _status, err) => {
          const error = new Error(`Error loading ${url} ${err === undefined ? '' : ': ' + err}`)
          reject(error)
        }
      })
    })
  }
}

// Here we take advantage of the fact all our labels are on a single line
function htmlToContext (source /*: HTMLElement */, context /*: CanvasRenderingContext2D */, center /*: THREE.Vector2 */) {
  // find all text nodes in source element
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT)
  const textNodes = []
  for (let nextNode = walker.nextNode(); nextNode != undefined; nextNode = walker.nextNode()) {
    textNodes.push(nextNode)
  }

  const range = document.createRange()
  const nodesAndRects =
    Array.from(textNodes)
      .reduce((nodes, node) => {
        range.selectNodeContents(node)
        const rects = Array.from(range.getClientRects())
        if (rects.length != 0) {
          nodes.push(...rects.map((rect) => { return {node: node, rect: rect} }))
        }
        return nodes
      }, [])
      
  const {left: xMin, top: yMin, right: xMax, bottom: yMax} = source.getBoundingClientRect()

  // set up canvas context
  context.fillStyle = (source.style.color != undefined && source.style.color != '') ? source.style.color : 'black'
  context.textAlign = 'start'
  context.textBaseline = 'bottom'

  // copy node text into context at rect location, offset to place center of text at specified point
  for (const {node, rect} of nodesAndRects) {
    const $parent = $(node.parentElement)
    context.font = `${$parent.css('font-style')} ${$parent.css('font-weight')} ${$parent.css('font-size')} ${$parent.css('font-family')}`

    const x = rect.left - xMin + center.x - (xMax - xMin) / 2
    const y = rect.top + rect.height - yMin + center.y - (yMax - yMin) / 2
    context.fillText(node.textContent, x, y)
  }
}
