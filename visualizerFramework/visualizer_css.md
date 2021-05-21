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
   display: flex;
   flex-direction: column;
}

/* header format, like <H1> in a graphical context */
#header {
   display: grid;
   grid-template-columns: 1fr auto;
   grid-template-areas: "heading top-right-menu";
   padding: 10px 10px 3px;
   background-color: var(--visualizer-header-background);
}

#heading {
   grid-area: heading;
   margin: auto 0;
   background-color: rgba(0,0,0,0);
   font-size: 40px;
   text-align: center;
   overflow-x: hidden;
}

#top-right-menu {
   grid-area: top-right-menu;
   margin: auto 0;
   background-color: rgba(0, 0, 0, 0);
}

/* container for main graphic, generally a <canvas>; fills the width available */
#graphic {
   position: relative;
   flex-grow: 1;
   overflow: hidden;
   background-color: var(--visualizer-body-background);
}

/* container for visualizer-specific controls */
#controls {
   position: absolute;
   top: 0;
   right: 0;
   bottom: 0;
   display: flex;
   flex-direction: column;
   min-width: 300px;
   border-left: 1px solid #aaa;
}
#options {
   background-color: var(--visualizer-body-background);
   text-align: center;
   border-bottom: 1px solid #aaa;
}
#options > button {
   margin: 0 0.2em 0.5em;
   min-width: 15%;
}
#control {
   flex-grow: 1;
   overflow-y: auto;
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
