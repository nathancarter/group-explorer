// @flow
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
 *   _initializeGroupMap -- initialize Library.map from localStorage
 *   _dataToGroup -- make group object from JSON string, XML string
 *   baseURL -- base URL from window.location.href
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
/*::
import BasicGroup from './BasicGroup.js';
import Log from './Log.md';
import type {MSG_loadGroup} from './SheetModel.js';
import XMLGroup from './XMLGroup.js';
import type {XMLGroupJSON, BriefXMLGroupJSON} from './XMLGroup.js';

type StoredLibraryValue = {
   rev: number,
   object: XMLGroup
};
   
export default
 */
class Library {
/*::
   static map: {[key: string]: XMLGroup};
   static revision: number;
*/
   // initialize Library.map from localStorage
   //   called once after class is defined
   static __initializeLibrary(rev /*: number */ = 0) {
      Library.revision = rev;
      Library.map = {};
      const numGroups = localStorage.length;
      for (let inx = 0; inx < numGroups; inx++) {
         const key = localStorage.key(inx);
         if (key != undefined && key.startsWith('http')) {
            const value = localStorage.getItem(key);
            if (value != undefined) {
               const {rev: revision, object: groupJSON} = JSON.parse(value);
               if (revision == Library.revision) {
                  const group = Library._dataToGroup(groupJSON, 'json');
                  if (group != undefined) {
                     Library.map[key] = group;
                  }
               }
            }
         }
      }
   }

