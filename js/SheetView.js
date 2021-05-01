// @flow

/* global $ DOMRect MouseEvent ResizeObserver TouchEvent Touch */

import { THREE } from '../lib/externals.js'
import * as SheetModel from './SheetModel.js'

export const Graphic /*: HTMLElement */ = $('#graphic')[0]
export let graphicRect /*: DOMRect */ = new DOMRect(0, 0, 0, 0)
export let PixelsPerModelUnit /*: float */ = 0
export let zoomFactor /*: float */ = 1
export let panVector /*: PhysicalUnits */ // pan expressed in window pixels

export class PhysicalUnits extends THREE.Vector2 {
  /*::
    // Expose THREE.Vector2 methods to Flow as outputting a PhysicalUnits type,

    // $FlowFixMe
    multiplyScalar: (float) => PhysicalUnits
  */
  toLogicalUnits () /*: LogicalUnits */ {
    return new LogicalUnits(this.x, this.y).multiplyScalar(1 / zoomFactor)
  }
}

export class LogicalUnits extends THREE.Vector2 {
  /*::
    // $FlowFixMe
    multiplyScalar: (float) => LogicalUnits
  */
  toPhysicalUnits () /*: PhysicalUnits */ {
    return new PhysicalUnits(this.x, this.y).multiplyScalar(zoomFactor)
  }
}

export class WindowUnits extends PhysicalUnits {
  /*::
    // $FlowFixMe
    add: (PhysicalUnits) => WindowUnits
    // $FlowFixMe
    clone: () => WindowUnits
    // $FlowFixMe
    multiplyScalar: (float) => WindowUnits
    // $FlowFixMe
    sub: (PhysicalUnits) => WindowUnits
  */
  constructor (
    arg1 /*: ?number | MouseEvent | TouchEvent | Touch | WindowUnits | DOMRect |  THREE.Vector2 */,
    y /*: ?number */
  ) {
    (typeof arg1 === 'number' && typeof y === 'number') ? super(arg1, y) : super()
    if (arg1 != null) {
      if (y == null) {
        if (arg1 instanceof MouseEvent || arg1 instanceof Touch) {
          this.set(arg1.clientX, arg1.clientY)
        } else if (arg1 instanceof TouchEvent) {
          if (arg1.type === 'touchend') {
            this.set(arg1.changedTouches[0].clientX, arg1.changedTouches[0].clientY)
          } else if (arg1.touches.length === 1) {
            this.set(arg1.touches[0].clientX, arg1.touches[0].clientY)
          } else { // average position of touches
            this.set(...Array.from(arg1.touches)
              .reduce(([x, y], touch) => [x + touch.clientX, y + touch.clientY], [0, 0])
              .map((pos) => pos / arg1.touches.length))
          }
        } else if (arg1 instanceof THREE.Vector2) {
          this.set(arg1.x, arg1.y)
        } else if (arg1 instanceof DOMRect) {
          this.set(arg1.x, arg1.y)
        }
      }
    }
  }

  toGraphicUnits () /*: GraphicUnits */ {
    return new GraphicUnits(this.x, this.y).sub(new GraphicUnits(graphicRect.x, graphicRect.y))
  }

  toSheetUnits () /*: SheetUnits */ {
    return this.toGraphicUnits().toSheetUnits()
  }
}

export class GraphicUnits extends PhysicalUnits {
  /*::
    // $FlowFixMe
    add: (PhysicalUnits) => GraphicUnits
    // $FlowFixMe
    clone: () => GraphicUnits
    // $FlowFixMe
    multiplyScalar: (float) => GraphicUnits
    // $FlowFixMe
    set: (float, float) => GraphicUnits
    // $FlowFixMe
    sub: (PhysicalUnits) => GraphicUnits
  */
  toWindowUnits () /*: WindowUnits */ {
    return new WindowUnits(this.x, this.y)
      .add(new PhysicalUnits(graphicRect.x, graphicRect.y))
  }

