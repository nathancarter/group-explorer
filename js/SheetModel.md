// @flow

/* global $ localStorage */

import { createLabelledCycleGraphView } from './CycleGraphView.js'
import { createFullMulttableView } from './MulttableView.js'
import { createLabelledCayleyDiagramView } from './CayleyDiagramView.js'
import * as Library from './Library.js'
import Log from './Log.js'
import * as MathML from './MathML.js'
import * as SheetView from './SheetView.js'
import Template from './Template.js'
import { THREE } from '../lib/externals.js'

export const LISTENER_READY_MESSAGE = 'listener ready' // sent by visualizers on load complete
export const STATE_LOADED_MESSAGE = 'state loaded' // sent by visualizers on model received

const DEFAULT = {
  NodeElement: {
    x: 0,
    y: 0,
    w: 0.1,
    h: 0.1,

    // NodeElements have even z-index, LinkElements have odd, so they can overlay/underlay the NodeElements they connect
    get z () {
      return 2 * (sheetElements.size + 1)
    }
  },

  TextElement: {
    // w: null, => auto
    color: '#000000',
    opacity: 0, // transparent background
    text: '',
    fontSize: '16px',
    fontColor: 'black',
    alignment: 'left',
    isPlainText: false // text without special characters (e.g., <, >) renders fine in HTML, too
  },

  RectangleElement: {
    color: '#DDDDDD'
  },

  ConnectingElement: {
    thickness: 4,
    color: '#000000',
    hasArrowhead: true
  },

  MorphismElement: {
    name: 'f',
    showDomainAndCodomain: false,
    showDefiningPairs: false,
    showInjectionSurjection: false,
    showManyArrows: false,
    arrowMargin: 0
  }
}

/*::
import { CayleyDiagramView } from './CayleyDiagramView.js'
import XMLGroup from './XMLGroup.js';

export type VisualizerName = 'CDElement' | 'CGElement' | 'MTElement';

export type ClassName =
      'RectangleElement'
    | 'TextElement'
    | VisualizerName
    | 'ConnectingElement'
    | 'MorphismElement';

export interface VizDisplay<VizDispJSON> {
   group: any;
   +getSize: any;
   +setSize: any;
   +getImage: any;
   +toJSON: any;
   +fromJSON: any;
   +unitSquarePosition: any;
};
export type VisualizerElementJSON = any;
export type JSONType = any;
export type SheetElementJSON = any;
export type RectangleElementJSON = any;
export type TextElementJSON = any;
export type ConnectingElementJSON = any;
export type MorphismElementJSON = any;
export type VisualizerType = any;
export type MSG_loadGroup = any;
export type MSG_external<VizType: any> = any;
export type MSG_editor<VizType: any> = any;
*/

export const sheetElements = new Map/*:: <string, SheetElement> */()

export function clear () {
  sheetElements.forEach((el) => {
    if (el instanceof NodeElement) {
      el.destroy()
    }
  })
  SheetView.redrawAll()
}

export function toJSON () /*: Array<Obj> */ {
  return Array.from(sheetElements.values()).map((el) => el.toJSON())
}

export function fromJSON (jsonString /*: string */) {
  fromJSONObject(JSON.parse(jsonString))
}

export function fromJSONObject (jsonObjects /*: JSONType */) {
  // remove existing elements
  clear()
  CDElement.activeElement = null

  // load all URLs
  const groupURLs = Array.from(
    jsonObjects.reduce(
      (URLs, jsonObject) => {
        if (jsonObject.groupURL !== undefined) {
          URLs.add(jsonObject.groupURL)
        }
        return URLs
      }, new Set()))

  Promise
    .all(groupURLs.map((url) => Library.getGroupOrDownload(url)))
    .then(() => {
      for (let inx = 0; inx < jsonObjects.length; inx++) {
        addElement(jsonObjects[inx])
      }
    })
}

export function addElement (options /*: Obj */, type /*: string */ = options.className) /*: SheetElement */ {
  const newElement = new (eval(type))().fromJSON(options)
  sheetElements.set(newElement.id, newElement)
  newElement.viewElement = SheetView.createViewElement(newElement)
  return newElement
}

export class SheetElement {
/*::
    id: string;
   +viewElement: SheetView.SheetView;
    z: integer;  // z-index
*/
  get className () {
    return this.constructor.name
  }

  destroy () {
    this.viewElement.destroy()
    sheetElements.delete(this.id)
  }

  redraw () {
    this.viewElement.redraw()
  }

  updateTransform () {
    this.viewElement.updateTransform()
  }

  updateZ () {
    this.viewElement.updateZ()
  }

