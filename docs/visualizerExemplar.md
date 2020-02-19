
# Visualizer exemplar

This is the pattern used to write the visualizers like CayleyDiagram and Multtable. The entire code of example is contained below, with comments
interspersed.

## Visualizer invocation

The visualizer exemplar may be viewed in the browser by entering a URL like
     <br>&nbsp;&nbsp;&nbsp;&nbsp;
     [http://.../group-explorer/docs/visualizerExemplar.html?groupURL=../groups/D_4.group](
     ./visualizerExemplar.html?groupURL=../groups/D_4.group),
<br>which passes the visualizer the URL of a group definition in .group file XML, or
     <br>&nbsp;&nbsp;&nbsp;&nbsp;
     [http://.../group-explorer/docs/visualizerExemplar.html?groupJSON=../groups/D_4.json](
     ./visualizerExemplar.html?groupJSON=../groups/D_4.json),
<br>which passes the visualizer the URL of a group definition in JSON format. (Note that this won't work with the current release -- there are no .json files in the library.)

In the normal use of GE3 the visualizers are opened from the GroupInfo page by selecting one of the visualizer thumbnails. The GroupInfo
page opens the visualizer with a URL of the form
     <br>&nbsp;&nbsp;&nbsp;&nbsp;
     [http://.../group-explorer/Multtable.html?groupURL=groups/D_4.group](
     ../Multtable.html?groupURL=groups/D_4.group),
<br>passing it a URL referencing a group definition in XML (.group) format. Other parameters may also be passed in the URL.
For example, this invocation of the Cayley diagram visualizer
     <br>&nbsp;&nbsp;&nbsp;&nbsp;
     [http://.../group-explorer/CayleyDiagram.html?groupURL=groups/S_4.group&diagram=Truncated%20cube](
     ../CayleyDiagram.html?groupURL=groups/S_4.group&diagram=Truncated%20cube)
<br>initially displays the `Truncated cube` diagram of the S<sub>4</sub> group.

## Visualizer display

The visualizer exemplar displays
- a formatted header with the name of the group passed in the URL
- a blank graphic element
- a functional splitter element that can be used to resize the graphic and the controls panel
- a functional subgroup control panel, common to several of the visualizers
- a non-functional view control panel, with examples of a select element and a couple of sliders
- buttons to choose between viewing the subgroup control panel and the view control panel

Other visualizers extend the exemplar with different displays in the graphic element and specialized control panels that interact with the display.

```html
<html>
   <head>
      <meta charset="utf-8" />
      <base href=".."></base>

      <link rel="icon" type="image/png" href="./images/favicon.png"></link>
      <link rel="stylesheet" href="./style/fonts.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/sliders.css" type="text/css"></link>
      <link rel="stylesheet" href="./visualizerFramework/visualizer.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/menu.css" type="text/css"></link>
      <link rel="stylesheet" href="./subsetDisplay/subsets.css" type="text/css"></link>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">

      <style>
       #view-control {
          background: #E2E2E2;
          display: none;
       }
      </style>

      <script type="text/x-mathjax-config">
       MathJax.Hub.Config({
          CommonHTML: {
             scale: 95,   /* scale MathJax to match the HTML around it */
          },
          showMathMenu: false,   /* disable MathJax context menu (it interferes with subsetDisplay context menu) */
       });
      </script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.6/MathJax.js?config=MML_CHTML"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/jquery-resizable-dom@0.32.0/dist/jquery-resizable.js"></script>
```
## Visualizer Javascript
     
(The following code would generally be found in a separate .js file, not in the .html file.)
```javascript
      <script type="module">
       import Library from './js/Library.js';
       import Log from './js/Log.js';
       import MathML from './js/MathML.js';
       import Template from './js/Template.js';
       import * as VC from './visualizerFramework/visualizer.js';
       import * as SSD from './subsetDisplay/subsets.js';
       
       /* Global variables */
       var group;  // group about which information will be displayed
       const HELP_PAGE = 'help/index.html';

       /* Initial entry to javascript -- called once after document load */
       $(window).one('load', load);

       /*
        * Register static event managers -- called after document is assembled
        *    (The .off(--).on(--) sequence is used to avoid accumulating event handlers after a reset.)
        */
       function registerEventHandlers() {
          $('#subset-button').on('click', () => VC.showPanel('#subset-control') );
          $('#view-button').on('click', () => VC.showPanel('#view-control') );
          $(window).off('resize', resizeBody).on('resize', resizeBody);
       }

/*
```
### Asynchronous loading

Asynchronous tasks are generally presented as ES6 Promises in GE. Since the [Library](../js/Library.js) will request the group definition from a server if it doesn't have a copy locally, the [loadFromURL()](../js/Library.js) method returns a Promise, not the group itself.

Note the [MathML preload](../js/MathML.js#preload). This is often desirable since it avoids having to perform many small asynchronous activities in subsequent MathMLcalls, which together can take considerably longer than a single consolidated action at the start. 
```javascript
       /* Load the static components of the page */
       function load() {
          // Create a Promise to load group from invocation URL
          const groupLoad = Library
             .loadFromURL()
             .then( (_group) => {
                group = _group;
                MathML.preload(group)  // Create a promise to preload the MathML cache
                      .then( () => completeSetup() )
                      .catch( Log.err );
             } )
       }
/*
```
### Exemplar initialization
```javascript
       /* Now that all the static HTML is loaded, complete the setup */
       function completeSetup() {
          SSD.load($('#subset-control'), undefined, undefined, group);
          
          // Document is assembled, register event handlers
          registerEventHandlers();

          // Create header from group name and queue MathJax to typeset it
          $('#header').html('Visualizer Example for&nbsp;' + MathML.sans(group.name));
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);

          $('#organization-choices').append(
             $('<li onclick="choose(0)">').html(MathML.sans('<mtext>none</mtext>')));
          for (let subgroupIndex = 1; subgroupIndex < group.subgroups.length-1; subgroupIndex++) {
             const subgroup = group.subgroups[subgroupIndex];
             const option = eval(Template.HTML('organization-choice-template'));
             $('#organization-choices').append(option);
          }
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'organization-choices',
                             () => $('#organization-choice').html($('#organization-choices > li:first-of-type').html())]);

          
          // Register the splitter with jquery-resizable, so you can resize the graphic horizontally
          // by grabbing the border between the graphic and the subset control and dragging it
          $('#vert-container').resizable({
             handleSelector: '#splitter',
             resizeHeight: false,
             resizeWidthFrom: 'left',
             onDrag: function () {
                // Code to resize the graphic goes here, if needed
             }
          });

          resizeBody();

          // Load icon strip in upper right-hand corner
          VC.load();
       }

       /*
        * Resize the body (including the graphic, if necessary).
        */
       function resizeBody() {
          $('body').height(window.innerHeight);
          $('body').width(window.innerWidth);
       }

       /* Example event handler, set up in registerCallback */
       function choose(subgroupIndex) {
          $('#organization-choice').html($(`#organization-choices > li:nth-of-type(${subgroupIndex+1})`).html());
       }
      </script>
   </head>
```
## HTML

The HTML lays out the visualizer elements in the [format](./visualizerLayout.md) used by GE3.

A string of icons is placed in the upper right-hand corner of the screen by [VC.load()](../visualizerFramework/visualizer.md#vc-load-) during [initialization](#visualizer-framework-loading) and does not appear in the static HTML below.

Note the use of [faux-select](../visualizerFramework/visualizer_css.md#faux-select) and associated classes to simulate an HTML select element with HTML and MathML formatted text.
```html
   <body>
      <div id="bodyDouble" class="vert">
         <div id="header" class="horiz"></div>
         <div id="horiz-container" class="horiz">
            <div id="graphic"></div>
            <div id="splitter"></div>
            <div id="vert-container" class="vert">
               <div id="control-options" class="horiz">
                  <button id="subset-button">Subsets</button>
                  <button id="view-button">View</button>
               </div>

               <div id="subset-control" class="fill-vert">
                  <!-- This is filled in by subsetDisplay/subsets.html -->
               </div>

               <div id="view-control" class="fill-vert">
                  <p>Organize by subgroup:</p>
                  <div id="organization-select" class="faux-select" onclick="$('#organization-choices').toggle()">
                     <ul id="organization-choices" class="faux-select-options hidden hide-on-clean"></ul>
                     <span id="organization-choice" class="faux-selection">none</span>
                     <div class="faux-select-arrow" ></div>
                  </div>
                  <template id="organization-choice-template">
                     <li onclick="choose(${subgroupIndex})">
                        ${MathML.sans(MathML.sub('H', subgroupIndex) + '<mo>,</mo><mtext>a subgroup of order&nbsp;</mtext><mn>' +
                        subgroup.order + '</mn>')}
                     </li>
                  </template>

                  <p>Zoom level:</p>
                  <input id="zoom-level" type="range" min="-10" max="10" value="0">

                  <p>Line thickness:</p>
                  <input id="line-thickness" type="range" min="1" max="20" value="10">
               </div>
            </div>
         </div>
      </div>
   </body>
</html>
```
