// @flow

/* global alert $ performance TouchEvent */

import GEUtils from './GEUtils.js'
import Library from './Library.js'
import Log from './Log.js'
import * as Model from './SheetModel.js'
import { THREE } from '../lib/externals.js' // used in html action
import * as View from './SheetView.js'
import Template from './Template.js'

/*::
import type {CayleyDiagramJSON} from './CayleyDiagramView.js'
import type {CycleGraphJSON} from './CycleGraphView.js'
import type {MulttableJSON} from './MulttableView.js'

type VizDispJSON = CayleyDiagramJSON | CycleGraphJSON | MulttableJSON
 */

export { init }

/*
 * User inputs:
 *   move individual Node (left-click/one-touch drag)
 *   pan entire sheet (right-click/double-touch drag)
 *   zoom entire sheet (scroll/pinch)
 *   context menu (right-click/tap)
 *     resize, edit, info, copy, make connection, make map, move forward/backward, bring to top/bottom, delete
 *   resize node by selecting resize and left-click/one-touch dragging outside of node
 *   make connection/morphism by selecting from context menu and left-clicking/tapping on target
 *
 * Notes on Events:
 *   mousedown   (left button: event.button == 0; right button: event.button == 2)
 *   mousemove   (left button: event.buttons == 1; right button: event.buttons == 2)
 *   mouseup     (left button: event.button == 0; right button: event.button == 2)
 *   contextmenu (right button -- event.button == 2)
 *   click       happens after mouseup or touchend
 *
 *   touchstart  (changedTouches -- new touches)
 *   touchmove   (changedTouches -- moved touches)
 *   touchend    (changedTouches -- removed touches)
 *   touchcancel
 *
 *   mouseenter  mouse moves onto element that has listener attached
 *   mouseleave  mouse moves off element that has listener attached
 *   mouseout    mouse moves off element with listener attached or off one of its children
 *   mouseover   mouse moves over element with listener attached or over one of its children
 *
 *   change      input element loses focus
 *   input       input element changes
 */

let listener /*: AbstractController */

function init () {
  DragAndDrop.init()
  Controls.init()

  reset()

  // create dummy TouchEvent and Touch class definitions
  //   so we can test for 'instanceof TouchEvent' in desktop Safari without throwing an exception
  try {
    TouchEvent // just reference TouchEvent to see if it throws a ReferenceError
  } catch (err) {
    Log.info('adding dummy TouchEvent, Touch definitions')
    // $FlowFixMe
    window.TouchEvent = class {}
    // $FlowFixMe
    window.Touch = class {}
  }
}

function reset () {
  DragAndDrop.enable()
  listener = new TopSheetController()
}

/*::
  type UIEventTypes = WheelEventTypes | MouseEventTypes | TouchEventTypes | 'input'
*/

const MOUSE_EVENT_METHODS /*: {[key: MouseEventTypes | WheelEventTypes | 'input']: string} */ = {
  mousedown: 'onMouseDown',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  mousemove: 'onMouseMove',
  mouseout: 'onMouseOut',
  mouseover: 'onMouseOver',
  mouseup: 'onMouseUp',
  click: 'onClick',
  wheel: 'onWheel',
  contextmenu: 'onContextMenu',
  input: 'onInput'
}
const TOUCH_EVENT_METHODS /*: {[key: TouchEventTypes | 'input' | 'click']: string} */ = {
  touchstart: 'onTouchStart',
  touchmove: 'onTouchMove',
  touchend: 'onTouchEnd',
  touchcancel: 'onTouchCancel',
  input: 'onInput',
  click: 'onClick'
}
const eventListeners = new Map/*:: <UIEventTypes, string> */()

function addEventListener (eventType /*: UIEventTypes */) {
  if (!eventListeners.has(eventType)) {
    const eventMethod = GEUtils.isTouchDevice()
      ? TOUCH_EVENT_METHODS[((eventType /*: any */) /*: TouchEventTypes | 'input' | 'click' */)]
      : MOUSE_EVENT_METHODS[((eventType /*: any */) /*: WheelEventTypes | MouseEventTypes | 'input' */)]
    if (typeof eventMethod === 'string') {
      eventListeners.set(eventType, eventMethod)
      // $FlowFixMe -- Flow doesn't know about the 'change' event, doesn't seem to honor addEventListener(type: string...)
      $('#bodyDouble')[0].addEventListener(eventType, eventListener)
    }
  }
}

function eventListener (event /*: UIEvent */) {
  const eventMethod = eventListeners.get(((event.type /*: any */) /*: UIEventTypes */))
  // $FlowFixMe -- checking for listener.eventMethod(...)
  if (typeof eventMethod === 'string' && typeof listener[eventMethod] === 'function') {
    event.stopPropagation()
    // $FlowFixMe -- invoking listener.eventMethod(event)
    listener[eventMethod](event)
    if (event instanceof TouchEvent && event.touches.length === 2) {
      event.preventDefault()
    }
  } else {
    Log.warn(`SheetController received unexpected event ${event.type} in ${listener.constructor.name}`)
  }
}

function removeEventListener (eventType /*: UIEventTypes */) {
  if (eventListeners.has(eventType)) {
    eventListeners.delete(eventType)
    // $FlowFixMe -- Flow doesn't know about the 'change' event, doesn't seem to honor removeEventListener(type: string...)
    $('#bodyDouble')[0].removeEventListener(eventType, eventListener)
  }
}

