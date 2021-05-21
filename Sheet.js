// @flow

/* global $ */

// import Log from './js/Log.js'
// import * as Version from './Version.js'

import * as VC from './visualizerFramework/visualizer.js'

import * as SheetModel from './js/SheetModel.js'
import * as SheetView from './js/SheetView.js'
import * as SheetController from './js/SheetController.js'

export { load }

// Globals
const HELP_PAGE /*: string */ = 'help/rf-um-sheetwindow/index.html'

async function load () {
  // load upper-right corner buttons
  await VC.load(null, HELP_PAGE)
  $('#find-group').remove()
  $('#hide-controls').attr('onclick', 'VC.hideControls("#control-panel")')
  $('#show-controls').attr('onclick', 'VC.showControls("#control-panel")')

  // initialize Sheet components
  SheetView.init()
  await SheetModel.init()
  SheetController.init()

  // check for passedSheet in URL, load it if present
  const invokeParameters = new URL(window.location.href).searchParams
  if (invokeParameters.get('passedSheet') != null) {
    SheetModel.loadPassedSheet()
  } else if (invokeParameters.get('demo') != null) {
    demo()
  }
}

function demo () {
  const rect = $('#graphic')[0].getBoundingClientRect()
  const scale = Math.min(rect.width, rect.height)

  const jsonObject = [
/*
    {
      id: 'Rectangle',
      className: 'RectangleElement',
      x: 0.1 * scale,
      y: 0.3 * scale,
      w: 0.05 * scale,
      h: 0.1 * scale,
      color: 'red'
    },
*/
    {
      id: 'Rectangle 1',
      className: 'TextElement',
      x: 0.1 * scale,
      y: 0.3 * scale,
      w: 0.05 * scale,
      h: 0.1 * scale,
      color: 'red'
    },

    {
      id: 'Rectangle 2',
      className: 'TextElement',
      x: 0.5 * scale,
      y: 0.2 * scale,
      w: 0.05 * scale,
      h: 0.1 * scale,
      color: 'blue'
    },

    {
      id: 'TextBox',
      className: 'TextElement',
      x: 0.4 * scale,
      y: 0.4 * scale,
      w: 0.25 * scale,
      fontSize: '32pt',
      fontColor: 'blue',
      text: 'HTML displayed on semi-transparent background:<br><i>H</i><sub>2</sub> = a<sup>2</sup>',
      alignment: 'center',
      color: 'aqua',
      opacity: 0.2 // semi-transparent
    },

    {
      id: 'CycleGraph',
      className: 'CGElement',
      x: 0.2 * scale,
      y: 0.6 * scale,
      w: 0.1 * scale,
      h: 0.1 * scale,
      groupURL: './groups/S_3.group'
    },

    {
      id: 'Multtable',
      className: 'MTElement',
      x: 0.5 * scale,
      y: 0.8 * scale,
      w: 0.15 * scale,
      h: 0.15 * scale,
      groupURL: './groups/S_3.group'
    },

    {
      id: 'CayleyDiagram',
      className: 'CDElement',
      x: 0.75 * scale,
      y: 0.5 * scale,
      w: 0.2 * scale,
      h: 0.2 * scale,
      groupURL: './groups/S_3.group'
    },

    {
      id: 'Connector',
      className: 'ConnectingElement',
      sourceId: 'Rectangle 1',
      destinationId: 'Rectangle 2',
      color: 'black',
      thickness: 5,
      hasArrowhead: true
    },

    {
      id: 'Morphism',
      className: 'MorphismElement',
      name: 'g',
      sourceId: 'Multtable',
      destinationId: 'CayleyDiagram',
      definingPairs: [[1, 2], [3, 5]],
      showDefiningPairs: true,
      showDomainAndCodomain: true,
      showInjectionSurjection: false,
      showManyArrows: true
    }

  ]

  SheetModel.fromJSONObject(jsonObject)
}