  toSheetUnits () /*: SheetUnits */ {
    const thisAsSheet = this.clone()
      .sub(panVector)
      .sub(graphicPOV())
      .multiplyScalar(1 / zoomFactor)
      .add(graphicPOV())

    return new SheetUnits(thisAsSheet.x, thisAsSheet.y)
  }
}

export class SheetUnits extends LogicalUnits {
  /*::
    // $FlowFixMe
    add: (LogicalUnits) => SheetUnits
    // $FlowFixMe
    applyMatrix3: (THREE.Matrix3) => SheetUnits
    // $FlowFixMe
    addScaledVector: (LogicalUnits, float) => SheetUnits
    // $FlowFixMe
    addVectors: (SheetUnits, SheetUnits) => SheetUnits
    // $FlowFixMe
    clone: () => SheetUnits
    // $FlowFixMe
    lerpVectors: (SheetUnits, SheetUnits, float) => SheetUnits
    // $FlowFixMe
    multiplyScalar: (float) => SheetUnits
    // $FlowFixMe
    sub: (LogicalUnits) => SheetUnits
  */
  toGraphicUnits () /*: GraphicUnits */ {
    return new GraphicUnits(this.x, this.y)
      .sub(graphicPOV())
      .multiplyScalar(zoomFactor)
      .add(graphicPOV())
      .add(panVector)
  }

  toWindowUnits () /*: WindowUnits */ {
    return this.toGraphicUnits().toWindowUnits()
  }
}

export function init () {
  graphicRect = ((Graphic.getBoundingClientRect() /*: any */) /*: DOMRect */)
  PixelsPerModelUnit = Math.min(graphicRect.width, graphicRect.height)
  panVector = new PhysicalUnits()

  new ResizeObserver((entries) => {
    if (entries.findIndex((entry) => entry.target.id === 'graphic') !== -1) {
      graphicRect = ((Graphic.getBoundingClientRect() /*: any */) /*: DOMRect */)
    }
  }).observe($('#graphic')[0])
}

function graphicPOV () /*: GraphicUnits */ {
  const pov = new GraphicUnits(graphicRect.width, graphicRect.height).multiplyScalar(0.5)
  return pov
}

export function createViewElement (modelElement /*: SheetModel.SheetElement */) /*: SheetView */ {
  return new (eval(modelElement.className.replace('Element', 'View')))(modelElement)
}

// pan Sheet by {dx, dy} WindowUnits
export function pan (dx /*: float */, dy /*: float */) {
  panVector.set(panVector.x + dx, panVector.y + dy)
  updateTransforms()
}

export function zoom (scaleFactor /*: float */) {
  zoomFactor *= scaleFactor
  updateTransforms()
}

export function redrawAll () {
  graphicRect = ((Graphic.getBoundingClientRect() /*: any */) /*: DOMRect */)
  PixelsPerModelUnit = Math.min(graphicRect.width, graphicRect.height)

  panVector.set(0, 0)
  zoomFactor = 1
  updateTransforms()

  SheetModel.sheetElements.forEach((modelElement /*: SheetModel.SheetElement */) => {
    if (modelElement instanceof SheetModel.LinkElement) {
      modelElement.viewElement.redraw()
    }
  })

  setTimeout(() => redrawNodes(), 0)
}

function updateTransforms () {
  SheetModel.sheetElements.forEach((modelElement /*: SheetModel.SheetElement */) => {
    modelElement.viewElement.updateTransform()
  })
}

export function redrawNodes () {
  $('.NodeElement').each((_inx, el) => {
    const htmlElement = ((el /*: any */) /*: HTMLElement */)
    const modelElement = ((SheetModel.sheetElements.get(htmlElement.id) /*: any */) /*: SheetModel.SheetElement */)
    modelElement.viewElement.redraw()
  })
}

