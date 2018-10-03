
/*
# Visualizer framework

VC.load() loads the visualizer framework and wraps it around the visualizer-specific panels defined in the individual visualizers

It is called immediately after document load by CayleyDiagram.html, CycleGraph.html, Multtable.html, and SymmetryObject.html
```javascript
 */
class VC {
   static _init() {
      VC.visualizerLayoutURL = './visualizerFramework/visualizer.html';
   }

   /*
```
## VC.load()
```javascript
   /* Start an ajax load of visualizer.html that, on successful completion,
    *   wraps the existing visualizer-specific body with the visualizer framework
    *
    * It returns the just-started ajax load as an ES6 Promise
    */
   static load() {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: VC.visualizerLayoutURL,
                   success: (data) => {
                      // The current body element is considererd to contain visualizer-specific layout
                      // Detach it and save it for insertion into the visualizer framework below
                      const $customCode = $('body').children().detach();
                      // Replace the current body with content of visualizer.html
                      $('body').html(data);
                      // Remove controls-placeholder div and insert visualizer-specific code saved above
                      $('#controls-placeholder').remove();
                      $('#vert-container').prepend($customCode);
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${VC.visualizerLayoutURL}: ${err}`);
                   }
         } );
      } )
   }
}

VC._init();
/*
```
*/

