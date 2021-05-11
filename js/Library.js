// @flow

/* global $ localStorage */

/*
 * Class manages group definitions stored in localStorage
 *
 * Group definitions are stored as JSON strings, keyed by
 *  the URL from which the group was fetched.  (Since there are other
 *  objects in the cache, it is assumed for now that the URL starts
 *  with the characters 'http' -- might have to re-visit this later.)
 *  The group objects created from these JSON strings are cached as
 *  key-value pairs in Library.map.
 *
 * Method overview:
 *   getMapFromLocalStorage -- initialize Library.map from localStorage
 *   dataToGroup -- make group object from JSON string, XML string
 *   getBaseURL -- base URL from window.location.href
 *   clear -- delete all group definitions from Library.map and localStorage
 *   getAllLocalGroups -- return array of groups from Library.map/localStorage
 *   getAllLocalURLs -- return array of URLs from Library.map/localStorage
 *   getGroupOrDownload -- return Promise for group, resolved from localStorage if there
 *   getLatestGroup -- return Promise for current copy of group from server
 *   getLocalGroup -- return group from localStorage,
 *   isEmpty -- true if localStorage contains no groups
 *   loadFromURL -- get groupURL from window.location.href and return Promise to load it (see getGroupOrDownload)
 *   openWithGroupURL -- utility routine to window.open page with ?groupURL=... search string
 *   resolveURL -- get full URL
 *   saveGroup -- serialize and store group by URL in Libary.map/localStorage
 */

import * as Migration from './Migration.js' // causes module load-time check whether this page should be reloaded
import Log from './Log.js'
import * as MathML from './MathML.js'
import { LISTENER_READY_MESSAGE, STATE_LOADED_MESSAGE } from './SheetModel.js'
import XMLGroup from './XMLGroup.js'

/*::
import type { MSG_loadGroup } from './SheetModel.js'
import type { XMLGroupJSON, BriefXMLGroupJSON } from './XMLGroup.js'
import type { BasicGroupJSON } from './BasicGroup.js'
*/

const map /*: { [key: string]: XMLGroup } */ = getMapFromLocalStorage()

// If migration is in progress migrate existing library to new format
// Then read new format from localStorage into map
function getMapFromLocalStorage () {
  const groupsString = localStorage.getItem('groups') || migrate3v1To3v2()
  const groups = JSON.parse(groupsString) || {}
  for (const [groupURL, groupJSON] of Object.entries(groups)) {
    groups[groupURL] = XMLGroup.parseJSON(((groupJSON /*: any */) /*: XMLGroupJSON & BasicGroupJSON */))
  }

  return groups
}

function dataToGroup (data /*: any */, contentType /*: ?string */) /*: void | XMLGroup */ {
  let group /*: XMLGroup */
  if (typeof data === 'string') {
    group = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data))
  } else if (contentType != null && contentType.includes('xml')) {
    group = (new XMLGroup((data /*: Document */)) /*: XMLGroup */)
  } else if (contentType != null && contentType.includes('json')) {
    group = XMLGroup.parseJSON((data /*: Object */))
  }
  return group
}

// get base URL from window.location.href
//   (maybe we should eliminate the origin field, since all the data in localStorage is common origin?)
function getBaseURL () /*: string */ {
  let baseURL = new URL(window.location.href)
  baseURL = baseURL.origin + baseURL.pathname // trim off search string
  baseURL = baseURL.slice(0, baseURL.lastIndexOf('/') + 1) // trim off page
  return baseURL
}

// delete all group definitions from map and localStorage
export function clear () {
  const libraryLength = localStorage.length
  for (let inx = libraryLength - 1; inx >= 0; inx--) {
    const key = localStorage.key(inx)
    if (key != null && key.startsWith('http')) {
      localStorage.removeItem(key)
      delete map[key]
    }
  }
}

// return array of groups from map/localStorage (no server contact)
export function getAllLocalGroups () /*: Array<XMLGroup> */ {
  return ((Object.values(map) /*: any */) /*: Array<XMLGroup> */)
}

// return array of group URLs from map/localStorage
export function getAllLocalURLs () /*: Array<string> */ {
  return Object.getOwnPropertyNames(map)
}