  toJSON (_ /*: mixed */, customKeys /*: Array<string> */ = []) /*: Obj */ { // FIXME -- we can be more precise
    customKeys.push('viewElement')
    const jsonObject = Object
      .getOwnPropertyNames(this)
      .filter(
        (key) => !customKeys.includes(key))
      .reduce(
        (json, key) => {
          // $FlowFixMe -- perhaps we can make this less generic?
          json[key] = this[key]
          return json
        }, {})
    jsonObject.className = this.className

    return jsonObject
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: SheetElement */ {
    customKeys.push('id', 'viewElement')
    Object.getOwnPropertyNames(this).filter((key) => !customKeys.includes(key))
    // $FlowFixMe
      .forEach((key) => { this[key] = (jsonObject[key] === undefined) ? this[key] : jsonObject[key] })

    if (jsonObject.id === undefined) {
      for (this.id = '' + sheetElements.size; sheetElements.has(this.id); this.id = parseInt(this.id) + 1 + '') {
        continue
      }
    } else {
      this.id = jsonObject.id
    }

    return this
  }

  get $editor () {
    return $(`#${this.className.toLowerCase().replace('element', '-editor')}`)
  }

  getEditor () {
    const model = this // needed in eval to form data-onload attribute
    this.$editor
      .find('[data-onload]')
    // Note that we don't use an arrow function here:
    // we want 'this' to refer to the HTML element in which the 'data-onload' attribute was found
      .each(function () { eval($(this).attr('data-onload')) })
    return this.$editor
  }

  updateFromEditor () {
    this.updateObjectFromEditor()
    this.redraw()
  }

  updateObjectFromEditor () {
    const model = this // needed in eval to form data-onupdate attribute
    this.$editor
      .find('[data-onupdate]')
    // Note that we don't use an arrow function here:
    // we want 'this' to refer to the HTML element in which the 'data-onupdate' attribute was found
      .each(function () { eval($(this).attr('data-onupdate')) })
  }
}

export class NodeElement extends SheetElement {
/*::
   +viewElement: SheetView.NodeView;
    x: float;
    y: float;
    w: float;
    h: float;
*/
  constructor () {
    super()
    Object.assign(this, DEFAULT.NodeElement)
  }

  move (dx /*: float */, dy /*: float */) {
    this.x += dx
    this.y += dy
  }

  moveTo (x /*: float */, y /*: float */) {
    this.x = x
    this.y = y
  }

  resize (width /*: float */, height /*: float */) {
    this.w = width
    this.h = height
  }

  get links () /*: Array<LinkElement> */ {
    const links = Array
      .from(sheetElements.values())
      .filter((el) => el instanceof LinkElement && (el.source === this || el.destination === this))
    return ((links /*: any */) /*: Array<LinkElement> */)
  }

  get position () /*: SheetView.SheetUnits */ {
    return new SheetView.SheetUnits(this.x, this.y)
  }

  get size () /*: SheetView.LogicalUnits */ {
    return new SheetView.LogicalUnits(this.w, this.h)
  }

  copy () {
    const jsonObject = this.toJSON()
    delete jsonObject.id
    addElement(jsonObject)
  }

  destroy () {
    this.links.forEach((link) => link.destroy())
    super.destroy()
  }

  redraw () {
    super.redraw()
    this.links.forEach((link) => link.redraw())
  }

  updateTransform () {
    super.updateTransform()
    this.links.forEach((link) => link.redraw())
  }

  // tries to move element up or down compared to other elements, and returns whether a move was made
  moveZ (comparator /*: (a: SheetElement, b: SheetElement) => number */, repeat /*: boolean */) {
    // sort nodes according to comparator
    const sortedNodes = ((Array
      .from(sheetElements.values())
      .filter((el) => el instanceof NodeElement)
      .sort(comparator) /*: any */) /*: Array<NodeElement> */)

    // swap current node z value with next node in sort (unless this is the last node in the sort)
    const updatedNodes = new Set/*:: <NodeElement> */()
    for (let inx = sortedNodes.findIndex((el) => el.id === this.id); inx < sortedNodes.length - 1; inx++) {
      const thisNodeElement = sortedNodes[inx]
      const nextNodeElement = sortedNodes[inx + 1];

      // swap z values of this node and next
      // $FlowFixMe -- Flow doesn't support this idiomatic variable swap
      [thisNodeElement.z, nextNodeElement.z] = [nextNodeElement.z, thisNodeElement.z]
      updatedNodes.add(thisNodeElement)
      updatedNodes.add(nextNodeElement)

      if (!repeat) {
        break
      }

      // repair sortedNodes for next iteration
      // $FlowFixMe -- Flow doesn't support this idiomatic variable swap
      [sortedNodes[inx], sortedNodes[inx + 1]] = [sortedNodes[inx + 1], sortedNodes[inx]]
    }

    updatedNodes.forEach((node) => node.updateZ())

    ConnectingElement.updateZ()
  }

  moveForward () {
    this.moveZ((a, b) => a.z - b.z, false)
  }

  moveBackward () {
    this.moveZ((a, b) => b.z - a.z, false)
  }

  moveToFront () {
    this.moveZ((a, b) => a.z - b.z, true)
  }

  moveToBack () {
    this.moveZ((a, b) => b.z - a.z, true)
  }
}

export class RectangleElement extends NodeElement {
/*::
    color: color;
*/
  constructor () {
    super()
    Object.assign(this, DEFAULT.RectangleElement)
  }
}

export class TextElement extends NodeElement {
/*::
    text: string;
    color: color;  // background color
    opacity: float;  // opacity in [0,1]; 0 => transparent, 1 => completely opaque
    fontSize: string;
    fontColor: color;
    alignment: 'left' | 'center' | 'right';
    isPlainText: boolean;
*/
  constructor () {
    super()
    Object.assign(this, DEFAULT.TextElement)
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: TextElement */ {
    super.fromJSON(jsonObject, customKeys)

    if (this.text !== '') {
      this.w = jsonObject.w // undefined => .css('width', 'auto')
      this.h = jsonObject.h
    }
    if (jsonObject.color != null) {
      this.opacity = (jsonObject.opacity == null) ? 1 : jsonObject.opacity
    }

    return this
  }
}

export class VisualizerElement extends NodeElement {
/*::
    group: XMLGroup
    URL: string
   _visualizer: any
   +viewElement: SheetView.VisualizerView
*/
  get morphisms () {
    const morphisms = Array
      .from(sheetElements.values())
      .filter((el) => el instanceof MorphismElement && (el.source === this || el.destination === this))
    return ((morphisms /*: any */) /*: Array<LinkElement> */)
  }

  updateZ () {
    super.updateZ()
    this.morphisms.forEach((morphism) => morphism.updateZ())
  }