function setEventListeners (eventTypes /*: Array<UIEventTypes> */) {
  for (const eventType of eventTypes) {
    addEventListener(eventType)
  }

  for (const eventType of eventListeners.keys()) {
    if (!eventTypes.includes(eventType)) {
      removeEventListener(eventType)
    }
  }
}

class AbstractController {
  constructor (events /*: Array<UIEventTypes> */) {
    setEventListeners(events)
    addEventListener('contextmenu') // so we can always prevent its default behavior
  }

  onContextMenu (event /*: MouseEvent */) {
    event.preventDefault()
  }
}

const CURSORS = [
  'nwse-resize', 'ns-resize', 'nesw-resize',
  'ew-resize', 'move', 'ew-resize',
  'nesw-resize', 'ns-resize', 'nwse-resize'
]

class TopSheetController extends AbstractController {
/*::
  downTime: number
  downPosition: View.WindowUnits
  lastSpan: ?float
  downModelElement: ?Model.SheetElement
  redrawTimer: ?number
  touchHoldTimer: ?number
 */
  constructor () {
    const events = [
      'mousedown', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'click', 'wheel',
      'touchstart', 'touchmove', 'touchend'
    ]
    super(events)
    $(View.Graphic).css('cursor', '')
  }

  // start listening for move -- might be scene drag (if right button down)
  onMouseDown (event /*: MouseEvent */) {
    this.downTime = event.timeStamp
    this.downPosition = new View.WindowUnits(event)
    const domElement = $(event.target).closest('.NodeElement, .LinkElement')[0]
    if (domElement != null) {
      this.downModelElement = ((Model.sheetElements.get(domElement.id) /*: any */) /*: Model.SheetElement */)
    }
    addEventListener('mousemove')
    addEventListener('mouseup')
  }

  // entered the scene
  onMouseEnter (event /*: MouseEvent */) {
    this.exit()
  }

  // left the scene
  onMouseLeave (event /*: MouseEvent */) {
    this.exit()
  }

  // right button is drag (left-button drag is handled by DragAndDrop)
  onMouseMove (event /*: MouseEvent */) {
    if (event.buttons & 2) { // Secondary (right) mouse button anywhere => drag scene
      const newPosition = new View.WindowUnits(event)
      const movement = this.downPosition.sub(newPosition)
      View.pan(-movement.x, -movement.y)
      this.downPosition = newPosition
    }
  }

  // left NodeElement, return cursor to normal
  onMouseOut (event /*: MouseEvent */) {
    const node = $(event.target).closest('.NodeElement')[0]
    if (node != null) {
      $(node).css('cursor', '')
    }
    removeEventListener('mousemove')
  }

  // entered NodeElement, set cursor to grab
  onMouseOver (event /*: MouseEvent */) {
    const node = $(event.target).closest('.NodeElement')[0]
    if (node != null) {
      $(node).css('cursor', 'move')
    }
  }

  onMouseUp (event /*: MouseEvent */) {
    const isQuick = (performance.now() - this.downTime) < 500
    const samePosition = new View.WindowUnits(event).sub(this.downPosition).length() < 0.001
    const isClick = isQuick && samePosition
    const isLeftButton = event.button === 0
    const isRightButton = event.button === 2
    const modelElement = this.downModelElement

    if (isClick) {
      if (isLeftButton) {
        if (modelElement instanceof Model.NodeElement) {
          listener = new MoveResizeSelectedNode(modelElement, event) // select for move / resize
        }
      } else if (isRightButton) {
        if (modelElement instanceof Model.NodeElement) {
          listener = new ElementContextMenuController(modelElement, event) // bring up context menu
        } else if (modelElement instanceof Model.LinkElement) {
          listener = new EditController(modelElement, event) // bring up editor
        }
      }
      GEUtils.cleanWindow()
    } else {
      this.exit() // finished dragging scene
    }
  }

  onClick (event /*: MouseEvent */) {
    if ($(event.target).closest('#controls')[0] != null) {
      listener = new Controls()
      listener.onClick(event)
    }
  }

  // could be the start of anything -- save time, position
  // if two fingers -> move/resize scene
  onTouchStart (event /*: TouchEvent */) {
    if (event.touches.length === 1) {
      this.downTime = event.timeStamp
      this.downPosition = new View.WindowUnits(event)
      const domElement = $(event.target).closest('.NodeElement, .LinkElement')[0]
      if (domElement != null) {
        this.downModelElement = ((Model.sheetElements.get(domElement.id) /*: any */) /*: Model.NodeElement */)
      }
    } else if (event.touches.length === 2) {
      this.downModelElement = null
      // start of window pan, zoom -- save position, span
      this.downPosition = new View.WindowUnits(event)
      this.lastSpan = new View.WindowUnits(event.touches[0]).sub(new View.WindowUnits(event.touches[1])).length()
    }
  }

