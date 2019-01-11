
class Library {
   static _init() {
      if (Library.groups === undefined) {
         Library.groups = [];
      }
   }

   static loadFromInvocation() {
      const hrefURL = new URL(window.location.href);
      return new Promise( (resolve, reject) => {
         if (hrefURL.searchParams.get('library') !== null) {
            const libraryBlobURL = hrefURL.searchParams.get('library');
            Library.getLibraryFromBlob(libraryBlobURL)
                   .then( (library) => {
                      const groupIndex = hrefURL.searchParams.get('index');
                      resolve({library: library, groupIndex: groupIndex})
                   } )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('group') !== null) {
            const groupBlobURL = hrefURL.searchParams.get('group');
            Library.getGroupFromBlob(groupBlobURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}))
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupJSONURL') !== null) {
            const groupJSONURL = hrefURL.searchParams.get('groupJSONURL');
            Library.getGroupFromJSONURL(groupJSONURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupJSON') !== null) {
            const groupJSONText = hrefURL.searchParams.get('groupJSON');
            var groupJSON;
            try {
               groupJSON = JSON.parse( groupJSONText );
            } catch ( error ) {
               reject( error );
            }
            Library.getGroupFromJSON(groupJSON)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}) )
                   .catch( (error) => reject(error) );
         } else if (hrefURL.searchParams.get('groupURL') !== null) {
            const groupURL = hrefURL.searchParams.get('groupURL');
            Library.getGroupFromURL(groupURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}))
                   .catch( (error) => reject(error) );
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
      } )
   }

   static getLibraryFromBlob(libraryBlobURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: libraryBlobURL,
                  success: (data) => {
                     Library.groups = data.map( jsonObject => XMLGroup.parseJSON(jsonObject) );
                     resolve(Library.groups);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${libraryBlobURL}: ${err}`);
                  }
         })
      } );
   }

   static getGroupFromBlob(groupBlobURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupBlobURL,
                  success: (data) => {
                     const group = XMLGroup.parseJSON(data);
                     resolve(group);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${libraryBlobURL}: ${err}`);
                  }
         })
      } );
   }

   static getGroupFromJSON(groupJSON) {
      return new Promise( (resolve, reject) => {
         try {
            resolve( XMLGroup.parseJSON( groupJSON ) );
         } catch ( error ) {
            reject( error );
         }
      } )
   }

   static getGroupFromJSONURL(groupJSONURL) {
      return new Promise( (resolve, reject) => {
         $.ajax({ url: groupJSONURL,
                  success: (json) => {
                     const group = XMLGroup.parseJSON(json);
                     resolve(group);
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${groupJSON}: ${err}`);
                  }
         })
      } )
   }

   static getGroupFromURL(groupURL) {
      return new Promise( (resolve, reject) => {
         const alreadyLoaded = Library.groups.find( group => group.URL == groupURL );
         if ( alreadyLoaded ) return resolve( alreadyLoaded );
         $.ajax({ url: groupURL,
                  success: (txt) => {
                     try {
                        const group = new XMLGroup(txt);
                        group.URL = groupURL;
                        resolve(group);
                     } catch (err) {
                        reject(`Error parsing ${groupURL}: ${err}`);
                     }
                  },
                  error: (_jqXHR, _status, err) => {
                     reject(`Error loading ${groupURL}: ${err}`);
                  }
         })
      } );
   }

   static addGroupFromText(groupFileText) {
   }

   static getGroups() {
      return Library.groups;
   }

   static add(group) {
      Library.groups.push(group);
      return Library.groups;
   }

   static findIndex(group) {
      return Library.groups.findIndex( (g) => g == group );
   }

   static openWithLibrary(pageURL, g, opts) {
      // routine can be invoked with several meanings for 'g'
      let groupIndex;
      if (typeof g == 'number') {	// we were passed the index of the group
         groupIndex = g;
      } else {				// we were passed the group itself
         groupIndex = Library.findIndex(g);
         if (groupIndex == -1) {	// the group was not in the library
            Library.add(g);		//   add it and pretend it was there all along
            groupIndex = Library.findIndex(g);
         }
      }

      // create Blob from library
      const blobURL = URL.createObjectURL(
         new Blob([JSON.stringify(Library.groups)], {type: 'application/json'}));

      // compute URL
      let url = Library._appendOptions(`./${pageURL}?library=${blobURL}&index=${groupIndex}`, opts);

      window.open(url);
   }

   static openWithGroup(pageURL, g, opts) {
      // routine can be invoked with several meanings for 'g'
      let group
      if (typeof g == 'number') {	// we were passed the index of the group
         group = Library.groups[g];
      } else {				// we were passed the group itself
         group = g;
      }

      // create Blob from group
      const blobURL = URL.createObjectURL(
         new Blob([JSON.stringify(group)], {type: 'application/json'}));

      // compute URL
      let url = Library._appendOptions(`./${pageURL}?group=${blobURL}`, opts);

      window.open(url);
   }

   // append optional parameters to the URL, if supplied
   static _appendOptions(url, options) {
      if (options !== undefined) {
         for (const option in options) {
            if (options[option] !== undefined) {
               url += `&${option}=${options[option]}`;
            }
         }
      }
      return url;
   }

   // can be used in a page that has only one group loaded to load all the remaining
   // groups in the library if some computation is attempted that needs them.
   // the callback is called with each group as it is loaded, and passed a second
   // parameter that is true iff the group in question is the final one.
   // all parameters are optional.
   // The first defaults to the empty function.
   // The second defaults to urls, which will exist if groupURLs.js was imported.
   // The third defaults to the base URL taken from window.location.href.
   static loadAllGroups ( callback, urlsToLoad, baseURL ) {
      if ( !callback ) callback = function () { };
      if ( !urlsToLoad ) urlsToLoad = urls;
      if ( !baseURL ) {
         var baseURL = new URL( window.location.href );
         baseURL = baseURL.origin + baseURL.pathname; // trim off search string
         baseURL = baseURL.slice( 0, baseURL.lastIndexOf('/') + 1 ); // trim off page
      }
      let numLoaded = 0;
      urlsToLoad.map( url => {
         Library.getGroupFromURL( baseURL + url )
                .then( group => {
                   Library.add( group );
                   callback( group, ++numLoaded == urlsToLoad.length );
                } )
                .catch( error => console.log( error ) );
      } );
   }
}

Library._init();