  toJSON (_ /*: mixed */, customKeys /*: Array<string> */ = []) /*: Obj */ {
    customKeys.push('group', 'visualizer')
    const jsonObject = super.toJSON(_, customKeys)
    jsonObject.groupURL = this.group.URL
    jsonObject.visualizer = this.visualizer.toJSON()

    return jsonObject
  }

  get visualizer () {
    return this._visualizer
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: VisualizerElement */ {
    customKeys.push('group', 'visualizer')
    super.fromJSON(jsonObject, customKeys)

    this.group = ((Library.getLocalGroup(jsonObject.groupURL) /*: any */) /*: XMLGroup */)

    return this
  }
}

export class CDElement extends VisualizerElement {
/*::
  static activeElement: CDElement
  static visualizer: CayleyDiagramView
  visualizerJSON: Obj
  isClean: boolean
*/
  get visualizer () {
    // find element with visualizer
    if (CDElement.activeElement !== this) {
      // check whether visualizer can be reused
      if (this.group.URL === CDElement.activeElement.group.URL && this.isClean && CDElement.activeElement.isClean) {
        this.moveVisualizerToThis()
        CDElement.visualizer.setHighlightDefinitions(this.visualizerJSON)
        CDElement.visualizer.drawAllHighlights()
      } else {
        this.moveVisualizerToThis()
        CDElement.visualizer.fromJSON(this.visualizerJSON)
      }
    }

    return CDElement.visualizer
  }

  moveVisualizerToThis () {
    if (CDElement.activeElement != null) {
      CDElement.activeElement.visualizerJSON = CDElement.visualizer.toJSON()
    }
    CDElement.activeElement = this
  }

  toJSON (_ /*: mixed */, customKeys /*: Array<string> */ = []) /*: Obj */ {
    customKeys.push('visualizerJSON')
    const jsonObject = super.toJSON(_, customKeys)

    return jsonObject
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: CDElement */ {
    customKeys.push('arrows', 'arrowColors', 'strategies', 'highlights')
    super.fromJSON(jsonObject, customKeys)

    // find element with visualizer
    const activeElement = CDElement.activeElement

    this.isClean = (jsonObject.isClean != null) ? jsonObject.isClean : (jsonObject.strategies == null)

    const isVisualizerElementJSON = () => {
      return jsonObject.visualizer == null
    }
    const canReuseCayleyDiagramView = () => {
      return activeElement != null &&
        activeElement.isClean &&
        this.isClean &&
        activeElement.visualizerJSON.groupURL === jsonObject.groupURL
    }
    const generateCayleyDiagram = () => {
      const diagramName = (this.group.cayleyDiagrams.length === 0) ? undefined : this.group.cayleyDiagrams[0].name
      CDElement.visualizer.generateFromJSON(this.group, diagramName, jsonObject)
      if (jsonObject.visualizer != null) {
        CDElement.visualizer.fromJSON(jsonObject.visualizer)
      }
    }

    // if a CayleyDiagramView instance hasn't been created yet, create one and associate it with this element
    if (CDElement.visualizer == null) {
      CDElement.visualizer = createLabelledCayleyDiagramView({ width: this.w, height: this.h })
      CDElement.activeElement = this
      generateCayleyDiagram()
      const visualizer = CDElement.visualizer
      visualizer.renderer.render(visualizer.scene, visualizer.camera) // need to render once to get camera right
    }

    if (canReuseCayleyDiagramView()) { // can this instance reuse the activeElement visualizer state?
      this.moveVisualizerToThis()
      if (isVisualizerElementJSON()) {
        CDElement.visualizer.generateHighlights(jsonObject.highlights)
      } else {
        CDElement.visualizer.setHighlightDefinitions(jsonObject.visualizer)
        CDElement.visualizer.drawAllHighlights()
      }
    } else { // can't reuse CDElement.visualizer state from activeElement; generate CayleyDiagram from scratch
      this.moveVisualizerToThis()
      generateCayleyDiagram()
    }

    this.visualizerJSON = CDElement.visualizer.toJSON()
    return this
  }
}

export class CGElement extends VisualizerElement {
  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: CGElement */ {
    super.fromJSON(jsonObject, customKeys)
    this._visualizer = createLabelledCycleGraphView()
    this.visualizer.group = this.group
    this.visualizer.fromJSON(jsonObject)
    return this
  }
}

export class MTElement extends VisualizerElement {
  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: MTElement */ {
    super.fromJSON(jsonObject, customKeys)
    this._visualizer = createFullMulttableView()
    this.visualizer.group = this.group
    this.visualizer.fromJSON(jsonObject)
    return this
  }
}

export class LinkElement extends SheetElement {
/*::
    source: NodeElement;
    destination: NodeElement;
*/
  toJSON (_ /*: mixed */, customKeys /*: Array<string> */ = []) /*: Obj */ {
    customKeys.push('source', 'destination')
    const jsonObject = super.toJSON(_, customKeys)
    jsonObject.sourceId = (this.source === undefined) ? null : this.source.id
    jsonObject.destinationId = (this.destination === undefined) ? null : this.destination.id

    return jsonObject
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: LinkElement */ {
    customKeys.push('sourceId', 'destinationId')
    super.fromJSON(jsonObject, customKeys)

    if (jsonObject.sourceId !== undefined) {
      this.source = ((sheetElements.get(jsonObject.sourceId) /*: any */) /*: NodeElement */)
    }
    if (jsonObject.destinationId !== undefined) {
      this.destination = ((sheetElements.get(jsonObject.destinationId) /*: any */) /*: NodeElement */)
    }

    return this
  }
}

export class ConnectingElement extends LinkElement {
/*::
    static z: number
    thickness: number;
    color: color;
    hasArrowhead: boolean;
 */
  constructor () {
    super()
    Object.assign(this, DEFAULT.ConnectingElement)
  }