  // if two fingers pan/zoom scene
  onTouchMove (event /*: TouchEvent */) { // FIXME: isn't this done in DragAndDrop??
    if (event.touches.length === 2) {
      const newPosition = new View.WindowUnits(event)
      const newSpan = new View.WindowUnits(event.touches[0]).sub(new View.WindowUnits(event.touches[1])).length()

      const movement = this.downPosition.sub(newPosition)
      View.pan(-movement.x, -movement.y)
      View.zoom(newSpan / ((this.lastSpan /*: any */) /*: float */))

      this.downPosition = newPosition
      this.lastSpan = newSpan
    }
  }

  onTouchEnd (event /*: TouchEvent */) {
    if (event.timeStamp - this.downTime <= 300 && event.touches.length === 0) {
      const touch = event.changedTouches[0]
      const modelElement = this.downModelElement
      if (modelElement instanceof Model.NodeElement) {
        listener = new ElementContextMenuController(modelElement, touch)
      } else if (modelElement instanceof Model.LinkElement) {
        listener = new EditController(modelElement, touch)
      }
    } else {
      if (event.touches.length === 0 && this.downModelElement instanceof Model.NodeElement) {
        listener = new MoveResizeSelectedNode(this.downModelElement, event)
      }
    }
  }

  onWheel (event /*: WheelEvent */) {
    if ($(event.target).closest('#graphic')[0] != null) {
      const zoomRatio = 1 + 3 * Math.abs(event.deltaY / window.innerWidth)
      const zoomFactor = (event.deltaY > 0) ? zoomRatio : 1 / zoomRatio
      View.zoom(zoomFactor)
      this.scheduleRedraw()
    }
  }

  scheduleRedraw () {
    if (this.redrawTimer != null) {
      window.clearTimeout(this.redrawTimer)
    }

    const redrawNodes = (_nodes) => {
      const nodes = ((_nodes /*: any */) /*: Array<Model.SheetElement> */)
      nodes.forEach((node) => node.redraw())
      this.redrawTimer = null
    }

    const allNodes = Array
      .from(((Model.sheetElements.values() /*: any */) /*: Iterator<Model.VisualizerElement> */))
      .filter((el) => el instanceof Model.VisualizerElement)
      .map((el) => ((el /*: any */) /*: Model.VisualizerElement */))
      .sort((a, b) => {
        if (a.isClean && b.isClean) {
          return (a.group.URL === b.group.URL) ? 0 : (a.group.URL < b.group.URL) ? -1 : 1
        } else {
          return a.isClean ? -1 : 1
        }
      })
    this.redrawTimer = window.setTimeout(redrawNodes, 250, allNodes)
  }

  exit () {
    reset()
  }
}

const resizeCoefficients = [
  { l: 1, t: 1, w: -1, h: -1 }, // quadrant 0
  { l: 0, t: 1, w: 0, h: -1 }, // 1
  { l: 0, t: 1, w: 1, h: -1 }, // 2
  { l: 1, t: 0, w: -1, h: 0 }, // 3
  { l: 1, t: 1, w: 0, h: 0 }, // 4
  { l: 0, t: 0, w: 1, h: 0 }, // 5
  { l: 1, t: 0, w: -1, h: 1 }, // 6
  { l: 0, t: 0, w: 0, h: 1 }, // 7
  { l: 0, t: 0, w: 1, h: 1 } // 8
]

class MoveResizeSelectedNode extends AbstractController {
  /*::
    domElement: HTMLElement
    modelElement: Model.NodeElement
    direction: ?integer
    lastPosition: View.SheetUnits
    downTime: number
    spread: ?float // in pixels, since we scale by ratio
  */
  constructor (modelElement /*: Model.NodeElement */, event /*: MouseEvent | TouchEvent | View.WindowUnits */) {
    const events = [
      'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseup', 'wheel',
      'touchstart', 'touchmove', 'touchend'
    ]
    super(events)
    DragAndDrop.disable()
    this.domElement = modelElement.viewElement.domElement
    $(this.domElement).css('cursor', '')
    this.modelElement = modelElement
    this.drawHalo()
    this.clearCursor()
  }

  onMouseEnter (event /*: MouseEvent */) {
    this.exit()
  }

  onMouseDown (event /*: MouseEvent */) {
    this.downTime = performance.now()
    this.setDirection(event)
  }

  onMouseLeave (event /*: MouseEvent */) {
    this.exit()
  }

  onMouseMove (event /*: MouseEvent */) {
    if (event.buttons === 0) {
      this.setDirection(event)
    } else if (event.buttons & 1) { // left button
      this.move(event)
    }
  }

  onMouseUp (event /*: MouseEvent */) {
    // this is the click to cancel selection and exit mode
    if (performance.now() - this.downTime < 300) {
      this.clearCursor()
      this.exit()
    }
  }

  onTouchStart (event /*: TouchEvent */) {
    if (event.touches.length === 1) {
      this.downTime = performance.now()
      this.setDirection(event)
    } else if (event.touches.length === 2) {
      this.direction = null
      this.spread = new View.WindowUnits(event.touches[0]).sub(new View.WindowUnits(event.touches[1])).length()
    }
  }

  onTouchMove (event /*: TouchEvent */) {
    if (event.touches.length === 1) {
      this.move(event)
    } else {
      this.pinch(event)
    }
    event.preventDefault()
  }

