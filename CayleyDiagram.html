<!--
     Cayley diagram visualizer
-->
<html>
   <head>
      <title>Cayley Diagram Visualizer</title>

      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <meta name="GE3-GITVersion" content="3.6.1">

      <link rel="icon" type="image/png" href="./images/favicon.png"></link>
      <link rel="stylesheet" href="./style/fonts.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/menu.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/sliders.css" type="text/css"></link>
      <link rel="stylesheet" href="./visualizerFramework/visualizer.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/SubsetHighlightController.css" type="text/css"></link>
      <link rel="stylesheet" href="./style/CayleyDiagramController.css" type="text/css"></link>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">

      <style>
       #graphic {
          background-color: #E8C8C8;
          -webkit-user-select: none;
       }

       #controls {
           min-width: 350px;
       }

       #view-control {
           padding: 0.2em;
       }
       
       .tooltip ul {
          margin: 0;
          padding-inline-start: 1em;
       }
      </style>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
      <script src="./refreshVersion.js"></script>
      <script type="module">
       import {check} from './js/Migration.js'
       import {load} from "./CayleyDiagram.js";
       window.addEventListener('load', () => check().then(load))
      </script>
   </head>
   <body>
     <div id="bodyDouble">
       <div id="header">
         <div id="heading"></div>
       </div>
			 <div id="display">
				 <div id="graphic"></div>
         <div id="controls">
           <div id="options">
             <button id="subset-button"
                     onclick="$('#control > *').hide(); $('#subset-control').show()">Subsets</button>
             <button id="view-button"
                     onclick="$('#control > *').hide(); $('#view-control').show()">View</button>
             <button id="diagram-button"
                     onclick="$('#control > *').hide(); $('#diagram-control').show()">Diagram</button>
           </div>

           <div id="control">
             <div id="subset-control">
               <!-- This is filled in by subsetDisplay/subsets.html -->
             </div>

             <div id="view-control" class="hidden">
               <!-- This is filled in by cayleyViewController/view.html -->
             </div>

             <div id="diagram-control" class="hidden">
               <!-- This is filled in by diagramController/diagram.html -->
             </div>
           </div>
         </div>
			 </div>
     </div>
   </body>

   <!-- Templates for tooltips -->
   <template id="single-object-template">
      <div id="tooltip" class="tooltip remove-on-clean" objectIDs="${objectIDs_string}">${top}</div>
   </template>

   <template id="double-object-template">
      <div id="tooltip" class="tooltip remove-on-clean" objectIDs="${objectIDs_string}">
         <b>In front:</b> ${top}<br>
         <b>Behind:</b> ${rest[0]}
      </div>
   </template>

   <template id="multi-object-template">
      <div id="tooltip" class="tooltip remove-on-clean" objectIDs="${objectIDs_string}">
         <b>In front:</b> ${top}<br>
         <b>Others behind:</b>
         <ul>
            ${rest.map( function (obj) { return `<li>${obj}</li>` } ).join('')}
         </ul>
      </div>
   </template>
</html>
