
/*
# Visualizer framework javascript

[VC.load()](#vc-load-) embeds the visualizer-specific control panels in a copy of the visualizer framework. It is called immediately after document load by CayleyDiagram.html, CycleGraph.html, Multtable.html, SymmetryObject.html, and Sheet.html

[VC.reset()](#vc-reset-) restores the visualizer-specific control panels to the DOM and then re-runs the visualizer's `load` routine

[VC.hideControls()](#vc-hideControls-) and [VC.showControls()](#vc-showControls-) hide and expose the visualizer-specific control panels

[VC.showPanel(panel_name)](#vc-showpanel-panel_name-) switch panel by showing desired panel_name, hiding the others

[VC.help()](#vc-help-) links to the visualizer-specific help page

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
   /*
    * Start an ajax load of visualizer.html that, on successful completion,
    *   embeds the existing visualizer-specific controls in the visualizer framework
    *
    * It returns the just-started ajax load as an ES6 Promise
    */
   static load() {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: VC.visualizerLayoutURL,
                   success: (data) => {
                      // Save current body in reset_template
                      const $resetTemplate = $('<template id="reset_template">').html($('body').html().trim());

                      // The current body element contains visualizer-specific layout
                      // Detach it and save it for insertion into the visualizer framework below
                      const $customCode = $('body').children().detach();

                      // Replace the current body with content of visualizer.html, append resetTemplate
                      $('body').html(data).append($resetTemplate);

                      // Remove controls-placeholder div and insert visualizer-specific code saved above
                      $('#controls-placeholder').remove();
                      $('#vert-container').prepend($customCode);

                      // Hide top right-hand 'hide-controls' icon initially
                      $( '#show-controls' ).hide();

                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${VC.visualizerLayoutURL}: ${err}`);
                   }
         } );
      } )
   }

   /*
```
## VC.hideControls()
```javascript
   /* Hide visualizer-specific control panels, resize graphic */
   static hideControls () {
      $( '#hide-controls' ).hide();
      $( '#show-controls' ).show();
      $( '#vert-container' ).hide().resize();
   }

   /*
```
## VC.showControls()
```javascript
   /* Expose visualizer-specific control panels, resize graphic */
   static showControls () {
      $( '#hide-controls' ).show();
      $( '#show-controls' ).hide();
      $( '#vert-container' ).show().resize();
   }

   /*
```
## VC.help()
```javascript
   /* Link to visualizer-specific help page */
   static help() {
      window.open(HELP_PAGE);
   }

   /*
```
## VC.reset()
```javascript
   /*
    * Restore the initial DOM by replacing the HTML body with the contents of the reset_template element,
    *   saved in VC.load() above, and then re-running visualizer-specific 'load()' function
    */
   static reset() {
      $('body').html($('#reset_template').html());
      load();
   }

   /*
```
## VC.showPanel(panel_name)
```javascript
   /* Switch panels by showing desired panel, hiding the rest */
   static showPanel(panel_name) {
      $('#vert-container > .fill-vert').each( (_, control) => {
         const control_name = '#' + $(control).attr('id');
         if (control_name == panel_name) {
            $(control_name).show();
         } else {
            $(control_name).hide();
         }
      } )
   }
}

VC._init();
/*
```
 */
