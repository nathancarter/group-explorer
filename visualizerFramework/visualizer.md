/* @flow
# Visualizer framework javascript

[load()](#load) embeds the visualizer-specific control panels in a copy of the visualizer
framework. It is called immediately after document load by CayleyDiagram.html, CycleGraph.html,
Multtable.html, SymmetryObject.html, and Sheet.html

[hideControls()](#hidecontrols) and [showControls()](#showcontrols) hide and expose the
visualizer-specific control panels

[showPanel(panel_name)](#showpanelpanel_name) switches from one visualizer-specific control panel
to another by showing desired panel_name and hiding the others

[findGroup()](#findGroup) try to find this group in the Library based only on its structure

[help()](#help) links to the visualizer-specific help page

[Change broadcast](#change-broadcast) functions enable/disable the capability to send change notifications
from a visualizer to a Sheet.

```javascript
 */
import GEUtils from '../js/GEUtils.js'
import IsomorphicGroups from '../js/IsomorphicGroups.js';
import Log from '../js/Log.js';
import XMLGroup from '../js/XMLGroup.js';
import {Version} from '../Version.js';

const VISUALIZER_LAYOUT_URL = './visualizerFramework/visualizer.html';

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
export async function load (group /*: ?XMLGroup */, help_page /*: string */) /*: Promise<void> */ {
   window.VC = this
   if (group != undefined)
      Group = group
   Help_Page = help_page

  const data = await GEUtils.ajaxLoad(VISUALIZER_LAYOUT_URL)
  $('#header').append(data) // append the top right-hand icon strip, etc. to header
  $('#show-controls').hide() // Hide top right-hand 'hide-controls' icon initially
  if (group != undefined && group.URL != undefined)
    $('#find-group').hide()
  $('#version').text(Version.label)
}
/*
```
## hideControls()
Hides visualizer-specific control panels and resizes the main graphic
```javascript
*/
export function hideControls (element = '#controls') {
   $( '#hide-controls' ).hide();
   $( '#show-controls' ).show();
   $(element).hide();
}
/*
```
## showControls()
Exposes visualizer-specific control panels and resizes the main graphic to fit
```javascript
*/
export function showControls (element = '#controls') {
   $( '#hide-controls' ).show();
   $( '#show-controls' ).hide();
   $(element).show();
}
/*
```
## showPanel(panel_name)
Switches among visualizer-specific control panels by showing the desired panel and hiding the rest
```javascript
*/
export function showPanel (panel_name /*: string */) {
   $('#controls > .panel').each( (_, control) => {
      const control_name = '#' + $(control).attr('id');
      if (control_name == panel_name) {
         if ($(control_name).css('display', 'none')) {
            $(control_name).show().resize();
         }
         $(control_name).css('visibility', 'visible');
      } else {
         $(control_name).css('visibility', 'hidden');
      }
   } )
}
/*
```
## help()
Link to visualizer-specific help page
```javascript
*/
export function help () {
   window.open(Help_Page);
}
/*
```
## findGroup()
Try to find this group in the Library based only on its structure
```javascript
*/
export function findGroup () {
   const found = IsomorphicGroups.find( Group );
   if ( found ) {
      window.open( `./GroupInfo.html?groupURL=${encodeURIComponent( found.URL )}` );
   } else {
      alert( 'Group Explorer could not find this group in its library.' );
   }
}
/*
```
## Change broadcast
When a Sheet spawns an editor to modify one of the visualizers being displayed, the
changes in the editor are broadcast back to the Sheet using the `window.postMessage()`
function. Since ability to function as an editor is common across the visualizers, it
has been abstracted here. 

The module variable`broadcastChange`holds the particular function used to send a change
message.

`disableChangeBroadcast`disables the broadcast capability by setting`broadcastChange`to a
do-nothing function. This is the initial state.

`enableChangeBroadcast`is passed a function that takes no arguments and generates JSON.
This would typically be something like`() => MulttableView.toJSON().`From the passed function
a`changeBroadcaster`is created and stored in`broadcastChange.`The`changeBroadcaster`compares
the current JSON with JSON from the previous invocation and posts the new JSON if there is a change.
```javascript
*/
export let broadcastChange = () => {};

export function disableChangeBroadcast () {
    broadcastChange = () => {};
}

export function enableChangeBroadcast (json_generator /*: () => Obj */) {
    broadcastChange = (function (_json_generator) {
        let last_json_string;
        
        function changeBroadcaster () {
            const current_json = _json_generator();
            const current_json_string = JSON.stringify(current_json);
            if (current_json_string != last_json_string) {
                last_json_string = current_json_string;
                const msg = {
                    source: 'editor',
                    json: current_json,
                };
                window.postMessage( msg, new URL(window.location.href).origin );
            }
        }

        return changeBroadcaster;
    }) (json_generator);
}
/*
```
 */