function makeCssTransform (
  scale /*: THREE.Vector2 | float */ = new THREE.Vector2(1, 1),
  direction /*: THREE.Vector2 */ = new THREE.Vector2(1, 0),
  position /*: GraphicUnits | SheetUnits */ = new GraphicUnits() // Pixels of the transform's reference
) /*: string */ {
  scale = (typeof scale === 'number') ? new THREE.Vector2(scale, scale) : scale
  return `matrix(${scale.x * direction.x}, ${scale.x * direction.y},
                 ${-scale.y * direction.y}, ${scale.y * direction.x},
                 ${position.x}, ${position.y})`
}

export class SheetView {
  /*::
    +modelElement: SheetModel.SheetElement
    +domElement: HTMLElement
  */
  constructor (modelElement /*: SheetModel.SheetElement */, domElement /*: HTMLElement */ = $('<div>')[0]) {
    this.modelElement = modelElement

    this.domElement = $(domElement)
      .attr('id', this.modelElement.id)
      .addClass(this.modelElement.className)
      .css({
        position: 'absolute',
        left: 0,
        top: 0,
        'z-index': modelElement.z,
        'transform-origin': 'top left'
      })
      .appendTo(Graphic)[0]
  }

  // redraw element
  redraw () { /* implemented by subclass */ }

  // retransform element to position and scale
  updateTransform () { /* implemented by subclass */ }

  destroy () {
    $(this.domElement).remove()
  }

  updateZ () {
    if (parseInt($(this.domElement).css('z-index')) !== this.modelElement.z) {
      $(this.domElement).css('z-index', this.modelElement.z)
    }
  }
}

export class NodeView extends SheetView {
  /*::
    +modelElement: SheetModel.NodeElement
  */
  constructor (modelElement /*: SheetModel.NodeElement */, domElement /*: HTMLElement */) {
    super(modelElement, domElement)

    $(this.domElement)
      .addClass('draggable NodeElement')
  }

  get center () /*: SheetUnits */ {
    return this.modelElement.position.addScaledVector(this.modelElement.size, 0.5)
  }

  get rect () /*: DOMRect */ {
    return new DOMRect(...this.position.toArray(), ...this.size.toArray())
  }

  get position () /*: SheetUnits */ {
    return this.modelElement.position
  }

  get size () /*: LogicalUnits */ {
    return this.modelElement.size
  }
}

export class RectangleView extends NodeView {
  /*::
    +modelElement: SheetModel.RectangleElement
    color: color
  */
  constructor (modelElement /*: SheetModel.RectangleElement */, domElement /*: HTMLElement */) {
    super(modelElement, domElement)

    this.redraw()
  }

  updateTransform () {
    $(this.domElement).css('transform', makeCssTransform(zoomFactor, undefined, this.position.toGraphicUnits()))
  }

  redraw () {
    this.color = this.modelElement.color
    $(this.domElement)
      .css({
        width: this.size.x,
        height: this.size.y,
        'background-color': this.modelElement.color
      })

    this.updateTransform()
  }
}

const TEXT_PADDING = 10
export class TextView extends NodeView {
  /*::
    +modelElement: SheetModel.TextElement
  */
  constructor (modelElement /*: SheetModel.TextElement */, domElement /*: HTMLElement */) {
    super(modelElement, domElement)
    this.redraw()
    this.updateZ()
  }

  updateTransform () {
    $(this.domElement).css('transform', makeCssTransform(zoomFactor, undefined, this.position.toGraphicUnits()))
  }

