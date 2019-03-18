
# Visualizer exemplar

This is the pattern used to write the visualizers like CayleyDiagram and Multtable. The entire code of example is contained below, with comments
interspersed.

## Visualizer invocation

The visualizer exemplar may be viewed in the browser by entering a URL like
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/docs/visualizerExemplar.html?groupURL=../groups/D_4.group,
<br>which passes the visualizer the URL of a group definition in .group file XML, or
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/docs/visualizerExemplar.html?groupJSON=../groups/D_4.json,
<br>which passes the visualizer the URL of a group definition in JSON format. (Note that this won't work with the current release -- there are no .json files in the library.)

In the normal use of GE3 the visualizers are opened from the GroupInfo page by selecting one of the visualizer thumbnails. The GroupInfo
page opens the visualizer with a URL like
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/Multtable.html?groupURL=./groups/D_4.group
<br>passing it a URL referencing a group definition in XML (.group) format. Other parameters may also be passed in the URL.
For example, this invocation of a Cayley diagram
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/CayleyDiagram.html?groupURL=./groups/S_4.group&diagram=Truncated%20cube
<br>specifies that the `Truncated cube` diagram is to be displayed initially.

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
      <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=MML_CHTML"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/jquery-resizable-dom@0.32.0/dist/jquery-resizable.js"></script>
      <script src="./build/allGroupExplorer.js"></script>
      <script src="./build/allVisualizer.js"></script>
```
```javascript
      <script>
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
## Visualizer framework loading

Invokes [VC.load()](visualizerFramework_js.md#vc-load-) to wrap visualizer framework layout around visualizer-specific controls
```javascript
       /* Load the static components of the page */
       function load() {
          // Create a Promise to load group from invocation URL
          const groupLoad = Library
             .loadFromURL()
             .then( (_group) => group = _group )
             .catch( console.error );

          // Create a Promise to load visualizer framework around visualizer-specific code in this file
          const bodyLoad = VC.load();

          // When group and framework are loaded, insert subset_page and complete rest of the setup
          Promise.all([groupLoad, bodyLoad])
                 .then( () => SSD.load($('#subset-control')).then(completeSetup) )
                 .catch( console.error );
       }

       /*
```
## Exemplar initialization
```javascript
       /* Now that all the static HTML is loaded, complete the setup */
       function completeSetup() {
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

          VC.showPanel('#subset-control');
          resizeBody();
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
## Visualizer-specific HTML

The body contains the visualizer-specific HTML to lay out the controls for this visualizer.  This HTML will be wrapped in the visualizer framework by [VC.load()](./visualizerFramework_js.md#vc-load-), called during [initialization](#visualizer-framework-loading).

Note the use of [faux-select](visualizerFramework_css.md#faux-select) and associated classes to simulate an HTML select element with HTML and MathML formatted text.
```html
   <body class="vert">
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
            <ul id="organization-choices" class="faux-select-options hidden"></ul>
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
   </body>
</html>
```