  onTouchEnd (event /*: TouchEvent */) {
    if (performance.now() - this.downTime < 300 && event.touches.length === 0) {
      this.clearCursor()
      this.exit()
    } else if (event.touches.length === 1) {
      this.spread = undefined
      this.lastPosition = new View.WindowUnits(event).toSheetUnits() // reset lastPosition, as if we just started
    }
  }

  onWheel (event /*: WheelEvent */) {
    this.zoom(event)
  }

  clearCursor () {
    $(this.domElement).css('cursor', '')
    $(View.Graphic).css('cursor', '')
  }

  drawHalo () {
    const rect = this.domElement.getBoundingClientRect()
    $('#halo').css({
      left: rect.left - 11,
      top: rect.top - 11,
      width: rect.width + 20,
      height: rect.height + 20
    }).show()
  }

  exit () {
    $('#halo').hide()
    this.clearCursor()
    reset()
  }

  // events are in WindowUnits, but modelElement is moved in ModelUnits
  move (event /*: MouseEvent | TouchEvent */) {
    if (this.direction == null) {
      return
    }

    const coeff = resizeCoefficients[this.direction]
    const currentPosition = new View.WindowUnits(event).toSheetUnits()
    const movement = currentPosition.clone().sub(this.lastPosition)
    this.lastPosition = currentPosition

    if (coeff.l !== 0 || coeff.t !== 0) {
      this.modelElement.move(coeff.l * movement.x, coeff.t * movement.y)
      this.modelElement.updateTransform()
    }

    if (coeff.w !== 0 || coeff.h !== 0) {
      this.modelElement.resize(this.modelElement.w + coeff.w * movement.x, this.modelElement.h + coeff.h * movement.y)
      this.modelElement.redraw()
    }

    this.drawHalo()
  }

  setDirection (event /*: MouseEvent | TouchEvent | View.WindowUnits */) {
    const direction = getQuadrant(this.domElement, event)
    this.direction = direction
    $(View.Graphic).css('cursor', CURSORS[direction])
    this.lastPosition = new View.WindowUnits(event).toSheetUnits()
  }

  zoom (event) {
    const zoomRatio = 1 + 3 * Math.abs(event.deltaY / window.innerWidth)
    const zoomFactor = (event.deltaY > 0) ? zoomRatio : 1 / zoomRatio
    // const zoomFactor = (event.deltaY > 0) ? 1.1 : 1 / 1.1
    this.modelElement.move((1 - zoomFactor) * this.modelElement.w / 2, (1 - zoomFactor) * this.modelElement.h / 2)
    this.modelElement.resize(zoomFactor * this.modelElement.w, zoomFactor * this.modelElement.h)
    this.modelElement.redraw()
    this.drawHalo()
  }

  pinch (event /*: TouchEvent */) {
    if (event.touches.length === 2) {
      const currentSpread = new View.WindowUnits(event.touches[0]).sub(new View.WindowUnits(event.touches[1])).length()
      if (this.spread != null) {
        const previousSpread = this.spread
        const ratio = currentSpread / previousSpread
        this.modelElement.resize(ratio * this.modelElement.w, ratio * this.modelElement.h)
        this.modelElement.redraw()
      }
      this.spread = currentSpread

      this.drawHalo()
    }
  }
}

class ElementContextMenuController extends AbstractController {
  /*::
    $menu: JQuery
    scrolling: boolean
    modelElement: Model.NodeElement
  */
  constructor (modelElement /*: Model.NodeElement */, event /*: MouseEvent | TouchEvent | Touch */) {
    const events = ['click']
    super(events)

    DragAndDrop.disable()
    this.modelElement = modelElement
    this.$menu = placeMenu($('#element-context-menu'), event).show()

    $('#element-context-menu .Node')
      .css('display', (this.modelElement instanceof Model.NodeElement) ? 'block' : 'none')
    $('#element-context-menu .Visualizer')
      .css('display', (this.modelElement instanceof Model.VisualizerElement) ? 'block' : 'none')
  }

  onClick (event /*: MouseEvent */) {
    if ($(event.target).closest('.context-menu').length === 0) {
      this.exit() // event isn't over any context menu: dismiss the open menu and exit menu controller
    } else {
      const $action = $(event.target).closest('[data-action]') // look for an action, and execute it if found
      if ($action.length !== 0) {
        eval($action.attr('data-action')) // click on menu item => execute 'data-action' attribute of item
        if (this !== listener) {
          this.$menu.hide() // dismiss entire menu if 'data-action' execution created a new listener
        }
      }
    }
  }

  createEditor (event) {
    DragAndDrop.enable()
    if (this.modelElement instanceof Model.VisualizerElement) {
      RemoteEditor.start(this.modelElement)
      reset()
    } else {
      listener = new EditController(this.modelElement, event)
    }
  }

  openInfo (event) {
    window.open('./GroupInfo.html?groupURL=' + ((this.modelElement /*: any */) /*: Model.VisualizerElement */).group.URL)
    reset()
  }

  createLink (event /*: MouseEvent | TouchEvent */, controllerType /*: 'Connector' | 'Morphism' | void */) {
    DragAndDrop.enable()
    if (controllerType === 'Connector' && this.modelElement instanceof Model.NodeElement) {
      listener = new ConnectionController(this.modelElement, event)
    } else if (controllerType === 'Morphism' && this.modelElement instanceof Model.VisualizerElement) {
      listener = new MorphismController(this.modelElement, event)
    }
  }

