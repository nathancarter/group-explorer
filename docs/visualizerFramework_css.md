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

/* Make the web page to fill the window */
body {
   margin: 0;
   overflow: hidden;
   height: 100%;
   width: 100%;
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

/* identifies vertical and horizontal flex containers */
.vert {
   display: flex;
   flex-direction: column;
}
.horiz {
   display: flex;
   flex-direction: row;
}

/* header format, like <H1> in a graphical context */
#header {
   background-color: var(--visualizer-header-background);
   justify-content: center;
   align-items: center;
   font-size: 40px;
   height: 60px;
   flex: 0 0 60px;
}

/* horizontal container for everything but the header; stretches to fill the height available */
#horiz-container {
   flex: 1 1 auto;
   height: 100px;
   xtouch-action: none;   /* for splitter */
}

/* container for main graphic, generally a <canvas>; flexes to fill the width available */
#graphic {
   flex: 1 1 auto;
   background-color: var(--visualizer-body-background);
   width: 100px;
}

/* grab here to resize graphic; changes cursor */
#splitter {
   flex: 0 0 auto;
   width: 8px;
   background: var(--visualizer-body-background);
   cursor: col-resize;
}

/* container for arranging visualizer-specific controls and the help/reset buttons in vertical stack */
#vert-container {
   flex: 0 0 auto;
   width: 400px;
}

/* buttons for choosing control panel (may convert to tabs) */
#control-options {
   background-color: var(--visualizer-body-background);
   justify-content: center;
   height: 42px;
}
#control-options > button {
   min-width: 15%;
}

/* element stretches to fill vertical spaces, and adds scroll bar if needed */
.fill-vert {
   height: 100%;
   overflow: auto;
}

/* background for visualizer-specific controls */
.control {
   background-color: var(--visualizer-controls-background);
}

/* container to hold help and reset buttons */
#help-reset {
   background-color: var(--visualizer-body-background);
   justify-content: space-around;
   align-items: center;
   height: 44px;
}

/* styles help and reset buttons */
#help-reset > button {
   width: 48%;
}

/*
```
### faux-select
Faux-select and associated classes are used to style a select-like structure. Faus-select-options can contain not just text but HTML and therefore MathML, making them better suited for mathematical text than simple HTML select options.
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
}

.faux-selection {
    display: inline-block;
    position: relative;
    top: 55%;
    padding-left: 0.5em;
    transform: translateY(-50%);
}

.faux-select-arrow {
    top: 50%;
    transform: translateY(-50%);
    border-top: 16px solid #000000;
    border-right: 6px solid rgba(0,0,0,0);
    border-left: 6px solid rgba(0,0,0,0);
    margin-right: 4px;
    content: '';
    float: right;
    height: 0;
    width: 0;
    position: relative;
}

.faux-select-options {
    margin: 1.6em 0 0 -1;
    position: absolute;
    background-color: #EEEEEE;		/* very light gray (~gainsboro)*/
    border: 1px solid #CFCFCF;		/* ~silver */
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);	/* gray mist */
    color: #000000;	
    padding: 4px 8px;
    z-index: 20;
    list-style-type: none;
    max-height: 40em;
    overflow-y: auto;
}
/*
```
 */