  get z () /*: integer */ {
    return ConnectingElement.z
  }

  set z (z /*: integer */) { /* covers up nonkosher OO in Flow */ }

  static updateZ (newZ /*: ?number */) {
    // find all connecting elements, find smallest z of any source or destination, and set ConnectingElement z to one less
    // if this changes the ConnectingElement z then re-draw all connecting elements
    const connectingElements = ((Array
      .from(sheetElements.values())
      .filter((el) => el instanceof ConnectingElement) /*: any */) /*: Array<ConnectingElement> */)
    if (connectingElements.length > 0) {
      const zMin = connectingElements.reduce((zMin, connector) => {
        return Math.min(zMin, connector.source.z, connector.destination.z)
      }, newZ || Number.MAX_VALUE)

      if (ConnectingElement.z !== zMin - 1) {
        ConnectingElement.z = zMin - 1
        connectingElements.forEach((conn) => conn.updateZ())
      }
    }
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: ConnectingElement */ {
    customKeys.push('source', 'destination')
    super.fromJSON(jsonObject, customKeys)

    if (!(this.source instanceof NodeElement && this.destination instanceof NodeElement)) {
      Log.err('Illegal source/destination objects in ConnectingElement.fromJSON')
    }

    if (this.className === 'ConnectingElement') {
      const zMin = Math.min(this.destination.z, this.source.z)
      ConnectingElement.updateZ(zMin)
    }

    return this
  }
}

export class MorphismElement extends LinkElement {
/*::
    // $FlowFixMe                   // This really isn't kosher OO: the type of a subclass's read/write field should
    source: VisualizerElement;      // should be the same as its type in the superclass. So in order for MorphismElement
    // $FlowFixMe                   // to be a subclass of LinkElement, source and destination should be NodeElements,
    destination: VisualizerElement; // not VisualizerElements. This isn't necessarily a problem for Javascript, but it
                                    // does confuse the Flow typechecker.
    name: string;
    showDomainAndCodomain: boolean;
    showDefiningPairs: boolean;
    showInjectionSurjection: boolean;
    showManyArrows: boolean;
    arrowMargin: number;
    mapping: Mapping;
 */
  constructor () {
    super()
    Object.assign(this, DEFAULT.MorphismElement)
  }

  get z () /*: integer */ {
    return this.showManyArrows
      ? Math.max(this.source.z, this.destination.z) + 1
      : Math.min(this.source.z, this.destination.z) - 1
  }

  set z (z /*: integer */) { /* covers up nonkosher OO in Flow */ }

  getMapping () /*: Array<groupElement> */ {
    return this.mapping.fullMapping
  }

  // Find the simplest mathy name for this morphism that's not yet used on this sheet.
  getMathyName () /*: string */ {
    const mathyNames = ['f', 'g', 'h']
    const morphisms = Array
      .from(sheetElements.values()) // array of SheetElements
      .filter((element) => element instanceof MorphismElement) // array of MorphismElements

    const [subscript, nameIndex] = ((morphisms /*: any */) /*: Array<MorphismElement> */)
      .map((morphismElement) => morphismElement.name) // array of MorphismElement names
      .map((name) => name.match(/[f-h](<sub>([0-9]+)<\/sub>)?$/)) // array of mathy names/nulls
      .reduce( // array of used subscripts (0 for no subscript) for each prefix in mathyNames
        (largestUsedSubscripts, stringMatch) => {
          if (stringMatch !== null) {
            const mathyNameIndex = mathyNames.findIndex((mathyName) => mathyName === stringMatch[0][0])
            const subscript = (stringMatch[2] === undefined) ? 0 : parseInt(stringMatch[2])
            largestUsedSubscripts[mathyNameIndex] = Math.max(largestUsedSubscripts[mathyNameIndex], subscript)
          }
          return largestUsedSubscripts
        }, Array.from({ length: mathyNames.length }, () => -1)) // -1 => name not used
      .reduce(([subscript, nameIndex], largestUsedSubscripts, index) => {
        return (subscript <= largestUsedSubscripts) ? [subscript, nameIndex] : [largestUsedSubscripts, index]
      }, [Number.MAX_SAFE_INTEGER, 0])

    return mathyNames[nameIndex] + ((subscript === -1) ? '' : `<sub>${subscript + 1}</sub>`)
  }

  getLabel () /*: string */ {
    let html = this.name
    if (this.showDomainAndCodomain) {
      html += ` : ${this.source.group.name} ⟶ ${this.destination.group.name}`
    }

    if (this.showDefiningPairs) {
      html += this.mapping
        .definingPairs
        .map(([g, h]) => {
          return `<br>${this.name}(${this.source.group.representation[g]}) = ${this.destination.group.representation[h]}`
        })
        .join('')
    }

    if (this.showInjectionSurjection) {
      html += '<br>' + (this.mapping.isInjective ? '' : 'not ') + '1-1'
      html += '<br>' + (this.mapping.isSurjective ? '' : 'not ') + 'onto'
    }

    return html
  }

  getEditor () /*: JQuery */ {
    const $editor = super.getEditor()

    if ($('#morphism-preview-table').css('display') !== 'none') { // hide the morphism preview table, if it's displayed
      $('#morphism-preview .toggled').toggle()
    }

    const DISPLAY_FONT_SIZE = 20
    const domainDisplaySize = this.source.group.longestHTMLLabel * DISPLAY_FONT_SIZE
    const codomainDisplaySize = this.destination.group.longestHTMLLabel * DISPLAY_FONT_SIZE

    $('#defining-pair-table > thead > tr > th:first-child').css('min-width', domainDisplaySize)
    $('#defining-pair-table > thead > tr > th:nth-child(2)').css('min-width', codomainDisplaySize)

    $('#domain-selection').css('width', domainDisplaySize + 'px')
    $('#codomain-selection').css('width', codomainDisplaySize + 'px')

    this.setupMorphismAdd()

    return $editor
  }