  exit () {
    this.$menu.hide()
    DragAndDrop.enable()
    reset()
  }
}

class RemoteEditor {
  static start (modelElement /*: Model.VisualizerElement */) {
    const editPageURLs = {
      MTElement: './Multtable.html?',
      CGElement: './CycleGraph.html?',
      CDElement: './CayleyDiagram.html?SheetEditor=true&'
    }
    const editPageURL = editPageURLs[modelElement.className] +
      ((modelElement.group == null) ? 'waitForMessage=true' : 'groupURL=' + modelElement.group.URL)
    const myDomain = new URL(window.location.href).origin

    const otherWin = window.open(editPageURL)
    otherWin.isEditor = true // to let child know that it should function as editor for a Sheet
    if (!modelElement.group.URL) {
      otherWin.addEventListener('load', function (event /*: ProgressEvent */) {
        const msg /*: Model.MSG_loadGroup */ = {
          type: 'load group',
          group: modelElement.group.toBriefJSON()
        }
        otherWin.postMessage(msg, myDomain)
      })
    }
    let otherWinState = 'starting'
    otherWin.addEventListener('message', (event /*: MessageEvent */) => {
      if (otherWinState === 'starting' && event.data === 'listener ready') {
        // initially set up the editor to be just like us
        const visualizerJSON = modelElement.visualizer.toJSON()
        Log.debug('posting external message', visualizerJSON)
        const msg /*: Model.MSG_external<VizDispJSON> */ = {
          source: 'external',
          json: visualizerJSON
        }
        otherWin.postMessage(msg, myDomain)
        otherWinState = 'loading my state'
      } else if (otherWinState === 'loading my state' && event.data === 'state loaded') {
        otherWinState = 'ready'
      } else if (otherWinState === 'ready') {
        // but when the editor changes, update us to be just like it
        if (event.data != null && event.data.source === 'editor') {
          const eventData = ((event.data /*: any */) /*: Model.MSG_editor<VizDispJSON> */)
          modelElement.visualizer.fromJSON(eventData.json)
          modelElement.redraw()
          if (modelElement instanceof Model.CDElement) {
            modelElement.isClean = false // mark model element 'dirty'
          }
        }
      }
    })
  }
}

class EditController extends AbstractController {
  /*::
    modelElement: Model.SheetElement
    initialJSON: Obj
    $editor: JQuery
  */
  constructor (modelElement /*: Model.SheetElement */, event /*: MouseEvent | Touch | View.WindowUnits */) {
    const events = [
      'mouseup', // what about click??
      'touchend',
      'input'
    ]
    super(events)
    DragAndDrop.enable()

    $('.context-menu').hide()
    this.modelElement = modelElement
    this.initialJSON = modelElement.toJSON()
    this.$editor = placeMenu(this.modelElement.getEditor(), event).show()
  }

  onInput (event /*: Event */) {
    // if this is echoed by a sibling, find the sibling that echoes it and update the sibling
    const $maybeEchoed = $(event.target).closest('.echoed')
    if ($maybeEchoed.length !== 0) {
      const $echo = $maybeEchoed.siblings('.echoed')
      $echo.val($maybeEchoed.val())
    }
    this.modelElement.updateFromEditor()
  }

  onMouseUp (event /*: MouseEvent */) {
    this.executeAction(event)
  }

  onTouchEnd (event /*: TouchEvent */) {
    this.executeAction(event)
  }

  commit () {
    this.exit()
  }

  destroy (event) {
    this.modelElement.destroy()
    this.exit()
  }

  rollback () {
    this.modelElement.fromJSON(this.initialJSON)
    this.modelElement.redraw()
    this.exit()
  }

  executeAction (event /*: MouseEvent | TouchEvent */) {
    if ($(event.target).closest('.editor')[0] != null) {
      const $maybeAction = $(event.target).closest('[data-action]')
      if ($maybeAction.length !== 0) {
        eval($maybeAction.attr('data-action'))
      }
    }
  }

  exit () {
    this.$editor.css('cursor', '')
    this.$editor.hide()
    reset()
  }
}

// listen for click and if it's over a valid node make a connection
class ConnectionController extends AbstractController {
  /*::
    source: Model.NodeElement
  */
  constructor (source /*: Model.NodeElement */, event /*: MouseEvent | TouchEvent */) {
    const events = ['click']
    super(events)

    $('.context-menu').hide()

    this.source = source
    const { x, y, width, height } = (($('#graphic')[0].getBoundingClientRect() /*: any */) /*: DOMRect */)
    $('#linking-indicator')
      .css({ left: x + width / 2, top: y + height / 3 })
      .show()
  }

  // maybe display a reason for failure in linking indicator?
  onClick (event /*: MouseEvent */) {
    // if this is listener's cancel button, just exit
    if ($(event.target).closest('#linking-indicator-cancel').length === 1) {
      this.exit()
    } else if ($(event.target).closest('.NodeElement').length === 1) {
      const destinationId = $(event.target).closest('.NodeElement')[0].id
      const destination = ((Model.sheetElements.get(destinationId) /*: any */) /*: Model.NodeElement */)
      if (this.isValidTarget(destination)) {
        const newConnection = this.createLink(destination)
        if (this.elementType === 'ConnectingElement') {
          newConnection.updateFromEditor()
        }
        const editPosition = this.source.viewElement.center
          .add(destination.viewElement.center)
          .multiplyScalar(0.5)
          .toWindowUnits()
        listener = new EditController(newConnection, editPosition)
        $('#linking-indicator').hide()
      }
    }
  }