   // convert JSON, XML data formats to group object
   //   uses pattern recognition for strings or, if presented with data from ajax call, content-type http header
   //   (note that ajax calls will already have created JSON objects and XML document fragments if indicated by content-type)
   static _dataToGroup(data /*: any */, contentType /*: ?string */) /*: void | XMLGroup */ {
      let group /*: XMLGroup */;
      if (typeof data == 'string') {
         group = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data));
      } else if (contentType != undefined && contentType.includes('xml')) {
         group = (new XMLGroup((data /*: Document */)) /*: XMLGroup */);
      } else if (contentType != undefined && contentType.includes('json')) {
         group = XMLGroup.parseJSON((data /*: Object */));
      }
      return group;
   }

   // get base URL from window.location.href
   //   (maybe we should eliminate the origin field, since all the data in localStorage is common origin?)
   static baseURL() /*: string */ {
      var baseURL = new URL( window.location.href );
      baseURL = baseURL.origin + baseURL.pathname; // trim off search string
      baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      return baseURL;
   }

   // delete all group definitions from Library.map and localStorage
   static clear() {
      const libraryLength = localStorage.length;
      for (let inx = libraryLength-1; inx >= 0; inx--) {
         const key = localStorage.key(inx);
         if (key != undefined && key.startsWith('http')) {
            localStorage.removeItem(key);
            delete Library.map[key];
         }
      }
   }

   // return array of groups from Library.map/localStorage (no server contact)
   static getAllLocalGroups() /*: Array<XMLGroup> */ {
      return ((Object.values(Library.map) /*: any */) /*: Array<XMLGroup> */);
   }

   // return array of group URLs from Library.map/localStorage
   static getAllLocalURLs() /*: Array<string> */ {
      return Object.getOwnPropertyNames(Library.map);
   }

   // returns Promise to get group from localStorage or, if not there, download it from server
   static getGroupOrDownload(url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         if (localGroup === undefined) {
            $.ajax({ url: groupURL,
                     success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
                        try {
                           if (jqXHR != undefined && jqXHR.status == 200) {
                              const remoteGroup = Library._dataToGroup(data, jqXHR.getResponseHeader('content-type'));
                              if (remoteGroup === undefined) {
                                 reject(`Error reading ${groupURL}: unknown data type`);
                              } else {
                                 remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified');
                                 remoteGroup.URL = groupURL;
                                 Library.saveGroup(remoteGroup);
                                 resolve(remoteGroup);
                              }
                           } else {
                              reject(`Error fetching ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'})`);
                           }
                        } catch (err) {
                           reject(`Error parsing ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}, ${err || 'N/A'}`);
                        }
                     },
                     error: (jqXHR, textStatus, err) => {
                        reject(`Error loading ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}), ${err || 'N/A'}`);
                     }
            });
         } else {
            resolve(localGroup);
         }
      } )
   }

   // replace latest group definition from server in local store and return group
   //   if a local copy exists, download only occurs if server last-modified time
   //   is more recent than that of local copy
   //   returns Promise to load group
   static getLatestGroup(url /*: string */, baseURL /*: ?string */) /*: Promise<XMLGroup> */ {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  headers: (localGroup == undefined) ? {} : {'if-modified-since': localGroup.lastModifiedOnServer},
                  success: (data /*: any */, textStatus /*:: ?: string */, jqXHR /*:: ?: JQueryXHR */) => {
                     try {
                        if (jqXHR != undefined && jqXHR.status == 200) {
                           const remoteGroup = Library._dataToGroup(data, jqXHR.getResponseHeader('content-type'));
                           if (remoteGroup === undefined) {
                              reject(`Error reading ${groupURL}: unknown data type`);
                           } else {
                              remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified');
                              remoteGroup.URL = groupURL;
                              // need to copy notes, representation preferences from localGroup, if available
                              Library.saveGroup(remoteGroup);
                              resolve(remoteGroup);
                           }
                        } else if (jqXHR != undefined && jqXHR.status == 304 && localGroup !== undefined) {
                           resolve(localGroup);
                        } else {
                           error_useLocalCopy(`Error fetching ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'})`);
                        }
                     } catch (err) {
                        error_useLocalCopy(`Error parsing ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}, ${err || 'N/A'}`);
                     }
                  },
                  error: (jqXHR, textStatus, err) => {
                     error_useLocalCopy(`Error loading ${groupURL}: ${textStatus || 'N/A'} (HTTP status code ${jqXHR != undefined && jqXHR.status != undefined ? jqXHR.status : 'N/A'}), ${err || 'N/A'}`);
                  }
         });
         // if there's a local copy available, just log error and satisfy call with local copy
         const error_useLocalCopy = (msg) => {
            if (localGroup === undefined) {
               reject(msg);
            } else {
               Log.err(msg);
               resolve(localGroup);
            }
         }
      } )
   }

   // return locally stored copy of group from Library.map/localStorage
   static getLocalGroup(url /*: string */, baseURL /*: void | string */) /*: void | XMLGroup */ {
      return Library.map[Library.resolveURL(url, baseURL)];
   }

   // return 'true' if Library.map/localStorage contains no groups
   static isEmpty() /*: boolean */ {
      return Object.keys(Library.map).length == 0;
   }

   // get groupURL from page invocation and return promise for resolution from cache or download
   static loadFromURL() /*: Promise<XMLGroup> */ {
      const hrefURL = new URL(window.location.href);
      const groupURL = hrefURL.searchParams.get('groupURL');
      if (groupURL != null) {
         return Library.getGroupOrDownload(groupURL);
      } else if (hrefURL.searchParams.get('waitForMessage') !== null) {
         return new Promise( (resolve, reject) => {
            /*
             * When this page is loaded in an iframe, the parent window can
             * indicate which group to load by passing the full JSON
             * definition of the group in a postMessage() call to this
             * window, with the format { type: 'load group', group: G },
             * where G is the JSON data in question.
             */
            document.addEventListener( 'message', function ( event /*: MessageEvent */ ) {
               if (typeof event.data == undefined || ((event.data /*: any */) /*: Obj */).type != 'load group') {
                  Log.err('unknown message received in Library.js:');
                  Log.err(event.data);
                  reject('unknown message received in Library.js');
               }
               const event_data = ((event.data /*: any */) /*: MSG_loadGroup */);
               try {
                  if (typeof event_data.group == 'string') {
                     const group = Library._dataToGroup(event_data.group, 'json');
                     if (group != undefined) {
                        Library.map[group.shortName] = group;
                        resolve(group);
                     }
                  }
                  reject('unable to understand data');
               } catch (error) {
                  reject(error);
               }
            }, false );
         } );
      } else {
         return new Promise( (_resolve, reject) => {
            reject("error in URL: can't find groupURL query parameter");
         } );
      }
   }

   // utility routine to open web page with "...?groupURL=..." with search string containing groupURL
   //   and options from {a: b, ...} included as '&a=b...',
   static openWithGroupURL(pageURL /*: string */, groupURL /*: string */, options /*: {[key: string]: string} */ = {}) {
      const url = `./${pageURL}?groupURL=${groupURL}` +
                  Object.keys(options).reduce( (url, key /*: string */) => url + `&${key}=${options[key]}`, '');
      window.open(url);
   }

   // get resolved URL from part (e.g., if called from page invoked as
   //   resolveURL(../group-explorer/groups/Z_2.group) from page invoked as
   //   http://localhost/group-explorer/GroupInfo.html?groupURL=../group-explorer/groups/Z_2.group
   //   it returns http://localhost/group-explorer/groups/Z_2.group)
   static resolveURL(url /*: string */, baseURL /*: ?string */) /*: string */ {
      return new URL(url, (baseURL == undefined) ? Library.baseURL() : baseURL).href;
   }

   // serializes and stores group definition in Library.map/localStorage
   //   throws exception if storage quota is exceeded
   static saveGroup(group /*: XMLGroup */, key /*: string */ = group.URL) {
      Library.map[key] = group;
      try {
         const value /*: StoredLibraryValue */ = {rev: Library.revision, object: group};
         localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
         Log.err(err);
      }
   }
}

Library.__initializeLibrary(2);
