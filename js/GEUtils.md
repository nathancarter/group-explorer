/* @flow

# GEUtils

A collection of utility routines used throughout GE3.
 * [equals](#equals) -- return whether two arrays are equal
 * [flatten](#flatten) -- flatten a nest of arrays to a single level
 * [last](#last) -- get last element of an array
 * [fromRainbow](#fromrainbow) -- returns hsl color string
 * [isTouchDevice](#istouchdevice) -- determine whether current device supports a touch interface
 * [cleanWindow](#cleanwindow) -- remove/hide/... elements of indicated class 
 * [ajaxLoad](#ajaxload) -- perform jQuery ajax file load
 * [setupFauxSelect](#setupfauxselect) -- set up `faux-select` HTML structure
 * [htmlToContext](#htmltocontext) -- copy characters from HTML to `<canvas>` context

```javascript
 */

/* global $ */

/*::
export type Tree<T> = Array< T | Tree<T> >;
 */

import { THREE } from '../lib/externals.js'

export { setupFauxSelect, htmlToContext }

export default
class GEUtils {
/*
```
### equals
Determine whether two arrays are equal according to whether their elements are ==.
```javascript
*/  
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
/*
```
### flatten
Flatten an arbitrarily nested array to a single level.
```javascript
*/  
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
/*
```
### last
Return the last element of an array.
```javascript
*/  
   static last/*:: <T> */(arr /*: Array<T> */) /*: T */ {
      return arr[arr.length - 1];
   }
/*
```
### fromRainbow
Return an hsl string given hue, saturation, and lightness values
```javascript
*/  
   // All arguments, including hue, are fractional values 0 <= val <= 1.0
   static fromRainbow(hue /*: float */, saturation /*:: ?: float */ = 1.0, lightness /*:: ?: float */ = .8) /*: css_color */ {
      return `hsl(${Math.round(360*hue)}, ${Math.round(100*saturation)}%, ${Math.round(100*lightness)}%)`
   }
/*
```
### isTouchDevice
Determine whether the current device supports a touch interface
```javascript
*/  
   static isTouchDevice() /*: boolean */ {
      return 'ontouchstart' in window;
   }
/*
```
### cleanWindow

Generally applicable routine that clears window of existing tooltips, menus, highlighting, etc. It is
   called from a high level (e.g., #bodyDouble) default click handler, or by a menu/tooltip routine just
   before it displays a new menu/tooltip or after it has finished performing a selected function.

Actions taken are determined from the following classes applied to DOM elements:
   highlighted -- remove highlighting from list elements
   display-none-on-clean -- hide structures so they don't take up space
   visibility-hidden-on-clean -- hide structures but let them continue to occupy space
   remove-on-clean -- remove dynamically-generated temporary artifacts, like menus and tooltips
   disable-on-clean -- disable buttons
```javascript
*/
   static cleanWindow() {
      $('.highlighted').each( (_inx, el) => $(el).removeClass('highlighted') );
      $('.display-none-on-clean').hide();
      $('.visibility-hidden-on-clean').css('visibility', 'hidden');       
      $('.remove-on-clean').remove();
      $('.disable-on-clean').each( (_inx, el) => $(el).prop('disabled', true) );
   }
/*
```
### ajaxLoad
Perform a jQuery ajax file load. This routine gives one place to change load options such as caching.
Expected to be replaced by the `fetch()` API.
```javascript
*/  
  static ajaxLoad (url /*: string */) /*: Promise<string> */ {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
//      cache: false, // use this during development to keep from loading stale .html pages
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
/*
```
### setupFauxSelect alias
Reference to exported module routine of same name. Expect that all class static routines will be
eventually be moved to Module scope.
```javascript
*/  
  static setupFauxSelect (x /*: HTMLElement */, y /*: Array<html> */, z /*: integer */) {
    setupFauxSelect(x, y, z)
  }
}
/*
```
### setupFauxSelect

Group theory nomenclature abounds with subscripts and superscripts. While browsers that
support HTML5 can render these, an HTML `<select>` element `<option>` can only contain
text. To display options attractively using this familiar drop-down format, GE3 uses a
styled HTML structure that looks and behaves much like an HTML `<select>` that permits
HTML in its `<option>` elements. Styled with `faux-select-XXX` classes defined in
[visualizerFramework/visualizer.css](../visualizerFramework/visualizer_css.md#faux-select),
an HTML sequence like the following is used:

```html
     <div class="faux-select" style="margin-bottom: 1em"
          onclick="$(this).find('.faux-select-options').toggle(); event.stopPropagation()">
         <div class="faux-select-arrow"></div>
         <span class="faux-select-value">
            the selected user-supplied choice goes here
         </span>
         <ol class="faux-select-options hidden">
            <li class="faux-select-option" onclick="...">a user-supplied choice goes here</li>
         </ol>
     </div>
```
`faux-select-XXX` classes include:
 * `faux-select` -- a container for the entire structure (mainly bounds searches for the other elements)
 * `faux-select-arrow` -- a pure CSS down-arrow styled to the right of the `faux-select-value`
 * `faux-select-value` -- a container displaying the selected option, initially `choices[initialChoice]`
 * `faux-select-options` -- a list of the options passed to `setupFauxSelect`
 * `faux-select-option` -- an individual option

A couple of points from the example:
 * Element id's are optional, though a unique id will be given to the `faux-select-value`
element (if it doesn't already have one) to facilitate copying the selected
`faux-select-option` to the `faux-select-value` field.
 * The `onclick` method of the `faux-select` element hides/shows the `faux-select-options`
list, just as an HTML `<select>` element would. (This isn't required, but it is often
useful.)
 * The elements of the structure can have styling other than the `faux-select-XXX`
classes, and there can be other elements (such as labels) mixed in, too. Bear in mind,
though, that some of the `faux-select-XXX` styling is needed to make the whole structure
look and act like a `<select>`.

The following `setupFauxSelect` routine populates the `faux-select-options` list with
`<li>` elements that contain the user-supplied `choices`, and whose onclick handlers copy
the element from the `faux-select-options` list to the `faux-select-value` field before
raising a `change` event. This mimics the behavior of an HTML `<select>` element upon
selecting one of its `<option>`s.  This event `change` event can be fielded by an event
listener, or the contents of the `faux-select-value` element can simply be examined when
needed.

The arguments to `setupFauxSelect` are:
 * `htmlElement` -- the `faux-select` element at the root of the HTML structure
 * `choices` -- an array of HTML string that will be wrapped and displayed in `faux-select-options`
 * `initialChoice` -- an index into `choices` array that will be the first displayed `faux-selection-value`

```javascript
 */
function setupFauxSelect (
  htmlElement /*: HTMLElement */,
  choices /*: Array<html> */,
  initialChoice /*: integer */
) /*: HTMLElement */ {
  const $selectValue = $(htmlElement).find('.faux-select-value')
  $selectValue.html(choices[initialChoice] || '')

  // set selectValue id to a unique value if it doesn't have an id already
  if ($selectValue[0].id === '') {
    let inx = 0
    while ($(`#faux-select-${++inx}`).length !== 0) { /* continue */ ; }
    $selectValue[0].id = `faux-select-${inx}`
  }

  const onClick =
        'event.stopPropagation();' +
        '$(this).parent().hide();' +
        `$('#${$selectValue[0].id}').html($(this).html())[0].dispatchEvent(new Event('change', { bubbles: true }));`
  const listElementHtml = `<li onclick="${onClick}" class="faux-select-option">`
  choices
    .reduce(
      ($frag, choice) => $frag.append($(listElementHtml).html(choice)),
      $(document.createDocumentFragment()))
    .appendTo($(htmlElement).find('.faux-select-options').empty())

  return htmlElement
}
/*
```
### htmlToContext

This routine draws characters from an HTML element (usually a `<div>`) onto a
CanvasRenderingContext2D. It preserves their font characteristics, spacing, etc., and centers the
result at `center`. This is used to label graphics in the visualizers with the same text that is
displayed elsewhere. We take particular advantage of the fact all our labels are single line, with
no browser-generated line breaks (this makes the analysis much simpler).  The font characteristics
-- style, size, weight, color -- are determined from the source's CSS style. The character locations
are determined using the `getClientRects()` interface on each of the source tree's text nodes.

```javascript
*/
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