  isValidTarget (nodeElement) /*: boolean */ {
    const isSource = (nodeElement === this.source)
    const isLinkedToSource =
      nodeElement.links.some((link) => link.source === this.source || link.destination === this.source)
    return !isSource && !isLinkedToSource
  }

  createLink (nodeElement) {
    const linkJson = { sourceId: this.source.id, destinationId: nodeElement.id }
    return Model.addElement(linkJson, this.elementType)
  }

  get elementType () {
    return 'ConnectingElement'
  }

  exit () {
    $('#linking-indicator').hide()
    reset()
  }
}

class MorphismController extends ConnectionController {
  isValidTarget (nodeElement) {
    return (nodeElement instanceof Model.VisualizerElement) && super.isValidTarget(nodeElement)
  }

  get elementType () {
    return 'MorphismElement'
  }
}

// Return quadrant according to
//   0  1  2
//   3  4  5
//   6  7  8
// numbering
function getQuadrant (node /*: HTMLElement */, event) /*: integer */ {
  const rect = ((node.getBoundingClientRect() /*: any */) /*: DOMRect */)
  const { x, y } = new View.WindowUnits(event)

  const row = y < rect.top ? 0 : (y > rect.bottom ? 2 : 1)
  const col = x < rect.left ? 0 : (x > rect.right ? 2 : 1)
  const quadrant = 3 * row + col

  return quadrant
}

// place $menu so that it doesn't extend out of the #graphic div
const EDITOR_PADDING = 10 // nominal value for padding + margin + border
function placeMenu ($menu, event) /*: JQuery */ {
  const request = new View.WindowUnits(event) // .toGraphicUnits()
  const x = Math.min(request.x, View.graphicRect.width - ($menu.width() + EDITOR_PADDING))
  const y = Math.min(request.y, View.graphicRect.height - ($menu.height() + EDITOR_PADDING))

  return $menu
    .css({
      left: x, // Note that position will be offset from #graphic
      top: y,
      'z-index': 10000
    })
}

function initFauxSelect (
  htmlElement /*: HTMLElement */,
  choices /*: Array<html> */,
  initialChoice /*: integer */
) /*: HTMLElement */ {
  const $selectionValue = $(htmlElement).find('.faux-selection-value')
  $selectionValue.html(choices[initialChoice] || '')

  // set selectionValue id to a unique value if it doesn't have one
  if ($selectionValue[0].id === '') {
    let inx = 0
    while ($(`#faux-select-${++inx}`).length !== 0) { /* continue */ ; }
    $selectionValue[0].id = `faux-select-${inx}`
  }

  const onClick =
    'event.stopPropagation();' +
    `$('#${$selectionValue[0].id}').html($(this).html())[0].dispatchEvent(new Event('change', { bubbles: true }));` +
    '$(this).parent().hide()'
  const listElementHtml = `<li onclick="${onClick}" class="choice">`
  choices
    .reduce(
      ($frag, choice) => $frag.append($(listElementHtml).html(choice)),
      $(document.createDocumentFragment()))
    .appendTo($(htmlElement).find('.faux-choices').empty())

  return htmlElement
}

class DragAndDrop {
  /*::
    static enabled: boolean
    static domElement: ?HTMLElement
    static nodeElement: ?Model.NodeElement
    static pointerOffset: ?View.PhysicalUnits
    static currentPoint: ?View.WindowUnits
  */
  static init () {
    DragAndDrop.enabled = true
    if (GEUtils.isTouchDevice()) {
      $('#bodyDouble')[0].addEventListener('touchstart', DragAndDrop.handleTouchEvent, true)
    } else {
      $('#bodyDouble')[0].addEventListener('mousedown', DragAndDrop.handleMouseEvent, true)
    }
  }

  static handleMouseEvent (event /*: MouseEvent */) {
    if (!DragAndDrop.enabled) {
      return
    }
    switch (event.type) {
      case 'mousedown':
        if (event.button === 0 && DragAndDrop.dragStart(event)) {
          $('#bodyDouble')[0].addEventListener('mousemove', DragAndDrop.handleMouseEvent, true)
          $('#bodyDouble')[0].addEventListener('mouseup', DragAndDrop.handleMouseEvent, true)
          $('#bodyDouble')[0].addEventListener('mouseleave', DragAndDrop.handleMouseEvent, true)
        }
        break

      case 'mousemove':
        DragAndDrop.drag(event)
        break

      case 'mouseup':
        DragAndDrop.drop(event)
        break

      case 'mouseleave':
        // check that event is not in within graphic
        if (document.elementsFromPoint(event.clientX, event.clientY).includes(View.Graphic)) {
          DragAndDrop.drag(event)
        } else {
          DragAndDrop.drop(event)
        }
        break

      default:
        Log.err(`unexpected mouse event type ${event.type} in SheetController.DragAndDrop`)
        break
    }
  }

