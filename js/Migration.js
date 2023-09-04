// @flow

import * as Version from '../Version.js'

const filesToReload = [
  'html/AbelianInfo.html',
  'html/CayleyDiagramController.html',
  'html/CayleyViewController.html',
  'html/ClassEquationInfo.html',
  'html/CyclicInfo.html',
  'html/OrderClassesInfo.html',
  'html/ShowGAPCode.html',
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
  'refreshVersion.js',
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

/*
 * Routine uses GE_version value in local storage, a label like 'GE 3.2.0'
 * This is the version label as of the last time the files were refreshed
 */

async function refreshFiles () {
  // Replace files cached by the browser with fresh copies, and update version in local storage
  updateLocalStorage()

  const url = new URL(window.location.href)
  const urlString = url.origin + url.pathname // trim off query string
  const baseURL = urlString.slice(0, urlString.lastIndexOf('/') + 1) // baseURL is part up to last '/'

  await Promise.all([...filesToReload.map(async (url) => {
    return await window
      .fetch(baseURL + url, { cache: 'reload' })
      .then(async (response) => await response.text())
  })])
}

function reloadWebPage () {
  window.location.reload(true)
  return Promise.reject(new Error('restarting with updated GE3 files'))
}

function semanticVersionHash (label /*: ?string */) /*: ?integer */ {
  let versionHash = null
  if (label != null) {
    const labelMatch = label.match(/([0-9]+).([0-9]+).([0-9]+)/)
    if (labelMatch != null) {
      const [major, minor, patch] = labelMatch.splice(1, 3)
      versionHash = ((parseInt(major) * 100000) + parseInt(minor)) * 100000 + parseInt(patch)
    }
  }
  return versionHash
}

function updateLocalStorage () {
  localStorage.setItem('GE-version', Version.label)
}

export async function check () {
  let result = Promise.resolve()

  const thisLabel = Version.label
  const storedLabel = localStorage.getItem('GE-version')
  const storedVersionHash = semanticVersionHash(storedLabel)
  const thisVersionHash = semanticVersionHash(thisLabel)

  if (thisVersionHash == null) {
    // web page has no version metadata so it's old => load new web page and let it work out whether to refresh files
    result = reloadWebPage()
  } else {
    if (storedVersionHash == null) {
      // local storage has no GE-version => this is a migration from a pre-3.2 version, or a new install
      await refreshFiles()
      result = reloadWebPage()
    } else {
      if (thisLabel !== storedLabel) { // files and web page are not in synch
        if (thisVersionHash > storedVersionHash) {
          // web page newer than files => refresh files
          await refreshFiles()
          result = reloadWebPage()
        } else if (thisVersionHash < storedVersionHash) {
          // web page older than files => load new web page
          result = reloadWebPage()
        }
      }
    }
  }
  return result
}

if (Version.label === '') {
  reloadWebPage()
}