  toJSON (_ /*: mixed */, customKeys /*: Array<string> */ = []) /*: Obj */ {
    customKeys.push('mapping')
    const jsonObject = super.toJSON(_, customKeys)
    jsonObject.definingPairs = this.mapping.definingPairs

    return jsonObject
  }

  fromJSON (jsonObject /*: Obj */, customKeys /*: Array<string> */ = []) /*: MorphismElement */ {
    customKeys.push('name', 'source', 'destination', 'definingPairs')
    super.fromJSON(jsonObject, customKeys)

    if (!(this.source instanceof VisualizerElement && this.destination instanceof VisualizerElement)) {
      Log.err('Illegal source/destination objects in MorphismElement.fromJSON')
    }

    this.mapping = new Mapping(this.source.group, this.destination.group, jsonObject.definingPairs)
    this.name = (jsonObject.name === undefined) ? this.getMathyName() : jsonObject.name

    return this
  }

  displayPreview () {
    if ($('#morphism-preview-table').css('display') !== 'none') {
      $('#morphism-preview tbody').empty()
      this.mapping.fullMapping.forEach(
        (codomainElement, domainElement) => {
          $('#morphism-preview tbody').append(eval(Template.HTML('morphism-preview-row-template')))
        })

      // set the column widths in the morphism preview table from the defining pairs table
      const $firstColumn = $('#defining-pair-table th:first-child')
      const $secondColumn = $('#defining-pair-table th:nth-child(2)')
      const firstColumnWidth = $firstColumn.width()
      const secondColumnWidth = $secondColumn.width()
      const previewTableWidth = $firstColumn[0].getBoundingClientRect().width + $secondColumn[0].getBoundingClientRect().width + 17

      $('#morphism-preview-table').css('width', previewTableWidth + 'px')
      $('#morphism-preview-table th:first-child').css('width', firstColumnWidth + 'px')
      $('#morphism-preview-table td:first-child').css('width', firstColumnWidth + 'px')
      $('#morphism-preview-table th:nth-child(2)').css('width', secondColumnWidth + 'px')
      $('#morphism-preview-table td:nth-child(2)').css('width', secondColumnWidth + 'px')
    }
  }

  fillDefiningPairs () {
    const $tbody = $('#morphism-defining-pairs')
    $tbody.children('[id!="empty-morphism-state"]').remove()
    if (this.mapping.definingPairs.length === 0) {
      $tbody.children('#empty-morphism-state').show()
    } else {
      $tbody.children('#empty-morphism-state').hide()
      this.mapping.definingPairs.forEach(
        ([domainElement, codomainElement]) => {
          $tbody.append(eval(Template.HTML('morphism-editor-defining-pair-template')))
        })
    }
  }

  addDefiningPair () {
    $('#empty-morphism-state').hide()

    const domainElement = parseInt($('#domain-selection').attr('data-value'))
    const codomainElement = parseInt($('#codomain-selection').attr('data-value'))
    this.mapping.addDefiningPair(domainElement, codomainElement)
    $('#morphism-defining-pairs').append(eval(Template.HTML('morphism-editor-defining-pair-template')))

    // propagate changes to rest of display
    this.displayPreview()
    this.setupMorphismAdd()
    this.updateFromEditor()
  }

  removeDefiningPair (domainElement /*: groupElement */) {
    const $tbody = $('#morphism-defining-pairs')
    $tbody.find(`#defining-pair-${domainElement}`).remove()
    this.mapping.removeDefiningPair(domainElement)
    if (this.mapping.definingPairs.length === 0) {
      $('#empty-morphism-state').show()
    }

    // propagate changes to rest of display
    this.displayPreview()
    this.setupMorphismAdd()
    this.updateFromEditor()
  }

  setupMorphismAdd () {
    if (this.mapping.image.includes(undefined)) {
      // domain selection is first unmapped source
      const domainSelection = this.mapping.image.findIndex((el) => el === undefined)
      this.setDomain(domainSelection)

      const codomainSelection = parseInt($('#codomain-selection').attr('data-value'))
      this.setCodomain(codomainSelection)

      $('#morphism-add-defining-pair').show()
    } else {
      $('#morphism-add-defining-pair').hide()
    }
  }

  setDomain (domainSelection /*: groupElement */) {
    // set domain-selection element
    $('#domain-selection')
      .attr('data-value', domainSelection)
      .html(this.source.group.representation[domainSelection])

    // set codomain-choices
    const validTargets = this.mapping.validTargets(domainSelection)
    const $targets = validTargets.reduce(
      ($frag, element) => $frag.append(eval(Template.HTML('morphism-codomain-choice-template'))),
      $(document.createDocumentFragment()))
    $('#codomain-choices')
      .html((($targets /*: any */) /*: DocumentFragment */))
      .hide()

    // if codomain-selection isn't in codomain-choices, choose smallest element of codomain-choices
    const maybeCodomainSelection = parseInt($('#codomain-selection').attr('data-value'))
    const codomainSelection = (validTargets.includes(maybeCodomainSelection))
      ? maybeCodomainSelection
      : validTargets[0]
    $('#codomain-selection')
      .attr('data-value', codomainSelection)
      .html(((this.destination.group.representation[codomainSelection] /*: any */) /*: DocumentFragment */))
  }

