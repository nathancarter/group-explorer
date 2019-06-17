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

class Library {
   // initialize Library.map from localStorage
   //   called once after class is defined
   static _initializeGroupMap() {
      Library.map = new Map();
      const numGroups = localStorage.length;
      for (let inx = 0; inx < numGroups; inx++) {
         const key = localStorage.key(inx);
         if (key.startsWith('http')) {
            const group = Library._dataToGroup(localStorage.getItem(key));
            Library.map.set(key, group);
         }
      }
   }

   // convert JSON, XML data formats to group object
   //   uses pattern recognition for strings or, if presented with data from ajax call, content-type http header
   //   (note that ajax calls will already have created JSON objects and XML document fragments if indicated by content-type)
   static _dataToGroup(data, contentType) {
      let group = undefined;
      if (typeof(data) == 'string') {
         group = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data));
      } else if (contentType != undefined && contentType.includes('xml')) {
         group = new XMLGroup(data);
      } else if (contentType != undefined && contentType.includes('json')) {
         group = XMLGroup.parseJSON(data);
      }
      return group;
   }

   // get base URL from window.location.href
   //   (maybe we should eliminate the origin field, since all the data in localStorage is common origin?)
   static baseURL() {
      var baseURL;
      if ( typeof window !== "undefined" ) {
         // if running in the browser, extract the base URL from the window
         baseURL = new URL( window.location.href );
         baseURL = baseURL.origin + baseURL.pathname; // trim off search string
         baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      } else if ( typeof __dirname !== "undefined" ) {
         // if running in node.js, find the base dir of the repository
         baseURL = `file://${__dirname}/../`;
      } else {
         throw "No window or __dirname defined; cannot locate groups library.";
      }
      return baseURL;
   }

   // delete all group definitions from Library.map and localStorage
   static clear() {
      const libraryLength = localStorage.length;
      for (let inx = libraryLength-1; inx >= 0; inx--) {
         const key = localStorage.key(inx);
         if (key.startsWith('http')) {
            localStorage.removeItem(key);
            Library.map.delete(key);
         }
      }
   }

   // return array of groups from Library.map/localStorage (no server contact)
   static getAllLocalGroups() {
      return Array.from(Library.map.values());
   }

   // return array of group URLs from Library.map/localStorage
   static getAllLocalURLs() {
      return Array.from(Library.map.keys());
   }

   // returns Promise to get group from localStorage or, if not there, download it from server
   static getGroupOrDownload(url, baseURL) {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         if (localGroup === undefined) {
            $.ajax({ url: groupURL,
                     success: (data, textStatus, jqXHR) => {
                        try {
                           if (jqXHR.status == 200) {
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
                              reject(`Error fetching ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status})`);
                           }
                        } catch (err) {
                           reject(`Error parsing ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                        }
                     },
                     error: (jqXHR, textStatus, err) => {
                        reject(`Error loading ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
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
   static getLatestGroup(url, baseURL) {
      const groupURL = Library.resolveURL(url, baseURL);
      const localGroup = Library.getLocalGroup(groupURL);
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  headers: (localGroup === undefined) ? {} : {'if-modified-since': localGroup.lastModifiedOnServer},
                  success: (data, textStatus, jqXHR) => {
                     try {
                        if (jqXHR.status == 200) {
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
                        } else if (jqXHR.status == 304) {
                           resolve(localGroup);
                        } else {
                           error_useLocalCopy(`Error fetching ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status})`);
                        }
                     } catch (err) {
                        error_useLocalCopy(`Error parsing ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                     }
                  },
                  error: (jqXHR, textStatus, err) => {
                     error_useLocalCopy(`Error loading ${groupURL}: ${textStatus} (HTTP status code ${jqXHR.status}), ${err}`);
                  }
         });
         // if there's a local copy available, just log error and satisfy call with local copy
         const error_useLocalCopy = (msg) => {
            if (localGroup === undefined) {
               reject(msg);
            } else {
               console.error(msg);
               resolve(localGroup);
            }
         }
      } )
   }

   // return locally stored copy of group from Library.map/localStorage
   static getLocalGroup(url, baseURL) {
      return Library.map.get(Library.resolveURL(url, baseURL));
   }

   // return 'true' if Library.map/localStorage contains no groups
   static isEmpty() {
      return Library.map.size == 0;
   }

   // get groupURL from page invocation and return promise for resolution from cache or download
   static loadFromURL() {
      const hrefURL = new URL(window.location.href);
      if (hrefURL.searchParams.get('groupURL') !== null) {
         return Library.getGroupOrDownload(hrefURL.searchParams.get('groupURL'));
      } else if (hrefURL.searchParams.get('waitForMessage') !== null) {
         return new Promise( (resolve, reject) => {
            /*
             * When this page is loaded in an iframe, the parent window can
             * indicate which group to load by passing the full JSON
             * definition of the group in a postMessage() call to this
             * window, with the format { type : 'load group', group : G },
             * where G is the JSON data in question.
             */
            addEventListener( 'message', function ( event ) {
               if (event.data.type == 'load group') {
                  try {
                     const group = Library._dataToGroup(event.data.group,'json');
                     Library.map.set(undefined, group);
                     resolve(group);
                  } catch (error) {
                     reject(error);
                  }
               }
            }, false );
         } );
      } else {
         alert('error in URL');
      }
   }

   // utility routine to open web page with "...?groupURL=..." with search string containing groupURL
   //   and options from {a: b, ...} included as '&a=b...',
   static openWithGroupURL(pageURL, groupURL, options = {}) {
      const url = `./${pageURL}?groupURL=${groupURL}` +
                  Object.keys(options).reduce( (url, option) => url + `&${option}=${options[option]}`, '');
      window.open(url);
   }

   // get resolved URL from part (e.g., if called from page invoked as
   //   resolveURL(../group-explorer/groups/Z_2.group) from page invoked as
   //   http://localhost/group-explorer/GroupInfo.html?groupURL=../group-explorer/groups/Z_2.group
   //   it returns http://localhost/group-explorer/groups/Z_2.group)
   static resolveURL(url, baseURL = Library.baseURL()) {
      return new URL(url, baseURL).href;
   }

   // serializes and stores group definition in Library.map/localStorage
   //   throws exception if storage quota is exceeded
   static saveGroup(group, key = group.URL) {
      localStorage.setItem(key, JSON.stringify(group));
      Library.map.set(key, group);
   }
}

Library._initializeGroupMap();