  redraw () {
    // combine color and opacity into an rgba color for transparent/translucent colors
    const background = new THREE.Color(this.modelElement.color)
    const backgroundCss = (this.modelElement.opacity === 1)
      ? '#' + background.getHexString()
      : `rgba(${background.r * 100}%, ${background.g * 100}%, ${background.b * 100}%, ${this.modelElement.opacity * 100}%)`

    // simple case: just a rectangle
    if (this.modelElement.text === '') {
      $(this.domElement)
        .css({
          width: this.modelElement.w,
          height: this.modelElement.h,
          'background-color': backgroundCss,
          padding: 0,
          'min-height': ''
        })
        .text('')

      this.updateTransform()

      return
    }

    $(this.domElement)
      .css({
        width: (this.modelElement.w == null) ? 'auto' : this.modelElement.w - 2 * TEXT_PADDING,
        height: (this.modelElement.h == null) ? 'auto' : this.modelElement.h,
        'background-color': backgroundCss,
        color: this.modelElement.fontColor,
        'font-size': this.modelElement.fontSize,
        'text-align': this.modelElement.alignment,
        padding: `0 ${TEXT_PADDING}px`
      })

    if (this.modelElement.isPlainText) {
      $(this.domElement).text(this.modelElement.text)
    } else {
      $(this.domElement).html(this.modelElement.text)
    }

    // Ensure that element background is at least big enough to cover text
    const range = document.createRange()
    range.selectNodeContents(this.domElement)
    const clientRects = Array.from(range.getClientRects())
    const [xMin, xMax, yMin, yMax] = clientRects.reduce(
      ([xMin, xMax, yMin, yMax], { left, right, top, bottom }) =>
        [Math.min(xMin, left), Math.max(xMax, right), Math.min(yMin, top), Math.max(yMax, bottom)],
      [Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE])
    const textWidth = xMax - xMin
    const textHeight = yMax - yMin

    this.modelElement.w = Math.max(this.modelElement.w || 0, textWidth + 2 * TEXT_PADDING)

    let verticalPadding = TEXT_PADDING
    if (this.modelElement.h == null) {
      this.modelElement.h = textHeight + 2 * TEXT_PADDING
    } else {
      if ((this.modelElement.h - 2 * TEXT_PADDING) * zoomFactor <= textHeight) {
        this.modelElement.h = (textHeight + 2 * TEXT_PADDING) / zoomFactor
      } else {
        verticalPadding = (this.modelElement.h - textHeight / zoomFactor) / 2
      }
    }
    $(this.domElement).css({
      width: this.modelElement.w - 2 * TEXT_PADDING,
      height: this.modelElement.h - 2 * verticalPadding,
      'min-height': textHeight,
      padding: `${verticalPadding}px ${TEXT_PADDING}px`
    })

    this.updateTransform()
  }
}

export class VisualizerView extends NodeView {
  /*::
   +modelElement: SheetModel.VisualizerElement
   +domElement: HTMLCanvasElement
    unitSquarePositions: Array<THREE.Vector2>
    lastZoom: float
  */
  constructor (modelElement /*: SheetModel.VisualizerElement */, domElement /*: HTMLElement */) {
    super(modelElement, domElement)

    $(this.domElement)
      .addClass('VisualizerElement')
  }

  updateTransform () {
    const transformZoom = zoomFactor / this.lastZoom
    $(this.domElement).css('transform', makeCssTransform(transformZoom, undefined, this.position.toGraphicUnits()))
  }

  redraw () {
    this.lastZoom = zoomFactor
    this.updateTransform()

    this.modelElement.visualizer.setSize(this.size.x * zoomFactor, this.size.y * zoomFactor)
    this.modelElement.visualizer.showGraphic()
    this.unitSquarePositions = this.modelElement.visualizer.unitSquarePositions()
  }
}

export class CGView extends VisualizerView {
  /*::
    +modelElement: SheetModel.CGElement
  */
  constructor (modelElement /*: SheetModel.CGElement */) {
    super(modelElement, modelElement.visualizer.canvas)
    this.redraw()
  }
}

export class MTView extends VisualizerView {
  /*::
    +modelElement: SheetModel.MTElement
  */
  constructor (modelElement /*: SheetModel.MTElement */) {
    super(modelElement, modelElement.visualizer.canvas)
    this.redraw()
  }
}

export class CDView extends VisualizerView {
  /*::
    +modelElement: SheetModel.CDElement
  */
  constructor (modelElement /*: SheetModel.CDElement */) {
    super(modelElement, $('<canvas>')[0])
    this.redraw()
  }