  setCodomain (codomainSelection /*: groupElement */) {
    // set codomain-selection element
    $('#codomain-selection')
      .attr('data-value', codomainSelection)
      .html(this.destination.group.representation[codomainSelection])

    // set domain-choices
    const validSources = this.mapping.validSources(codomainSelection)
    const $sources = validSources.reduce(
      ($frag, element) => $frag.append(eval(Template.HTML('morphism-domain-choice-template'))),
      $(document.createDocumentFragment()))
    $('#domain-choices')
      .html((($sources /*: any */) /*: DocumentFragment */))
      .hide()

    // if domain-selection isn't in domain-choices, choose smallest element of domain-choices
    const maybeDomainSelection = parseInt($('#domain-selection').attr('data-value'))
    const domainSelection = (validSources.includes(maybeDomainSelection))
      ? maybeDomainSelection
      : validSources[0]
    $('#domain-selection')
      .attr('data-value', domainSelection)
      .html(this.source.group.representation[domainSelection])
  }
}

export class Mapping {
/*::
    domain: XMLGroup;
    codomain: XMLGroup;
    definingPairs: Array<[groupElement, groupElement]>;
    image: Array<groupElement | void>;  // image[domainElement] = codomainElement
    fullMapping_: ?Array<groupElement | void>;
 */
  constructor (domain /*: XMLGroup */, codomain /*: XMLGroup */, definingPairs /*: Array<[groupElement, groupElement]> */ = []) {
    this.domain = domain
    this.codomain = codomain
    this.definingPairs = definingPairs
    this.update()
  }

  update () {
    const savedPairs = this.definingPairs
    this.definingPairs = []
    this.image = Array.from({ length: this.domain.order }, () => undefined)
    this.image[0] = 0
    savedPairs.forEach(
      ([domainElement, codomainElement]) => this.extend(domainElement, codomainElement)
    )
    this.fullMapping_ = null
  }

  removeDefiningPair (domainElement /*: groupElement */) {
    this.definingPairs.splice(this.definingPairs.findIndex(([g, h]) => g === domainElement), 1)
    this.update()
  }

  addDefiningPair (domainElement /*: groupElement */, codomainElement /*: groupElement */) {
    this.extend(domainElement, codomainElement)
  }

  // no element in the codomain is the image of two different domain elements
  get isInjective () /*: boolean */ {
    const fullMapping = this.fullMapping
    const inverse = Array.from({ length: this.codomain.order }, () => undefined)
    for (let domainElement = 0; domainElement < fullMapping.length; domainElement++) {
      const codomainElement = fullMapping[domainElement]
      if (inverse[codomainElement] !== undefined) {
        return false
      }
      inverse[codomainElement] = domainElement
    }

    return true
  }

  // every codomain element has an inverse image
  get isSurjective () /*: boolean */ {
    const fullMapping = this.fullMapping
    const inverse = fullMapping.reduce(
      (inverse, codomainElement, domainElement) => {
        inverse[codomainElement] = domainElement
        return inverse
      },
      Array.from/*:: <?groupElement> */({ length: this.codomain.order }, () => undefined))
    return !inverse.includes(undefined)
  }

  // check whether relations in G map to relations in H
  get isHomomorphism () /*: boolean */ {
    const G = this.domain
    const H = this.codomain
    const evaluateRelation = (relation) => relation.reduce(
      ([g, gs], el) => {
        const next = G.mult(el, g)
        gs.push([g, el, next])
        return [next, gs]
      },
      [0, []])[1]
    const mappingPreservesRelation = (mapping, relation) => evaluateRelation(relation).every(
      ([prev, step, next]) => mapping[next] === H.mult(mapping[step], mapping[prev])
    )
    return G.relations.every((relation) => mappingPreservesRelation(this.fullMapping, relation))
  }

  clone () /*: Mapping */ {
    const mapping = new Mapping(this.domain, this.codomain, [])
    mapping.definingPairs.push(...this.definingPairs)
    mapping.image = [...this.image]
    return mapping
  }

  extend (domainElement /*: groupElement */, codomainElement /*: groupElement */) /*: Mapping */ {
    const G = this.domain
    const H = this.codomain

    const previousImage = [...this.image]

    this.definingPairs.push([domainElement, codomainElement])

    previousImage.forEach(
      (h, g) => {
        if (h !== undefined) {
          this.image[G.mult(g, domainElement)] = H.mult(h, codomainElement)
        }
      })

    const cosetRepresentatives = [domainElement]
    for (const r of cosetRepresentatives) {
      for (const [s] of this.definingPairs) {
        const rXs = G.mult(r, s)
        if (this.image[rXs] === undefined) {
          cosetRepresentatives.push(rXs)
          // $FlowFixMe -- logic is too math-y for Flow
          this.image[rXs] = H.mult(this.image[r], this.image[s])
          previousImage.forEach(
            (h, g) => {
              // $FlowFixMe -- logic is too math-y for Flow
              if (h !== undefined) {
                this.image[G.mult(g, rXs)] = H.mult(h, ((this.image[rXs] /*: any */) /*: groupElement */))
              }
            })
        }
      }
    }

    this.fullMapping_ = null
    return this
  }

  validSources (codomainElement /*: groupElement */) /*: Array<groupElement> */ {
    let validSources
    const unmappedSources = this.domain.elements.filter((g) => this.image[g] === undefined)
    if (codomainElement === undefined) {
      validSources = unmappedSources
    } else {
      validSources = unmappedSources
        .filter(
          (source) => this.domain.elementOrders[source] % this.codomain.elementOrders[codomainElement] === 0
        )
        .reduce(
          (validSources, maybeSource) => {
            const copy = this.clone()
            copy.extend(maybeSource, codomainElement)
            if (copy.extendedMap(copy) !== undefined) {
              validSources.push(maybeSource)
            }
            return validSources
          }, [])
    }
    return validSources
  }

