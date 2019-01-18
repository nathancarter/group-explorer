# Visualizer framework HTML

Used by CayleyDiagram.html, CycleDiagram.html, Multtable.html, SymmetryObject.html, and Sheet.html
```html
<body class="vert">
   <div id="header" class="horiz"></div>
   <div id="horiz-container" class="horiz">
      <div id="graphic"></div>
      <div id="splitter"></div>
      <div id="vert-container" class="vert">
         <div id="controls-placeholder"></div> <!-- placeholder, replaced by visualizer-specific code in VC.load() -->
         <div id="help-reset" class="horiz">
            <button id="help">Help</button>
            <button id="reset">Reset</button>
         </div>
      </div>
   </div>
</body>
```
