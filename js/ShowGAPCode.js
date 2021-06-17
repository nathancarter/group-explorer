// @flow
/* global $ DOMRect TouchEvent */

/*
 * The functions in this script file define how Group Explorer
 * displays and lets users interact with GAP code throughout
 * the application.
 */

import * as Library from './Library.js'
import Log from './Log.js'

/*::
import XMLGroup from './XMLGroup.js'
*/

/*
 * We give access to live GAP execution online through the
 * Sage Cell Server, at the following URL.
 */
const SageCellURL = 'https://sagecell.sagemath.org/static/embedded_sagecell.js'

/*
 * Define a few text constants for use below.
 */
const GAPlink = '<a target="_blank" href="help/rf-um-gap">What is GAP?</a>'

// purpose -> code map
// note that the code contains template string expressions which will be expanded
// when the code is wrapped in back tics '`' and eval'd in getCode
const codeForPurpose = new Map/*:: <string, string> */([
  ['creating this group',
   `# In GAP's Small Groups library, of all the groups
    # of order $\{ord}, this one is number $\{idx}:
    $\{G} := $\{gpdef};`],

  ['checking if a group is abelian',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is abelian:
    IsAbelian( $\{G} );`],

  ['computing the numbers in a class equation',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Get the sizes of all conjugacy classes:
    List( ConjugacyClasses( $\{G} ), Size );`],

  ['checking if a group is cyclic',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is cyclic:
    IsCyclic( $\{G} );`],

  ['getting the list of all subgroups of a group',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask for the list of subgroups:
    AllSubgroups( $\{G} );`],

  ['checking whether a subgroup is normal',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Pick a random subgroup as an example:
    S := Random( AllSubgroups( $\{G} ) );

    # Ask whether it is normal:
    IsNormal( $\{G}, S );`],

  ['getting the lattice of subgroups of a group',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask for the lattice of subgroups:
    LatticeSubgroups( $\{G} );

    # (See the GAP manual for how to manipulate the resulting object.)`],

  ['checking if a group is simple',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is simple:
    IsSimple( $\{G} );`],

  ['computing how many order classes a group has',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Compute all element orders and make a set of those results:
    Set( $\{G}, Order );`],

  ['checking if a group is solvable',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is solvable:
    IsSolvable( $\{G} );`]
])

const iframeSourceCode =
`<html>
  <head>
    <base href="${Library.getBaseURL()}">
    <style>
      body {
        margin: 0;
        overflow: hidden; /* prevents scroll bars on iframe content -- adjustSize changes size to fit content */
        touch-action: none; /* prevents browser scrolling while dragging iframe */
      }
      #gap-window {
        border: 3px solid blue;
        border-radius: 10px;
        padding: 10px;
        background-color: #e4e4e4;
        cursor: move;
      }
      #gap-window button {
        background-image: linear-gradient(#e0e0e0, #c0c0c0) !important;
        border: 1px solid #606060 !important;         
      }
      #gap-code-heading {
        margin: 0 0 10px;
      }
      #gap-link {
        position: absolute;
        top: 0;
        right: 0;
        margin: 1.5em 3em;
        font-size: 0.8em;
      }
      .sagecell_sessionOutput {
         background-color: white;
         cursor: auto;
      }
    </style>
    <script src="${SageCellURL}"></script>
    <script src="./js/ShowGAPCode.js" type="module"></script>
  </head>
  <body>
  </body>