  validTargets (domainElement /*: groupElement */) /*: Array<groupElement> */ {
    const validTargets = this.codomain.elements
      .filter(
        (target) => this.domain.elementOrders[domainElement] % this.codomain.elementOrders[target] === 0
      )
      .reduce(
        (validTargets, maybeTarget) => {
          const copy = this.clone()
          copy.extend(domainElement, maybeTarget)
          if (copy.extendedMap(copy) !== undefined) {
            validTargets.push(maybeTarget)
          }
          return validTargets
        }, [])
    return validTargets
  }

  get fullMapping () /*: Array<groupElement> */ {
    if (this.fullMapping_ == null) {
      if (this.image.includes(undefined)) {
        this.fullMapping_ = ((this.extendedMap(this) /*: any */) /*: Mapping */).image
      } else {
        this.fullMapping_ = this.image
      }
    }

    return ((this.fullMapping_ /*: any */) /*: Array<groupElement> */)
  }

  extendedMap (mapping /*: Mapping */) /*: ?Mapping */ {
    const G = this.domain
    const H = this.codomain
    const map = mapping.image

    if (map.includes(undefined)) {
      for (const maybeSource of G.generators[0].filter((maybeSource) => map[maybeSource] === undefined)) {
        for (const maybeTarget of H.elements) {
          const mappingCopy = mapping.clone()
          mappingCopy.extend(maybeSource, maybeTarget)
          const result = this.extendedMap(mappingCopy)
          if (result !== undefined) {
            return result
          }
        }
      }
      return undefined
    } else {
      return mapping.isHomomorphism ? mapping : undefined
    }
  }
}

/*::
interface IDBObjectStore_ext {
  getAllKeys(): IDBRequest;
}

type IDBObjectStore_curr = IDBObjectStore & IDBObjectStore_ext
*/

export class StoredSheets {
/*::
  static indexedDb: IDBDatabase
  static displayedSheetName: ?string
*/
  static async init () {
    const openRequest = window.indexedDB.open('GE3', 1)

    let migrationNeeded = false
    const openPromise = new Promise((resolve, reject) => {
      openRequest.onupgradeneeded = () => {
        const result = ((openRequest.result /*: any */) /*: IDBDatabase */)
        result.createObjectStore('StoredSheets')
        migrationNeeded = true // migrate sheets after this completes
      }
      openRequest.onsuccess = () => resolve(((openRequest.result /*: any */) /*: IDBDatabase */))
      openRequest.onerror = () => reject(openRequest.error)
    })

    StoredSheets.indexedDb = await openPromise

    if (migrationNeeded) {
      await StoredSheets.migrateSheets()
    }
  }

  static async migrateSheets () {
    // get old stored sheets from localStorage
    // convert each stored sheet and save it to IndexedDB
    const oldSheetStore = localStorage.getItem('sheets')
    if (oldSheetStore != null) {
      const storedSheets = StoredSheets.getStore('readwrite')
      const oldSheets = JSON.parse(oldSheetStore)
      if (Object.keys(oldSheets).length === 0) {
        localStorage.removeItem('sheets')
      } else {
        for (const [sheetName, oldSheet] of Object.entries(oldSheets)) {
          const newSheet = convertFromOldJSON(oldSheet)
          const putRequest = storedSheets.put(JSON.stringify(newSheet), sheetName)
          await new Promise((resolve, reject) => {
            putRequest.onsuccess = () => resolve(putRequest.result)
            putRequest.onerror = () => reject(putRequest.error)
          })
        }
      }
    }
  }

  static getStore (type /*: 'readonly' | 'readwrite' | 'versionchange' */ = 'readonly') /*: IDBObjectStore */ {
    const transaction = StoredSheets.indexedDb.transaction('StoredSheets', type)
    const storedSheets = transaction.objectStore('StoredSheets')
    return storedSheets
  }

  // set in load, save, destroy
  static displaySheetName (sheetName /*: ?string */ = null) {
    StoredSheets.displayedSheetName = sheetName
    $('#heading').html(sheetName || 'Group Explorer Sheet')
  }

  static async load (sheetName /*: string */) {
    const storedSheets = StoredSheets.getStore()
    const getRequest = storedSheets.get(sheetName)

    const getPromise = new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const storedJsonString = ((getRequest.result /*: any */) /*: string */)
        if (storedJsonString == null) {
          reject(new Error(`Unable to retrieve sheet ${sheetName} from indexedDB`))
        } else {
          const jsonObject = JSON.parse(storedJsonString)
          fromJSONObject(jsonObject)
          StoredSheets.displaySheetName(sheetName)
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })

    return getPromise
  }

  static async save (sheetName /*: string */) {
    const storedSheets = StoredSheets.getStore('readwrite')
    const sheetContent = JSON.stringify(toJSON())
    const putRequest = storedSheets.put(sheetContent, sheetName)

    const putPromise = new Promise((resolve, reject) => {
      putRequest.onsuccess = () => resolve(putRequest.result)
      putRequest.onerror = () => reject(putRequest.error)
    })

    return putPromise
  }

  static async destroy (sheetName /*: string */) {
    const storedSheets = StoredSheets.getStore('readwrite')
    const destroyRequest = storedSheets.delete(sheetName)

    const destroyPromise = new Promise((resolve, reject) => {
      destroyRequest.onsuccess = () => {
        if (StoredSheets.displayedSheetName === sheetName) {
          StoredSheets.displaySheetName(undefined)
        }
        resolve(destroyRequest.result)
      }
      destroyRequest.onerror = () => reject(destroyRequest.error)
    })

    return destroyPromise
  }

