// @flow

/* global localStorage */

// final: keep list of pages that need to be loaded, make reference from Library to Migration to load module
// GE-version -> Version
// GE-todo -> space-separated page files (like GroupInfo.html)

// $FlowFixMe -- flow doesn't recognize the Version module because of the query string
import { Version } from '../Version.js?version=3.2.0' // use query string to make sure we get the latest Version

const pagesToReload = [
  'CayleyDiagram.html',
  'CycleGraph.html',
  'GroupExplorer.html',
  'GroupInfo.html',
  'Multtable.html',
  'Sheet.html',
  'SymmetryObject.html'
]

const filesToReload = [
  'html/AbelianInfo.html',
  'html/CayleyDiagramController.html',
  'html/CayleyViewController.html',
  'html/ClassEquationInfo.html',
  'html/CyclicInfo.html',
  'html/OrderClassesInfo.html',
  'html/SolvableInfo.html',
  'html/SubgroupInfo.html',
  'html/SubsetHighlightController.html',
  'html/ZmnInfo.html',
  'CayleyDiagram.js',
  'CycleGraph.js',
  'GroupExplorer.js',
  'GroupInfo.js',
  'GroupURLs.js',
  'index.html',
  'js/AbelianInfo.js',
  'js/AbstractDiagramDisplay.js',
  'js/BasicGroup.js',
  'js/BitSet.js',
  'js/CayleyDiagramController.js',
  'js/CayleyDiagramView.js',
  'js/CayleyGenerator.js',
  'js/CayleyViewController.js',
  'js/ClassEquationInfo.js',
  'js/CycleGraphView.js',
  'js/CyclicInfo.js',
  'js/DefiningRelations.js',
  'js/DiagramDnD.js',
  'js/DragResizeExtension.js',
  'js/ge-lib-endmatter.js',
  'js/ge-lib-preamble.js',
  'js/GEUtils.js',
  'js/IsomorphicGroups.js',
  'js/Library.js',
  'js/Log.js',
  'js/MathML.js',
  'js/MathUtils.js',
  'js/Menu.js',
  'js/Migration.js',
  'js/MulttableView.js',
  'js/OrderClassesInfo.js',
  'js/SheetController.js',
  'js/SheetModel.js',
  'js/SheetView.js',
  'js/ShowGAPCode.js',
  'js/SolvableInfo.js',
  'js/SubgroupFinder.js',
  'js/SubgroupInfo.js',
  'js/Subgroup.js',
  'js/SubsetHighlightController.js',
  'js/SymmetryObjectView.js',
  'js/Template.js',
  'js/XMLGroup.js',
  'js/ZmnInfo.js',
  'Multtable.js',
  'Sheet.js',
  'style/CayleyDiagramController.css',
  'style/fonts.css',
  'style/menu.css',
  'style/sliders.css',
  'style/SubsetHighlightController.css',
  'style/w3.css',
  'style/w3-theme-blue.css',
  'SymmetryObject.js',
  'Version.js',
  'visualizerFramework/visualizer.css',
  'visualizerFramework/visualizer.html',
  'visualizerFramework/visualizer.js'
]

checkForReload(parseLocation()[0])

function parseLocation () /*: [string, string] */ {
  const url = new URL(window.location.href)
  const urlString = url.origin + url.pathname // trim off query string
  const baseURL = urlString.slice(0, urlString.lastIndexOf('/') + 1) // baseURL is part up to last '/'
  const pageName = urlString.slice(urlString.lastIndexOf('/') + 1) // page name is part after last '/'
  return [pageName, baseURL]
}

function checkForReload (pageName /*: string */) {
  const todoList = localStorage.getItem('GE-todo')
  if (todoList != null) {
    const todoPages = todoList.split(' ')
    if (todoPages.includes(pageName)) {
      todoPages.splice(todoPages.indexOf(pageName), 1)
      if (todoPages.length === 0) {
        localStorage.removeItem('GE-todo')
      } else {
        localStorage.setItem('GE-todo', todoPages.join(' '))
      }

      window.location.reload(true)
      return Promise.reject(new Error('restarting with updated GE3 files')) // now start over
    }
  }
}

export async function check () {
  const [pageName, baseURL] = parseLocation()

  const versionString = localStorage.getItem('GE-version')
  if (versionString !== Version.label) { // haven't installed this version
    localStorage.setItem('GE-version', Version.label)
    localStorage.setItem('GE-todo', pagesToReload.join(' '))

    await Promise.all([...filesToReload.map(async (url) => { // Replace files cached by the browser with fresh copies
      return await window
        .fetch(baseURL + url, { cache: 'reload' })
        .then(async (response) => await response.text())
    })])
  }

  return checkForReload(pageName)
}
