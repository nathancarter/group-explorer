# Visualizer framework HTML

Used by CayleyDiagram.html, CycleGraph.html, Multtable.html, SymmetryObject.html, and Sheet.html
```html
<body><div id="bodyDouble" class="vert">
   <div id="header" class="horiz"></div>
   <div id="horiz-container" class="horiz">
      <div id="graphic"></div>
      <div id="splitter"></div>
      <div id="vert-container" class="vert">
         <div id="controls-placeholder"></div> <!-- placeholder, replaced by visualizer-specific code in VC.load() -->
      </div>
   </div>
   <div class="top-right-menu">
      <div>
         <a href='index.html'>
            <i title="Project Home" class="fa fa-home fa-2x trm-black"></i></a>
         <a href='GroupExplorer.html'>
            <i title="Group Library" class="fa fa-book fa-2x trm-black"></i></a>
         <a href='Sheet.html' target='_blank'>
            <i title="Sheets" class="fa fa-file trm-black" style="font-size:1.5em;vertical-align:10%;"></i></a>
         <a href='javascript:VC.findGroup()' id='find-group'>
            <i title="Find This Group" class="fa fa-search trm-black" style="font-size:1.75em;vertical-align:10%;"></i></a>
         <a href='javascript:VC.help()'>
            <i title="Help" class="fa fa-question-circle fa-2x trm-black"></i></a>
         <a href='https://github.com/nathancarter/group-explorer'>
            <i title="Source on GitHub" class="fa fa-github fa-2x trm-black"></i></a>
         <a href='javascript:VC.hideControls();' id='hide-controls'>
            <i title="Hide controls" class="fa fa-chevron-circle-right fa-2x trm-black"></i></a>
         <a href='javascript:VC.showControls();' id='show-controls'>
            <i title="Show controls" class="fa fa-chevron-circle-left fa-2x trm-black"></i></a>
      </div>
      <div id="version" style="float: right; font-size: small"></div>
      <script type="module">
       import {Version} from './Version.js';

       document.getElementById('version').textContent = Version.label;
      </script>
   </div>
```
#### Menu-Submenu Link Template
A template to make a styled &lt;li&gt; element to link a menu to a submenu in a cascaded menu;
used by [Menu.makeLink()](../js/Menu.md#menumakelinklabel-link).

It refers to the following variables when eval'd (see [Template](../js/Template.md) for more details on Template evaluation):
  * label -- text to be displayed in generated &lt;li&gt; element
  * link -- submenu id

```html
   <template id="link-template">
      <li action="Menu.pinSubMenu(event)" link="${link}">
         ${MathML.sansText(label)} <span class="menu-arrow"></span> </li>
   </template>
</div></body>
```

