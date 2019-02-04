
class Library {
   static _baseURL() {
      var baseURL = new URL( window.location.href );
      baseURL = baseURL.origin + baseURL.pathname; // trim off search string
      baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      return baseURL;
   }

   static loadFromURL() {
      const hrefURL = new URL(window.location.href);
      if (hrefURL.searchParams.get('groupURL') !== null) {
         return Library.getGroup(hrefURL.searchParams.get('groupURL'));
      } else {
         /*
          * When this page is loaded in an iframe, the parent window can
          * indicate which group to load by passing the full JSON
          * definition of the group in a postMessage() call to this
          * window, with the format { type : 'load group', group : G },
          * where G is the JSON data in question.
          */
         addEventListener( 'message', function ( event ) {
            if (event.data.type == 'load group') {
               Library.getGroupFromJSON(event.data.group)
                      .then( (group) =>
                         resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                      .catch( (error) => reject(error) );
            }
         }, false );
      }
   }

   static clear() {
      Library.group = [];
      const libraryLength = localStorage.length;
      for (let inx = libraryLength-1; inx >= 0; inx--) {
         const key = localStorage.key(inx);
         if (key.startsWith('http')) {
            localStorage.removeItem(key);
         }
      }
   }

   static getAllGroups() {
      const urls = new Set(Library.groups.map( (g) => g.URL ));
      const numGroups = localStorage.length;
      for (let inx = 0; inx < numGroups; inx++) {
         const key = localStorage.key(inx);
         if (key.startsWith('http') && !urls.has(key.slice(6))) {
            const group = XMLGroup.parseJSON(JSON.parse(localStorage.getItem(key)));
            Library.groups.push(group);
         }
      }
      return Library.groups;
   }

   static getGroup(url, baseURL) {
      const groupURL = new URL(url, (baseURL === undefined) ? Library._baseURL() : baseURL).toString();
      const localData = localStorage.getItem(groupURL);
      const storedGroup = (localData == undefined) ? undefined : XMLGroup.parseJSON(JSON.parse(localData));
      const lastModifiedOnServer = (storedGroup == undefined) ? undefined : storedGroup.lastModifiedOnServer;
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupURL,
                  headers: (lastModifiedOnServer == undefined) ? {} : {'if-modified-since': lastModifiedOnServer},
                  success: (data, textStatus, jqXHR) => {
                     try {
                        if (jqXHR.status == 200) {
                           const contentTypeHeader = jqXHR.getResponseHeader('content-type');
                           let remoteGroup;
                           if (typeof(data) == 'string') {
                              remoteGroup = data.includes('<!DOCTYPE groupexplorerml>') ? new XMLGroup(data) : XMLGroup.parseJSON(JSON.parse(data));
                           } else if (contentTypeHeader != undefined && contentTypeHeader.includes('xml')) {
                              remoteGroup = new XMLGroup(data);
                           } else if (contentTypeHeader != undefined && contentTypeHeader.includes('json')) {
                              remoteGroup = XMLGroup.parseJSON(data);
                           } else {
                              reject(`Error reading ${groupURL}: unknown data type`);
                           }
                           remoteGroup.lastModifiedOnServer = jqXHR.getResponseHeader('last-modified');
                           remoteGroup.URL = groupURL;
                           localStorage.setItem(groupURL, JSON.stringify(remoteGroup));
                           Library.groups.push(remoteGroup);
                           resolve(remoteGroup);
                        } else if (jqXHR.status == 304) {
                           Library.groups.push(storedGroup);
                           resolve(storedGroup);
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
         })
      } )
   }
   
   static openWithGroupURL(pageURL, g, options) {
      // routine can be invoked with g as index in Library.groups, or the group itself
      const groupURL = (typeof g == 'number') ? Library.groups[g].URL : g.URL;

      // compute URL
      const url = `./${pageURL}?groupURL=${groupURL}` +
                  ((options == undefined) ? '' : Object.keys(options)
                                                       .reduce( (url, option) => url + `&${option}=${options[option]}`, ''));
      window.open(url);
   }

   static findIndex(group) {
      return Library.groups.findIndex( (g) => g == group );
   }
}

Library.groups = [];