  redraw () {
    this.lastZoom = zoomFactor
    this.updateTransform()

    const size = this.size.clone().multiplyScalar(zoomFactor)

    $(this.domElement)
      .attr({ width: size.width, height: size.height })

    const context = this.domElement.getContext('2d')
    const visualizer = this.modelElement.visualizer
    visualizer.setSize(size.width, size.height)
    visualizer.render()
    context.drawImage(visualizer.renderer.domElement, 0, 0)

    this.unitSquarePositions = this.modelElement.visualizer.unitSquarePositions()
  }
}

const LINE_LEN = 4 // 2 causes problems with Chrome zooming, don't know why

class Arrow {
  /*::
    static PIXELS_PER_INCH: number
    line: HTMLCanvasElement
    head: HTMLCanvasElement
    lineWidth: float
    color: color
  */
  constructor (container /*: HTMLElement */, lineWidth /*: number */ = 1, color /*: color */ = 'black') {
    this.line = (($('<canvas>')
      .attr({ width: `${LINE_LEN}px` })
      .css({
        position: 'absolute',
        left: `-${LINE_LEN / 2}px`,
        width: `${LINE_LEN}px`,
        'pointer-events': 'auto'
      })
      .appendTo(container)[0] /*: any */) /*: HTMLCanvasElement */)

    this.head = (($('<canvas>')
      .attr({
        width: '90px',
        height: '31px'
      })
      .css({
        position: 'absolute',
        width: '90px',
        height: '31px',
        left: '-30px',
        top: '-16px',
        'transform-origin': '30px 16px',
        'pointer-events': 'auto'
      })
      .appendTo(container)[0] /*: any */) /*: HTMLCanvasElement */)

    if (Arrow.PIXELS_PER_INCH == null) {
      $(this.line).css('height', '1in')
      Arrow.PIXELS_PER_INCH = $(this.line)[0].getBoundingClientRect().height
    }

    this.drawBase(lineWidth, color)
  }

  drawBase (lineWidth /*: float */, color /*: color */) {
    if (this.lineWidth === lineWidth && this.color === color) {
      return
    }

    const ACTIVE_WIDTH = Math.ceil(Arrow.PIXELS_PER_INCH / 20) * 2
    const contextHeight = Math.max(ACTIVE_WIDTH, lineWidth)

    $(this.line)
      .attr({ height: `${contextHeight}px` })
      .css({
        height: `${contextHeight}px`,
        top: `${-contextHeight / 2}px`,
        'transform-origin': `${LINE_LEN / 2}px ${contextHeight / 2}px)`
      })

    this.lineWidth = lineWidth
    this.color = color

    const lineContext = this.line.getContext('2d')
    lineContext.clearRect(0, 0, LINE_LEN, contextHeight)
    lineContext.strokeStyle = color
    lineContext.lineWidth = lineWidth
    lineContext.beginPath()
    lineContext.moveTo(0, Math.ceil(contextHeight / 2))
    lineContext.lineTo(LINE_LEN, Math.ceil(contextHeight / 2))
    lineContext.stroke()

    const headContext = this.head.getContext('2d')
    headContext.clearRect(0, 0, 90, 31)
    headContext.fillStyle = color
    headContext.beginPath()
    headContext.moveTo(0, 0)
    headContext.lineTo(90, 16)
    headContext.lineTo(0, 31)
    headContext.closePath()
    headContext.fill()
  }