  // if you have a touchend with one changedTouch and one touch, just let the last touch end
  static handleTouchEvent (event /*: TouchEvent */) {
    if (!DragAndDrop.enabled) {
      return
    }
    switch (event.type) {
      case 'touchstart':
        if (event.touches.length === 1) {
          if (DragAndDrop.dragStart(event)) {
            $('#bodyDouble')[0].addEventListener('touchmove', DragAndDrop.handleTouchEvent, true)
            $('#bodyDouble')[0].addEventListener('touchend', DragAndDrop.handleTouchEvent, true)
          }
        }
        break

      case 'touchmove': {
        if (event.touches.length === 1) {
          DragAndDrop.drag(event)
        } else {
          DragAndDrop.drop(event)
        }
        break
      }

      case 'touchend':
        if (event.touches.length === 0) {
          DragAndDrop.drop(event)
        }
        break

      default:
        Log.err(`unexpected touch event type ${event.type} in SheetController.DragAndDrop`)
        break
    }
  }

  static enable () {
    DragAndDrop.enabled = true
  }

  static disable () {
    DragAndDrop.enabled = false
  }

  static reset () {
    DragAndDrop.domElement = null
    DragAndDrop.nodeElement = null
    DragAndDrop.pointerOffset = null
    DragAndDrop.currentPoint = null

    $('#bodyDouble')[0].removeEventListener('mousemove', DragAndDrop.handleMouseEvent, true)
    $('#bodyDouble')[0].removeEventListener('mouseup', DragAndDrop.handleMouseEvent, true)
    $('#bodyDouble')[0].removeEventListener('mouseleave', DragAndDrop.handleMouseEvent, true)
    $('#bodyDouble')[0].removeEventListener('touchmove', DragAndDrop.handleTouchEvent, true)
    $('#bodyDouble')[0].removeEventListener('touchend', DragAndDrop.handleTouchEvent, true)
  }

  static dragStart (event /*: MouseEvent | TouchEvent */) {
    const isDragStart =
      $(event.target).closest('.draggable')[0] != null &&
      $(event.target).closest('input')[0] == null && // range & text
      $(event.target).closest('textarea')[0] == null

    if (isDragStart) {
      const domElement = (($(event.target).closest('.draggable')[0] /*: any */) /*: HTMLElement */)
      DragAndDrop.domElement = domElement
      if ($(domElement).hasClass('NodeElement')) {
        DragAndDrop.nodeElement = ((Model.sheetElements.get(domElement.id) /*: any */) /*: Model.NodeElement */)
      }

      const domElementLocation = new View.WindowUnits(((domElement.getBoundingClientRect() /*: any */) /*: DOMRect */))
      DragAndDrop.pointerOffset = new View.WindowUnits(event).sub(domElementLocation)
    }

    return isDragStart
  }

  static drag (event /*: MouseEvent | TouchEvent */) {
    const isDrag = DragAndDrop.domElement != null

    if (isDrag) {
      const newPosition = new View.WindowUnits(event)
      if (DragAndDrop.currentPoint == null) {
        DragAndDrop.currentPoint = newPosition
      }

      const upperLeftCorner =
        ($(DragAndDrop.domElement).css('position') === 'fixed')
          ? newPosition.sub(((DragAndDrop.pointerOffset /*: any */) /*: View.PhysicalUnits */))
          : newPosition.toGraphicUnits().sub(((DragAndDrop.pointerOffset /*: any */) /*: View.PhysicalUnits */))
      const nodeElement = DragAndDrop.nodeElement
      if (nodeElement == null) {
        $(DragAndDrop.domElement).css({
          left: upperLeftCorner.x,
          top: upperLeftCorner.y
        })
      } else {
        nodeElement.moveTo(...upperLeftCorner.toSheetUnits().toArray())
        nodeElement.redraw()
      }

      event.stopPropagation()
      event.preventDefault()
    }

    return isDrag
  }

  static drop (event /*: MouseEvent | TouchEvent */) {
    const isDrop = DragAndDrop.currentPoint != null

    if (isDrop) {
      DragAndDrop.drag(event)
    }

    DragAndDrop.reset()

    return isDrop
  }
}

class Controls extends AbstractController {
  /*::
    storedSheetSelection: ?string
  */
  constructor () {
    super(['click'])
  }

  static init () {
    if ($('#visualizer-select-group .faux-choices').children().length === 0) {
      Controls.loadGroups()
      Controls.loadStoredSheets()
    }
  }

  static loadGroups () {
    const groupListEntryTemplate = Template.HTML('visualizer-group-list-entry')
    const groups = Library.getAllLocalGroups()
      .sort((g, h) => g.order - h.order)
    const groupChoices = groups.map((group) => eval(groupListEntryTemplate).trim())
    const trivialIndex = groups.findIndex((g) => g.order === 1)
    const initialIndex = (trivialIndex === -1) ? 0 : trivialIndex
    initFauxSelect($('#visualizer-select-group')[0], groupChoices, initialIndex)
  }

  static async loadStoredSheets () {
    const sheetChoices = (await Model.StoredSheets.list()).sort()

    if (sheetChoices.length === 0) {
      $('#stored-sheet-list').html(eval(Template.HTML('stored-sheets-list-empty-entry-template')))
    } else {
      const sheetTemplate = Template.HTML('stored-sheets-list-entry-template')
      sheetChoices
        .reduce(
          ($frag, sheetName) => $frag.append(eval(sheetTemplate)),
          $(document.createDocumentFragment()))
        .appendTo($('#stored-sheet-list').empty())
    }
  }