  static async list () {
    const storedSheets = StoredSheets.getStore('readwrite')
    const getAllKeysRequest = ((storedSheets /*: any */) /*: IDBObjectStore_curr */).getAllKeys()

    const getAllKeysPromise = new Promise((resolve, reject) => {
      getAllKeysRequest.onsuccess = () => resolve(((getAllKeysRequest.result /*: any */) /*: Array<string> */))
      getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error)
    })

    return getAllKeysPromise
  }
}

export function createNewSheet (jsonObjects /*: Array<Obj> */) { // FIXME -- make more specific
  localStorage.setItem('passedSheet', JSON.stringify(jsonObjects))
  return window.open('./Sheet.html?passedSheet')
}

export function loadPassedSheet () {
  // load passed sheet
  // (don't delete it, just let it get overwritten -- good for debugging, and lets user show it again)
  const jsonString = localStorage.getItem('passedSheet')
  if (typeof jsonString === 'string') {
    fromJSON(jsonString)
  }
}

/*
 * Convert from original Sheet JSON to current $rev$ 2
 *    Link:
 *      fromIndex -> sourceId
 *      toIndex -> destinationId
 *    Connection:
 *      useArrowhead -> hasArrowhead
 *      arrowheadSize not used?
 *    Morphism:
 *      showInjSurj -> showInjectionSurjection
 *      showDomAndCod -> showDomainAndCodomain
 *      arrowMargin was expressed in pixels, is now a percentage of the center-to-center distance
 */
export function convertFromOldJSON (oldJSONArray /*: Array<Obj> */) /*: Array<Obj> */ {
  const pixelsPerModelUnit = Math.min(window.innerWidth, window.innerHeight - 71)
  for (let inx = 0; inx < oldJSONArray.length; inx++) {
    const json = oldJSONArray[inx]

    // account for padding in old wrapper, #graphic offset from window, different padding in heading
    json.x += 10
    json.y += 10 - SheetView.graphicRect.y - 6

    // convert arrowMargin from pixels offset to percentage of center-to-center distance
    if (json.arrowMargin !== undefined) {
      const from = oldJSONArray[json.fromIndex]
      const fromCenter = new THREE.Vector2(from.x + from.w / 2, from.y + from.h / 2)
      const to = oldJSONArray[json.toIndex]
      const toCenter = new THREE.Vector2(to.x + to.w / 2, to.y + to.h / 2)
      const centerToCenter = fromCenter.sub(toCenter).length() * pixelsPerModelUnit
      json.arrowMargin *= 1 / centerToCenter
    }

    // re-write fromIndex to sourceId, toIndex to destinationId
    if (json.fromIndex !== undefined) {
      json.sourceId = json.fromIndex + ''
      delete json.fromIndex
    }
    if (json.toIndex !== undefined) {
      json.destinationId = json.toIndex + ''
      delete json.toIndex
    }

    // re-write useArrowhead to hasArrowhead
    if (json.useArrowhead !== undefined) {
      json.hasArrowhead = json.useArrowhead
      delete json.useArrowhead
    }

    // re-write showInjSurj to showInjectionSurjection
    if (json.showInjSurj !== undefined) {
      json.showInjectionSurjection = json.showInjSurj
      delete json.showInjSurj
    }

    // re-write showDomAndCod to showDomainAndCodomain
    if (json.showDomAndCod !== undefined) {
      json.showDomainAndCodomain = json.showDomAndCod
      delete json.showDomAndCod
    }

    // convert node labels from MathML to HTML
    if (json.nodes != null) {
      for (const node of json.nodes) {
        node.label = MathML.toHTML(node.label)
      }
    }

    // convert old CDElement JSON
    if (json.className === 'CDElement' && json.camera_matrix != null) {
      const visualizer = {
        arrowhead_placement: json.arrowhead_placement,
        arrows: json.arrows,
        background: json.background,
        cameraJSON: {
          metadata: {
            type: 'Object'
          },
          object: {
            aspect: 1,
            far: 2000,
            filmGauge: 35,
            filmOffset: 0,
            focus: 10,
            fov: 45,
            layers: 1,
            matrix: json.camera_matrix,
            near: 0.1,
            type: 'PerspectiveCamera',
            zoom: 1
          }
        },
        cameraUp: new THREE.Vector3(...json.camera_up),
        chunk: json.chunk,
        color_highlights: json.color_highlights,
        fog_level: json.fog_level,
        groupURL: json.groupURL,
        label_scale_factor: json.label_scale_factor,
        line_width: json.line_width,
        nodes: json.nodes,
        right_multiply: json.right_multiply,
        ring_highlights: json.ring_highlights,
        sphere_base_radius: json.sphere_base_radius,
        sphere_scale_factor: json.sphere_scale_factor,
        square_highlights: json.square_highlights,
        strategy_parameters: json.strategy_parameters,
        zoom_level: json.zoom_level
      }
      json.visualizer = visualizer
      json.isClean = false
      delete json.arrowhead_placement
      delete json.arrows
      delete json.background
      delete json.camera_matrix
      delete json.camera_up
      delete json.chunk
      delete json.color_highlights
      delete json.fog_level
      delete json.label_scale_factor
      delete json.line_width
      delete json.nodes
      delete json.right_multiply
      delete json.ring_highlights
      delete json.sphere_base_radius
      delete json.sphere_scale_factor
      delete json.square_highlights
      delete json.strategy_parameters
      delete json.zoom_level
    }
  }

  return oldJSONArray
}

export const init = StoredSheets.init
