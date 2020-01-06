/* @flow
# Visualizer framework javascript

[load()](#load) embeds the visualizer-specific control panels in a copy of the visualizer
framework. It is called immediately after document load by CayleyDiagram.html, CycleGraph.html,
Multtable.html, SymmetryObject.html, and Sheet.html

[hideControls()](#hidecontrols) and [showControls()](#showcontrols) hide and expose the
visualizer-specific control panels

[showPanel(panel_name)](#showpanelpanel_name) switch panel by showing desired panel_name, hiding the
others

[help()](#help) links to the visualizer-specific help page

```javascript
 */
import XMLGroup from '../js/XMLGroup.js';
import IsomorphicGroups from '../js/IsomorphicGroups.js';

export {load, hideControls, showControls, help, findGroup, showPanel};

const VISUALIZER_LAYOUT_URL /*: string */ = './visualizerFramework/visualizer.html';
let Group /*: XMLGroup*/;
let Help_Page /*: string*/;

/*
```
## load()
Start an ajax load of visualizer.html that, on successful completion, embeds the existing
visualizer-specific controls in the visualizer framework

It returns the just-started ajax load as an ES6 Promise

```javascript
*/
function load(group /*: ?XMLGroup */, help_page /*: string */) /*: Promise<void> */ {
   window.VC = this;
   if (group != undefined)
      Group = group;
   Help_Page = help_page;
   return new Promise( (resolve, reject) => {
      $.ajax( { url: VISUALIZER_LAYOUT_URL,
                success: (data /*: string */) => {
                   // The current body element contains visualizer-specific layout
                   // Detach it and save it for insertion into the visualizer framework below
                   const $customCode = $('body').children().detach();

                   // Replace the current body with content of visualizer.html, append resetTemplate
                   $('body').html(data);

                   // Remove controls-placeholder div and insert visualizer-specific code saved above
                   $('#controls-placeholder').remove();
                   $('#vert-container').prepend($customCode);

                   // Hide top right-hand 'hide-controls' icon initially
                   $( '#show-controls' ).hide();

                   resolve();
                },
                error: (_jqXHR, _status, err) => {
                   reject(`Error loading ${VISUALIZER_LAYOUT_URL} ${err === undefined ? '' : ': ' + err}`);
                }
              } );
   } )
}
/*
```
## hideControls()
Hide visualizer-specific control panels, resize graphic
```javascript
*/
function hideControls () {
   $( '#hide-controls' ).hide();
   $( '#show-controls' ).show();
   $( '#vert-container' ).hide().resize();
}
/*
```
## showControls()
Expose visualizer-specific control panels, resize graphic
```javascript
*/
function showControls () {
   $( '#hide-controls' ).show();
   $( '#show-controls' ).hide();
   $( '#vert-container' ).show().resize();
}
/*
```
## help()
Link to visualizer-specific help page
```javascript
*/
function help() {
   window.open(Help_Page);
}
/*
```
## findGroup()
Try to find this group in the Library based only on its structure
```javascript
*/
function findGroup() {
   const found = IsomorphicGroups.find( Group );
   if ( found ) {
      window.open( `./GroupInfo.html?groupURL=${encodeURIComponent( found.URL )}` );
   } else {
      alert( 'Group Explorer could not find this group in its library.' );
   }
}
/*
```
## showPanel(panel_name)
Switch panels by showing desired panel, hiding the rest
```javascript
*/
function showPanel(panel_name /*: string */) {
   $('#vert-container > .fill-vert').each( (_, control) => {
      const control_name = '#' + $(control).attr('id');
      if (control_name == panel_name) {
         $(control_name).show();
      } else {
         $(control_name).hide();
      }
   } )
}
/*
```
 */