  update (start /*: SheetUnits */, end /*: SheetUnits */, lineWidth /*: number */ = 1, headOffset /*: float */ = 1, color /*: color */ = 'black') {
    this.drawBase(lineWidth, color)

    const hasArrowhead = $(this.head).css('display') !== 'none'
    const direction = end.clone().sub(start).normalize()

    // draw arrowhead halfway between source and destination edges, not halfway between centers
    if (hasArrowhead) {
      const lineLength = start.distanceTo(end)
      const headWidth = Math.sqrt(lineWidth * (lineWidth + 0.1 * lineLength)) + lineWidth
      const headLength = 3 * headWidth

      if (headOffset === 1) {
        const headFraction = headLength / lineLength
        end = new SheetUnits().lerpVectors(start, end, 1 - headFraction)
        headOffset = 1 + headFraction / (3 * (1 - headFraction))
      }

      const headScale = new THREE.Vector2(headLength / 90, headWidth / 31)
      const headCenter = new SheetUnits().lerpVectors(start, end, headOffset)

      $(this.head).css('transform', makeCssTransform(headScale, direction, headCenter))
    }

    const lineLength = start.distanceTo(end)
    const lineCenter = new SheetUnits().addVectors(start, end).multiplyScalar(0.5)
    const lineScale = new THREE.Vector2(lineLength / LINE_LEN, 1)
    $(this.line).css('transform', makeCssTransform(lineScale, direction, lineCenter))
  }
}

export class LinkView extends SheetView {
  /*::
    +modelElement: SheetModel.LinkElement
  */
  constructor (modelElement /*: SheetModel.LinkElement */) {
    super(modelElement)
    $(this.domElement).addClass('LinkElement')
  }

  get destination () {
    return this.modelElement.destination
  }

  get destinationView () {
    return this.destination.viewElement
  }

  get source () {
    return this.modelElement.source
  }

  get sourceView () {
    return this.source.viewElement
  }

  getCrossingEndpoints () /*: [SheetUnits, SheetUnits] */ {
    const source = this.source
    const destination = this.destination

    const sourceCenter = source.position.addScaledVector(source.size, 0.5)
    const destinationCenter = destination.position.addScaledVector(destination.size, 0.5)

    const entryInterpolationFactor = Math.min(
      Math.abs(source.size.x / (2 * (destinationCenter.x - sourceCenter.x))),
      Math.abs(source.size.y / (2 * (destinationCenter.y - sourceCenter.y))))
    const entry =
      new SheetUnits().lerpVectors(sourceCenter, destinationCenter, entryInterpolationFactor)

    const exitInterpolationFactor = Math.min(
      Math.abs(destination.size.x / (2 * (destinationCenter.x - sourceCenter.x))),
      Math.abs(destination.size.y / (2 * (destinationCenter.y - sourceCenter.y))))
    const exit =
      new SheetUnits().lerpVectors(destinationCenter, sourceCenter, exitInterpolationFactor)

    return [entry, exit]
  }
}

/* Connector is constructed from a <div> containing a single Arrow */
export class ConnectingView extends LinkView {
  /*::
    +modelElement: SheetModel.ConnectingElement
    arrow: Arrow
  */
  constructor (modelElement /*: SheetModel.ConnectingElement */) {
    super(modelElement)

    $(this.domElement)
      .appendTo(Graphic)

    this.arrow = new Arrow(this.domElement, modelElement.thickness, modelElement.color)

    this.redraw()
  }

  updateTransform () {
    $(this.domElement).css('transform', makeCssTransform(zoomFactor, undefined, new SheetUnits().toGraphicUnits()))
  }

  redraw () {
    const start = this.sourceView.center
    const end = this.destinationView.center

    if (this.modelElement.hasArrowhead) {
      $(this.arrow.head).show()

      const headLocation = new SheetUnits().addVectors(...this.getCrossingEndpoints()).multiplyScalar(0.5)
      const headOffset = start.distanceTo(headLocation) / start.distanceTo(end)
      this.arrow.update(start, end, this.modelElement.thickness, headOffset, this.modelElement.color)
    } else {
      $(this.arrow.head).hide()

      this.arrow.update(start, end, this.modelElement.thickness, undefined, this.modelElement.color)
    }
  }
}

/* MorphismElements are constructed from a <div> containing:
 *    a <div> showing text information about the morphism (like its name), and which serves as the selection target
 *    a single Arrow from the source group visualizer to the target (showManyArrows = false)
 *    an Array of Arrows from each element in the source visualizer to its mapping in the target (showManyArrows = true)
 */