// returns Promise to get group from localStorage or, if not there, download it from server
export function getGroupOrDownload (url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
  const groupURL = resolveURL(url, baseURL)
  const localGroup = getLocalGroup(groupURL)
  return new Promise((resolve, reject) => {
    if (localGroup === undefined) {
      $.ajax({
        url: groupURL,
        success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
          try {
            if (jqXHR != null && jqXHR.status === 200) {
              const remoteGroup = dataToGroup(data, jqXHR.getResponseHeader('content-type'))
              if (remoteGroup == null) {
                reject(new Error(`Error reading ${groupURL}: unknown data type`))
              } else {
                remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified')
                remoteGroup.URL = groupURL
                saveGroup(remoteGroup)
                resolve(remoteGroup)
              }
            } else {
              const errorMsg = `Error fetching ${groupURL}: ${textStatus || 'N/A'} ` +
                    `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'})`
              reject(new Error(errorMsg))
            }
          } catch (err) {
            const errorMsg = `Error parsing ${groupURL}: ${textStatus || 'N/A'} ` +
                  `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'}, ` +
                  `${err || 'N/A'}`
            reject(new Error(errorMsg))
          }
        },
        error: (jqXHR, textStatus, err) => {
          const errorMsg = `Error loading ${groupURL}: ${textStatus || 'N/A'} ` +
                `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'}), ` +
                `${err || 'N/A'}`
          reject(new Error(errorMsg))
        }
      })
    } else {
      resolve(localGroup)
    }
  })
}

// replace latest group definition from server in local store and return group
//   if a local copy exists, download only occurs if server last-modified time
//   is more recent than that of local copy
//   returns Promise to load group
export function getLatestGroup (url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
  const groupURL = resolveURL(url, baseURL)
  const localGroup = getLocalGroup(groupURL)
  return new Promise((resolve, reject) => {
    $.ajax({
      url: groupURL,
      headers: (localGroup == null) ? {} : { 'if-modified-since': localGroup.lastModifiedOnServer },
      success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
        try {
          if (jqXHR != null && jqXHR.status === 200) {
            const remoteGroup = dataToGroup(data, jqXHR.getResponseHeader('content-type'))
            if (remoteGroup == null) {
              reject(new Error(`Error reading ${groupURL}: unknown data type`))
            } else {
              remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified')
              remoteGroup.URL = groupURL
              // copy notes, user-defined representations and representation preferences from localGroup
              if (localGroup != null) {
                remoteGroup.userNotes = localGroup.userNotes
                remoteGroup.representationIndex = localGroup.representationIndex
                if (localGroup.userRepresentations.length !== 0) {
                  remoteGroup.userRepresentations = localGroup.userRepresentations
                }
              }
              saveGroup(remoteGroup)
              resolve(remoteGroup)
            }
          } else if (jqXHR != null && jqXHR.status === 304 && localGroup != null) {
            resolve(localGroup)
          } else {
            const errorMsg = `Error fetching ${groupURL}: ${textStatus || 'N/A'} ` +
                  `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'})`
            errorUseLocalCopy(errorMsg)
          }
        } catch (err) {
          const errorMsg = `Error parsing ${groupURL}: ${textStatus || 'N/A'} ` +
                `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'}, ${err || 'N/A'}`
          errorUseLocalCopy(errorMsg)
        }
      },
      error: (jqXHR, textStatus, err) => {
        const errorMsg = `Error loading ${groupURL}: ${textStatus || 'N/A'} ` +
              `(HTTP status code ${jqXHR != null && jqXHR.status != null ? jqXHR.status : 'N/A'}), ${err || 'N/A'}`
        errorUseLocalCopy(errorMsg)
      }
    })

    // if there's a local copy available, just log error and satisfy call with local copy
    const errorUseLocalCopy = (errorMsg) => {
      if (localGroup == null) {
        reject(new Error(errorMsg))
      } else {
        Log.err(errorMsg)
        resolve(localGroup)
      }
    }
  })
}

// return locally stored copy of group from map/localStorage
export function getLocalGroup (url /*: string */, baseURL /*: void | string */) /*: void | XMLGroup */ {
  return map[resolveURL(url, baseURL)]
}

// return 'true' if map/localStorage contains no groups
export function isEmpty () /*: boolean */ {
  return Object.keys(map).length === 0
}