  onClick (event /*: MouseEvent */) {
    const $target = $(event.target)

    if ($('#controls .controls-modal:visible').length !== 0 &&
        $target.closest('#controls .controls-modal:visible').length === 0) {
      // clicked outside a modal dialog box -- do nothing
    } else if ($('#controls .context-menu:visible').length !== 0 &&
               $target.closest('#controls .context-menu:visible').length === 0) {
      this.exit() // clicked outside a menu -- dismiss menu and return to top level controller
    } else if ($('#controls .faux-choices:visible').length !== 0 &&
               $target.closest('#controls .faux-choices:visible').length === 0) {
      this.exit() // clicked outside a faux-choice pulldown -- dismiss and return to top level controller
    } else if ($target.closest('[data-action]').length !== 0) {
      const action = $target.closest('[data-action]').attr('data-action')
      eval(action) // execute any data-action found
    }
  }

  /* *********************** Stored sheets from List *********************************/

  createSheet (event /*: MouseEvent */) {
    GEUtils.cleanWindow()
    $('#new-sheet-value').val('')
    $('#new-sheet-dialog').css({ left: event.clientX - 250, top: event.clientY, display: 'block' })
  }

  loadSheet (event /*: MouseEvent */) {
    if (this.storedSheetSelection != null) {
      Model.StoredSheets
        .load(this.storedSheetSelection)
        .then(() => this.exit())
    }
  }

  saveSheet (event /*: MouseEvent */) {
    if (this.storedSheetSelection != null) {
      this.saveSheetName(this.storedSheetSelection)
    }
  }

  saveSheetName (name /*: string */) {
    const sheetName = $('<div>').html(name.trim()).html()
    if (sheetName !== '') {
      Model.StoredSheets.save(sheetName).then(() => Controls.loadStoredSheets())
      this.exit()
    }
  }

  deleteSheet (event /*: MouseEvent */) {
    const sheetName = this.storedSheetSelection
    if (sheetName != null) {
      if (window.confirm(`Are you sure you want to delete stored sheet ${sheetName}?\nThis cannot be undone.`)) {
        Model.StoredSheets.destroy(sheetName).then(() => Controls.loadStoredSheets())
      }
    }
    this.exit()
  }

  async saveNewSheet () {
    const newSheetName = (($('#new-sheet-value').val() /*: any */) /*: string */)
    if (newSheetName === '') {
      alert('Empty sheet name -- click "Cancel" to dismiss')
    } else {
      const allNames = await Model.StoredSheets.list()
      if (allNames.includes(newSheetName)) {
        alert(`A stored sheet named "${newSheetName}" already exists`)
      } else {
        this.saveSheetName(newSheetName)
      }
    }
  }

  showStoredSheetMenu (event /*: MouseEvent */) {
    const maybeSelection = $(event.target).closest('li')[0]
    this.storedSheetSelection =
      (maybeSelection == null || maybeSelection.textContent === '(None)')
        ? null
        : maybeSelection.innerHTML
    const menuId = (this.storedSheetSelection == null) ? '#empty-stored-sheets-menu' : '#stored-sheets-menu'
    $(menuId).css({ left: event.clientX, top: event.clientY, display: 'block' })
    $('#stored-sheet-list > li').removeClass('highlighted')
    if (this.storedSheetSelection != null) {
      $(maybeSelection).addClass('highlighted')
    }
  }

  exportSheet (event /*: MouseEvent */) {
    GEUtils.cleanWindow()
    const jsonString = JSON.stringify(Model.toJSON())
    $('#export-sheet-value').val(jsonString)
    $('#export-sheet-dialog').css({ left: event.clientX - 250, top: event.clientY, display: 'block' })
  }

  importSheet (event /*: MouseEvent */) {
    GEUtils.cleanWindow()
    $('#import-sheet-value').val('')
    $('#import-sheet-dialog').css({ left: event.clientX - 250, top: event.clientY, display: 'block' })
  }

  importSheetData () {
    const jsonString = (($('#import-sheet-value').val() /*: any */) /*: string */)
    if (jsonString !== '') {
      Model.fromJSON(jsonString)
    }
    this.exit()
  }

  clean () {
    GEUtils.cleanWindow()
    $('.controls-modal').hide()
  }

  exit () {
    this.clean()
    reset()
  }

  /* *********************** Add elements *********************************/

  addElement (className /*: string */) {
    const groupURL = $('#visualizer-select-group .faux-selection-value [data-value]').attr('data-value')
    const { width, height } = View.graphicRect
    const scale = Math.min(width, height)
    const { x, y } = new View.GraphicUnits().toSheetUnits() // upper-left corner of #graphic
    const element /*: {[key: string]: any} */= { x: x, y: y, w: 0.1 * scale, h: 0.1 * scale, groupURL: groupURL }
    if (className === 'RectangleElement') {
      className = 'TextElement'
      element.text = ''
      element.color = '#DDDDDD'
    } else if (className === 'TextElement') {
      element.text = 'Enter text'
      delete element.w
      delete element.h
    }
    Model.addElement(element, className)
    this.exit()
  }
}
