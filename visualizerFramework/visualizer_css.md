/*
# Visualizer framework stylesheet
```css
 */

/* Commonly used values for various grays */
:root {
   --visualizer-header-background:	#D0D0D0;
   --visualizer-body-background:	#E5E5E5;
   --visualizer-controls-background:	#F2F2F2;
   --visualizer-button-gradient:	linear-gradient(#DDDDDD, #C0C0C0);
   --visualizer-button-border:		#7E7E7E;
}

/* General element styles in visualizer */
button {
   background-image: var(--visualizer-button-gradient);
   border: 1px solid var(--visualizer-button-border);
   height: 30px;
   font-size: 14pt;
}
button:focus {
   outline: 0;
}

/* Make the web page fill the window */
body, #bodyDouble {
   margin: 0;
   overflow: hidden;
   height: 100%;
   width: 100%;
}

/* Container for the entire grid display */
#bodyDouble {
   display: grid;
   grid-template-columns: minmax(0, 1fr) 8px auto;
   grid-template-rows: auto minmax(0, 1fr);
   grid-template-areas: "header header header" "graphic splitter controls";
}

/* header format, like <H1> in a graphical context */
#header {
   grid-area: header;
   background-color: var(--visualizer-header-background);
   display: grid;
   grid-template-columns: 1fr auto;
   grid-template-areas: "heading top-right-menu";
}

#heading {
   grid-area: heading;
   background-color: rgba(0,0,0,0);
   font-size: 40px;
   padding: 10px 0;
   text-align: center;
   overflow-x: hidden;
}

#top-right-menu {
   grid-area: top-right-menu;
   background-color: rgba(0, 0, 0, 0);
   margin: 10px 10px 0 0;
}

/* container for main graphic, generally a <canvas>; fills the width available */
#graphic {
   grid-area: graphic;
   background-color: var(--visualizer-body-background);
}

/* grab here to resize graphic; changes cursor */
#splitter {
   grid-area: splitter;
   background: var(--visualizer-body-background);
   width: 8px;
   cursor: col-resize;
}

/* container for visualizer-specific controls */
#controls {
    grid-area: controls;
}

/* background for visualizer-specific controls */
.control {
   background-color: var(--visualizer-controls-background);
}

/*
```
### faux-select
Faux-select and associated classes are used to style a select-like structure. Faux-select-options can contain not just text but HTML, making them better suited for mathematical text than simple HTML select options.
  * .faux-select: &lt;div&gt; which contains the entire structure
  * .faux-selection: &lt;div&gt; which contains the current selection
  * .faux-select-arrow: a css down-arrow to the right of the selection
  * .faux-select-options: &lt;ul&gt; with &lt;li&gt; options

```css
 */
.faux-select {
    border: 1px solid var(--visualizer-button-border);
    background-image: var(--visualizer-button-gradient);
    font-size: 12pt;
    width: 90%;
    height: 1.5em;
    margin: 0 5% 0 5%;
    position: relative;
    display: inline-block;
}

.faux-selection {
    display: inline-block;
    white-space: nowrap;
}

.faux-select-arrow {
    top: 4;
    right: 0;
    border-top: 16px solid #000000;
    border-right: 6px solid rgba(0,0,0,0);
    border-left: 6px solid rgba(0,0,0,0);
    margin-right: 4px;
    position: absolute;
}

.faux-select-options {
    transform: translate(-1px, -1em);
    background-color: #EEEEEE;		/* very light gray (~gainsboro)*/
    border: 1px solid #CFCFCF;		/* ~silver */
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);	/* gray mist */
    color: #000000;	
    padding: 4px 8px;
    z-index: 20;
    list-style-type: none;
    max-height: 40em;
    overflow-y: auto;
    position: absolute;
}
/*
```
 */