// get groupURL from page invocation and return promise for resolution from cache or download
export function loadFromURL () /*: Promise<XMLGroup> */ {
  const hrefURL = new URL(window.location.href)
  const groupURL = hrefURL.searchParams.get('groupURL')
  if (groupURL != null) {
    return getGroupOrDownload(groupURL)
  } else if (hrefURL.searchParams.get('waitForMessage') !== null) {
    return new Promise((resolve, reject) => {
      /*
       * When this page is loaded in an iframe, the parent window can
       * indicate which group to load by passing the full JSON
       * definition of the group in a postMessage() call to this
       * window, with the format { type: 'load group', group: G },
       * where G is the JSON data in question.
       */
      window.addEventListener('message', function (event /*: MessageEvent */) {
        const eventData = (event.data /*: any */)
        if (typeof eventData === 'undefined') {
          Log.err('empty message received in Library.js:')
          Log.err(eventData)
          reject(new Error('empty message received in Library.js'))
        } else if (eventData.source === 'editor' ||
                   eventData.source === 'external' ||
                   eventData === LISTENER_READY_MESSAGE ||
                   eventData === STATE_LOADED_MESSAGE
        ) {
          // Sheet editor messages -- ignore them, they belong to CayleyDiagram.js : receiveInitialSetup
        } else if (eventData.type === 'load group') {
          const loadGroupMessage /*: MSG_loadGroup */ = eventData
          try {
            if (typeof loadGroupMessage.group === 'object') {
              const group = dataToGroup(loadGroupMessage.group, 'json')
              if (group != null) {
                map[group.shortName] = group
                resolve(group)
              }
            }
            reject(new Error('unable to understand loadGroupMessage'))
          } catch (error) {
            reject(error)
          }
        } else {
          Log.err('unknown message received in Library.js:')
          Log.err(eventData)
          reject(new Error('unknown message received in Library.js'))
        }
      }, false)
    })
  } else {
    return new Promise((resolve, reject) => {
      reject(new Error("error in URL: can't find groupURL query parameter"))
    })
  }
}

// utility routine to open web page with "...?groupURL=..." with search string containing groupURL
//   and options from {a: b, ...} included as '&a=b...',
export function openWithGroupURL (pageURL /*: string */, groupURL /*: string */, options /*: {[key: string]: string} */ = {}) {
  const url = `./${pageURL}?groupURL=${groupURL}` +
        Object.keys(options).reduce((url, key /*: string */) => url + `&${key}=${options[key]}`, '')
  window.open(url)
}

// get resolved URL from part (e.g., if called from page invoked as
//   resolveURL(../group-explorer/groups/Z_2.group) from page invoked as
//   http://localhost/group-explorer/GroupInfo.html?groupURL=../group-explorer/groups/Z_2.group
//   it returns http://localhost/group-explorer/groups/Z_2.group)
export function resolveURL (url /*: string */, baseURL /*: ?string */) /*: string */ {
  return new URL(url, (baseURL == null) ? getBaseURL() : baseURL).href
}

// serializes and stores group definition in map/localStorage
//   throws exception if storage quota is exceeded
export function saveGroup (group /*: XMLGroup */, key /*: string */ = group.URL) {
  try {
    map[key] = group
    localStorage.setItem('groups', JSON.stringify(map))
  } catch (err) {
    Log.err(err)
  }
}

// Convert v3.1 groups to v3.2 format:
//   convert MathML fields to html: name, other_names, definition, representations, userRepresentations
//   save user-defined fields: notes, user-defined representations, representationIndex preference
//   replace MathML-generated columns in rowHTML with plain HTML
//   delete http*, mathjax_stylesheet entries
//   write new group definitions to 'groups' entry in localStorage
function migrate3v1To3v2 () /*: string */ {
  // gather all the keys we're going to migrate
  const keys = []
  for (let inx = 0; inx < localStorage.length; inx++) {
    const key = localStorage.key(inx)
    if (key != null && (key.startsWith('http') || key === 'mathjax_stylesheet')) {
      keys.push(key)
    }
  }

  // migrate and store groups in groups
  const groups = {}
  for (const key of keys) {
    if (key.startsWith('http')) {
      const value = localStorage.getItem(key)

      // migrate previous group definitions
      if (value != null) {
        // convert name, other_names, definition, representations, userRepresentations to html
        const group = XMLGroup.parseJSON(JSON.parse(value).object)
        group.name = MathML.toHTML(group.name)
        group.other_names =
          (group.other_names == null) ? [] : group.other_names.map((name) => MathML.toHTML(name))
        group.definition = MathML.toHTML(group.definition)
        group.representations = group.representations.map((rep) => rep.map((el) => MathML.toHTML(el)))
        group.userRepresentations = group.userRepresentations.map((rep) => rep.map((el) => MathML.toHTML(el)))
        if (group.representationIndex >= group.representations.length) {
          group.representationIndex = -(group.representationIndex - group.representations.length + 1)
        }

        // replace group.rowHTML MathML-generated name and definition columns with HTML
        const rowHTML = group.rowHTML
        if (rowHTML != null) {
          const $row = $('<div>').html(rowHTML)
          $row.find('tr > td:nth-of-type(1) > a > div').html(group.name)
          $row.find('tr > td:nth-of-type(3) > a > div').html(group.definition)
          group.rowHTML = $row.html()
        }

        // add group to groups object
        groups[key] = group
      }
    }

    localStorage.removeItem(key)
  }

  const groupsJSON = JSON.stringify(groups)
  localStorage.setItem('groups', groupsJSON)
  return groupsJSON
}
