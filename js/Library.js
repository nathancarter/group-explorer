
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
         } else {
            const groupURL = hrefURL.searchParams.get('groupURL');
            Library.getGroupFromURL(groupURL)
                   .then( (group) =>
                      resolve({library: Library.add(group), groupIndex: Library.findIndex(group)}))
                   .catch( (error) => reject(error) );
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
}

Library._init();