</html>`

// executed in parent context: setup iframe in wrapper, invoke iframe routine to show code
export async function setup (purpose /*: string */, group /*: XMLGroup */) {
  const iframeElement = (($('#gap-iframe')[0] /*: any */) /*: HTMLIFrameElement */)

  // load iframe on first time through
  if (iframeElement.contentWindow.GAPCell == null) {
    $(iframeElement)
      .attr('srcdoc', eval('`' + iframeSourceCode + '`'))
      .css({
        'max-width': window.innerWidth,
        'max-height': window.innerHeight
      })

    await new Promise((resolve, reject) => {
      iframeElement.addEventListener('load', () => resolve(), { once: true })
    })
  }

  // get the GAP code to accomplish the purpose for this group and show it in iframeElement
  const code = getCode(purpose, group)
  iframeElement.contentWindow.GAPCell.show(purpose, code)
}

function getCode (purpose /*: string */, group /*: XMLGroup */) /*: string */ {
  // converting an arbitrary string to a JS identifier (not injective)
  function toIdent (str) {
    if (!/^[a-zA-Z_]/.test(str)) str = '_' + str
    return str.replace(/[^a-zA-Z0-9_]/g, '')
  }

  const G = toIdent(group.shortName)
  const [ord, idx] = group.gapid.split(',')
  const gpdef = `SmallGroup( ${ord}, ${idx} )`

  const code = ((codeForPurpose.get(purpose) /*: any */) /*: string */)
  const newCode = eval('`' + code.split('\n').map((line) => line.trim()).join('\n') + '`')

  return newCode
}

/***************************** Executed in iframe context ************************************/

class GAPCell {
  /*::
    listeners: Array<[MouseEventTypes | TouchEventTypes, (MouseEvent | TouchEvent) => void]>
    $iframe: JQuery
    iFrameSize: {width: float, height: float}
    startRect: DOMRect
    startDrag: {x: float, y: float}
    cellInfo: mixed
    textareaPad: number
  */
  constructor () {
    this.listeners = []
    this.$iframe = window.parent.$('#gap-iframe')
  }

  // display GAP code in window
  async show (purpose /*: string */, code /*: string */) {
    // close existing sagecell (if this isn't the first time through)
    this.closeSagecell()

    // create new #gap-window (any previous one is removed by sagecell.deleteSagecell)
    const display = $('<div id="gap-window"></div>').appendTo('body')[0]

    // create new sagecell loaded with input code
    await new Promise((resolve, reject) => {
      this.cellInfo = window.sagecell.makeSagecell({
        editor: 'textarea',
        inputLocation: display,
        evalButtonText: 'Run',
        languages: ['gap'],
        hide: ['language', 'fullScreen'],
        code: code,
        callback: () => resolve()
      })
    })

    // Add a heading containing the purpose
    $(`<h2 id="gap-code-heading">GAP code for ${purpose}</h2>`)
      .prependTo(display)

    // Add a link to the GE help page on GAP integration
    $(`<p id="gap-link">${GAPlink}</p>`)
      .prependTo(display)

    // Add an Exit button next the the Run button and make them look similar
    $('<button class="ui-button ui-corner-all ui-state-default">Exit</button>')
      .css('font-size', $('.sagecell_evalButton').css('font-size'))
      .appendTo($(display).find('.sagecell_input'))[0]
      .addEventListener('click', () => {
        this.closeSagecell()
        this.$iframe.hide()
      })

    /** check for body size change and adjust iframe size to match
     *
     *  note that we don't explicitly resize the iframe:
     *   if the size of the iframe content changes this routine changes the iframe to match
     *   this happens when the user explicitly resizes the textarea,
     *   and when a calculation is run and the results are presented (thus increasing
     *   the content size)
     */
    const adjustSize = (timeStamp) => {
      // calculate current frame size and padding around textarea on first time through
      if (this.iFrameSize == null) { // first time through?
        const currentRect = this.$iframe[0].getBoundingClientRect()
        this.iFrameSize = { width: currentRect.width, height: currentRect.height }
        // use offsetWidth to make sure we capture the effect of scroll bars
        this.textareaPad = window.innerWidth - $('textarea')[0].offsetWidth
      }
      const targetIFrameHeight = $('body').height() // body has no padding or border
      const $textarea = $('textarea.sagecell_commands')
      if ($textarea.length !== 0) {
        const targetIFrameWidth = $textarea[0].offsetWidth + this.textareaPad
        if (targetIFrameWidth !== this.iFrameSize.width || targetIFrameHeight !== this.iFrameSize.height) {
          this.$iframe.css({
            width: targetIFrameWidth,
            height: targetIFrameHeight
          })
          this.iFrameSize.width = targetIFrameWidth
          this.iFrameSize.height = targetIFrameHeight
        }
      }
      window.requestAnimationFrame(adjustSize)
    }
    window.requestAnimationFrame(adjustSize)

    this.$iframe.css('display', 'block')

    this.restartListeners()
  }

  closeSagecell () {
    if (this.cellInfo != null) {
      window.sagecell.deleteSagecell(this.cellInfo)
      this.cellInfo = null
    }
  }

  restartListeners () {
    this.removeEventListeners()
    this.addEventListeners('touchstart', 'mousedown')
  }

  addEventListeners (...eventTypes /*: Array<MouseEventTypes | TouchEventTypes> */) {
    const listener = (event /*: MouseEvent | TouchEvent */) => this.eventListener(event)
    eventTypes.forEach((eventType) => {
      this.listeners.push([eventType, listener])
      $('body')[0].addEventListener(eventType, listener)
    })
  }

  removeEventListeners () {
    while (this.listeners.length > 0) {
      const [eventType, listener] = this.listeners.pop()
      $('body')[0].removeEventListener(eventType, listener)
    }
  }

  eventListener (event /*: MouseEvent | TouchEvent */) {
    if (event instanceof TouchEvent &&
        ((event.type === 'touchstart' && event.touches.length !== 1) ||
         (event.type === 'touchmove' && event.touches.length !== 1) ||
         (event.type === 'touchend' && (event.changedTouches.length !== 1 || event.touches.length !== 0)))) {
      this.restartListeners()
    }

    // event stopPropagation, preventDefault?
    switch (event.type) {
      case 'mousedown':
        if (this.dragStart(((event /*: any */) /*: MouseEvent */))) {
          this.removeEventListeners()
          this.addEventListeners('mousemove', 'mouseup', 'mouseleave')
        }
        break
      case 'mousemove':
        this.drag(((event /*: any */) /*: MouseEvent */))
        event.preventDefault()
        break
      case 'mouseup':
        this.drag(((event /*: any */) /*: MouseEvent */))
        event.preventDefault()
        this.restartListeners()
        break
      case 'mouseleave':
        this.restartListeners()
        break
      case 'touchstart':
        if (this.dragStart(((event /*: any */) /*: TouchEvent */).touches[0])) {
          event.preventDefault()
          this.addEventListeners('touchmove', 'touchend')
        }
        break
      case 'touchmove':
        event.preventDefault()
        this.drag(((event /*: any */) /*: TouchEvent */).touches[0])
        break
      case 'touchend':
        event.preventDefault()
        this.drag(((event /*: any */) /*: TouchEvent */).changedTouches[0])
        this.restartListeners()
        break
      default:
        Log.info(`unexpected event type ${event.type} in GAPCell`)
        break
    }
  }

  dragStart ({ clientX, clientY, target }) {
    if ($(target).css('cursor') !== 'move') {
      return false
    }
    this.startRect = DOMRect.fromRect(((this.$iframe[0].getBoundingClientRect() /*: any */) /*: DOMRect */))
    this.startDrag = { x: clientX + this.startRect.left, y: clientY + this.startRect.top }
    return true
  }

  drag ({ clientX, clientY }) {
    const { left, top } = this.$iframe[0].getBoundingClientRect()
    const currentPosition = { x: clientX + left, y: clientY + top }
    const movement = { x: currentPosition.x - this.startDrag.x, y: currentPosition.y - this.startDrag.y }
    const x = movement.x + this.startRect.x
    const y = movement.y + this.startRect.y
    this.$iframe.css({ left: x, top: y })
  }
}

// copy a new GAPCell instance to the iframe window (iframe.contentWindow, to the parent)
// the parent invokes the GAPCell.show() in the iframe to change its content
if (window.parent !== window) {
  // $FlowFixMe
  window.GAPCell = new GAPCell()
}