export class MorphismView extends LinkView {
  /*::
    +modelElement: SheetModel.MorphismElement
    label: HTMLElement
    arrow: Arrow
    arrows: Array<Arrow>
    position: SheetUnits
    labelContent: html
  */
  constructor (modelElement /*: SheetModel.MorphismElement */) {
    super(modelElement)

    $(this.domElement).css({
      'pointer-events': 'none'
    })

    this.label = $('<div>')
      .css('width', 'auto')
      .css('height', 'auto')
      .css('background-color', 'white')
      .css('border', '2px solid black')
      .css('padding', '5px 10px')
      .css('color', 'black')
      .css('font-size', '16px')
      .css('text-align', 'center')
      .css('white-space', 'nowrap')
      .css('position', 'absolute')
      .css('pointer-events', 'auto')
      .css('transform-origin', 'top left')
      .css('z-index', 1)
      .appendTo(this.domElement)[0]

    this.redraw()
  }

  updateTransform () {
    const source = this.source
    const destination = this.destination
    this.position = new SheetUnits(Math.min(source.x, destination.x), Math.min(source.y, destination.y))

    $(this.domElement).css('transform', makeCssTransform(zoomFactor, undefined, this.position.toGraphicUnits()))
  }

  redraw () {
    this.updateTransform()

    this.drawLabel()

    if (this.modelElement.showManyArrows) {
      this.drawManyLines()
    } else {
      this.drawSingleLine()
    }
  }

  drawLabel () {
    const modelLabel = this.modelElement.getLabel()
    if (this.labelContent !== modelLabel) {
      this.labelContent = modelLabel
      $(this.label).html(modelLabel)
    }

    const [entry, exit] = this.getCrossingEndpoints().map((v) => v.sub(this.position))
    const center = new SheetUnits().addVectors(entry, exit).multiplyScalar(0.5)
    const labelSize = new LogicalUnits(this.label.offsetWidth, this.label.offsetHeight) // note label size is as zoomed
    const topLeftCorner = center.clone().addScaledVector(labelSize, -0.5)

    $(this.label)
      .css('transform', makeCssTransform(1, undefined, topLeftCorner))
  }

  drawSingleLine () {
    const LINE_WIDTH = 4
    const LINE_COLOR = 'black'

    // create main arrow if it doesn't exist
    if (this.arrow === undefined) {
      this.arrow = new Arrow(this.domElement, LINE_WIDTH, LINE_COLOR)
    }

    // make sure to display arrow
    $(this.arrow.line).show()
    $(this.arrow.head).show()

    // hide mapping arrows, if they exist and aren't hidden
    if (this.arrows !== undefined && $(this.arrows[0].line).css('display') !== 'none') {
      for (const { line, head } of this.arrows.values()) {
        $(line).hide()
        $(head).hide()
      }
    }

    // make sure z-index of main arrow is under starting visualizer to terminate it cleanly
    if (parseInt($(this.domElement).css('z-index')) !== this.modelElement.z) {
      $(this.domElement).css('z-index', this.modelElement.z)
    }

    const [enter, exit] = this.getCrossingEndpoints().map((v) => v.sub(this.position))
    const lineLength = enter.distanceTo(exit)
    const padding = LINE_WIDTH + 0.5 * Math.sqrt(0.1 * LINE_WIDTH * lineLength)
    const paddingRatio = padding / lineLength
    const start = new SheetUnits().lerpVectors(enter, exit, -paddingRatio)
    this.arrow.update(start, exit, LINE_WIDTH, undefined, LINE_COLOR)
  }

