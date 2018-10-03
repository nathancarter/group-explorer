/*
# Visualizer framework stylesheet

```css
*/

/* causes web page to fill the window */
body {
   margin: 0;
   height: 100%;
   width: 100%;
}

/* provides a common button appearance across visualizers */
button {
   -webkit-appearance: none;
   background-color: #FFFFFF;
   border: 1px solid #A4A4A4;
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
   background-color: #D0D0D0;
   justify-content: center;
   align-items: center;
   font-size: 40px;
   height: 60px;
   flex: 0 1 60px;
}

/* horizontal container for everything but the header; stretches to fill the height available */
#horiz-container {
   flex: 1 1 auto;
   height: 100%;
   xtouch-action: none;   /* for splitter */
}

/* container for main graphic, generally a <canvas>; flexes to fill the width available */
#graphic {
   flex: 1 1 auto;
   background-color: #F0F0F0;
   width: 100%;
}

/* grab here to resize graphic; changes cursor */
#splitter {
   flex: 0 0 auto;
   width: 8px;
   background: #ECECEC;
   cursor: col-resize;
}

/* container for arranging visualizer-specific controls and the help/reset buttons in vertical stack */
#vert-container {
   flex: 1 1 auto;
   width: 400px;
}

/* control panel style */
#control-options {
   background-color: #ECECEC;
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
   background-color: #E2E2E2;
}

/* style select pull-downs */
.select {
   height: 30px;
   font-size: 16px;
   width: 90%;
   margin: 0 5% 25px 5%;
}

/* container to hold help and reset buttons */
#help-reset {
   background-color: #ECECEC;
   justify-content: space-around;
   align-items: center;
   height: 44px;
}

/* styles help and reset buttons */
#help-reset > button {
   width: 48%;
   -webkit-appearance: none;
   background-image: linear-gradient(#F6F6F6, #C0C0C0);
   border: 1px solid #7E7E7E;
   height: 30px;
   font-size: 14pt;
}

/*
```
*/