  drawManyLines () {
    const LINE_WIDTH = 1
    const LINE_COLOR = 'black'

    const source = ((this.source /*: any */) /*: SheetModel.VisualizerElement */)
    const destination = ((this.destination /*: any */) /*: SheetModel.VisualizerElement */)

    // create mapping arrows if they don't exist
    if (this.arrows === undefined) {
      this.arrows = Array.from(
        { length: ((source /*: any */) /*: SheetModel.VisualizerElement */).group.order },
        () => new Arrow(this.domElement, LINE_WIDTH, LINE_COLOR)
      )
    }

    // display mapping arrows if they're hidden
    if ($(this.arrows[0].line).css('display') === 'none') {
      this.arrows.forEach((arrow) => {
        $(arrow.line).show()
        $(arrow.head).show()
      })
    }

    // hide main arrow, if it exists
    if (this.arrow != null) {
      $(this.arrow.line).hide()
      $(this.arrow.head).hide()
    }

    // make sure z-index of arrows displays them on top of the visualizers
    if (parseInt($(this.domElement).css('z-index')) !== this.modelElement.z) {
      $(this.domElement).css('z-index', this.modelElement.z)
    }

    // get mapping
    const mapping = this.modelElement.getMapping()

    // get unitSquarePosition for source and destination visualizers
    const sources = source.viewElement.unitSquarePositions
    const destinations = destination.viewElement.unitSquarePositions

    // get transforms from visualizer unit squares to sheet
    const sourceRect = this.sourceView.rect
    const sourceToSheet = new THREE.Matrix3().set(
      sourceRect.width, 0, sourceRect.left - this.position.x,
      0, sourceRect.height, sourceRect.top - this.position.y,
      0, 0, 1)

    const destinationRect = this.destinationView.rect
    const destinationToSheet = new THREE.Matrix3().set(
      destinationRect.width, 0, destinationRect.left - this.position.x,
      0, destinationRect.height, destinationRect.top - this.position.y,
      0, 0, 1)

    // get offset distance for arrowMargin
    let offsetDistance = 0
    if (this.modelElement.arrowMargin !== 0) {
      const sourceCenter = source.position.clone().addScaledVector(source.size, 0.5)
      const destinationCenter = destination.position.clone().addScaledVector(destination.size, 0.5)
      const centerToCenter = sourceCenter.sub(destinationCenter).length()
      offsetDistance = this.modelElement.arrowMargin * centerToCenter
    }

    // update arrow from each source group element
    for (let inx = 0; inx < source.group.order; inx++) {
      // for each source & destination, transform from visualizer unit square to sheet
      let start = new SheetUnits(...sources[inx].toArray()).applyMatrix3(sourceToSheet)
      let end = new SheetUnits(...destinations[mapping[inx]].toArray()).applyMatrix3(destinationToSheet)

      // adjust start & end if there is an offset
      if (offsetDistance !== 0) {
        const offsetPercentage = offsetDistance / start.distanceTo(end);
        // $FlowFixMe -- syntax unsupported by Flow
        [start, end] = [
          new SheetUnits().lerpVectors(start, end, offsetPercentage),
          new SheetUnits().lerpVectors(end, start, offsetPercentage)
        ]
      }

      // update arrow
      this.arrows[inx].update(start, end, LINE_WIDTH, undefined, LINE_COLOR)
    }
  }
}

// Draw black cross with 100px arms at (x, y) pixels in domElement
export function testCross (
  x /*: float */,
  y /*: float */,
  domElement /*: HTMLElement */ = Graphic,
  color /*: color */ = 'black'
) /*: HTMLCanvasElement */ {
  const canvas = (($('<canvas class="TestCross">')
    .css('position', 'absolute')
    .css('pointer-events', 'none')
    .css('left', 0)
    .css('top', 0)
    .attr('width', '200px')
    .attr('height', '200px')
    .css('transform', `translate(${x - 100}px, ${y - 100}px)`)
    .css('z-index', 10000)
    .css('background-color', 'rgba(0,0,0,0)')
    .appendTo(domElement)[0] /*: any */) /*: HTMLCanvasElement */)

  const context = canvas.getContext('2d')
  context.lineWidth = 1
  context.strokeStyle = color
  context.beginPath()
  context.moveTo(0, 100)
  context.lineTo(200, 100)
  context.moveTo(100, 0)
  context.lineTo(100, 200)
  context.stroke()

  return canvas
}
