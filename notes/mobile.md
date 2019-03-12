
# Mobile GE3

There are several problems with running GE3 on a mobile device:

* Gestures are different, and much more limited
* Local storage is somewhat smaller
* Computing power is expected to be reduced

## Gestures

### Gestures used in GE3

* Group explorer, group info pages
   + click -- selections, links
   + resize -- resize window
   + mousemove/mouseleave/click -- background coloring in GroupExplorer
   + wheel -- scroll (built-in)

* Visualizers large graphic
   + click -- tooltip in large graphic (MT, CG)
   + hover -- tooltip in large graphic (CD) (removed by click)
   + dnd -- rotate large graphic (CD, SO); move large graphic (MT, CG)
   + shift-click dnd -- curve arc (CD, SO)
   + right-click dnd -- move large graphic (CD, SO)
   + shift-click dnd -- move row (MT)
   + right-click -- re-center large graphic (MT, CG)
   + wheel (mouse wheel, two-finger drag on Safari) -- zoom large graphic
   + mousemove/mouseleave/mousedown -- diy tooltip (CD)

* Visualizer panels
   + context-menu (right-click; two-finger tap on Safari) -- show menu
   + click -- select from menu
   + dbl-click -- show elements
   + wheel (mouse wheel, two-finder drag on Safari) -- scroll


### Gestures available on mobile device
(This seems a bit Apple-heavy, but from what I read Android is quite similar.)

From https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW1 :

* touch events (return structure with info on each finger touching the surface)
   + touchStart
   + touchMove
   + touchEnd
   + touchCancel (say touchMove gets aborted by a scroll event)

* events mapped to mouse events
   + mouseover
   + mousemove
   + mousedown
   + mouseup
   + click
   + wheel


From https://api.jquerymobile.com/category/events/ :

* jQuery mobile events
   + touchstart 
   + touchmove
   + touchend
   + tap
   + taphold
   + swipe
   + swipeleft
   + swiperight
   + scrollstart
   + scrollstop
   + vclick
   + vmousedown
   + vmousemove
   + vmouseout
   + vmouseover
   + vmouseout

### What works, what doesn't

* Group Explorer
   + No failures
* Group Info and related
   + No failures
* Visualizers large graphics
   + Cayley Diagram, Object of Symmetry
      - Mostly handled in trackballcontrols.js
      - Rotate, zoom, move all work
      - Tooltips are iffy
      - Re-center doesn't work
      - MathJax doesn't seem to work on header
   + Multtable, Cycle Graph
      - Move, tooltip work intermittently 
      - Zoom (within graphic), column dnd don't work at all
      - MathJax works on header
      - See how trackballcontrols.js handles mobile devices
* Visualizer panels
   + Subset display
      - Floating menus aren't invoked
      - Double-click causes built-in zoom in/out -- no elements display
      - MathJax seems to work (!?)
      - DnD in subset editor doesn't work
   + Diagram control
      - Floating menus aren't invoked
      - Faux selects work
      - Chunking works
      - Arrow display works
      - MathJax doesn't seem to work
   
### Tentative mobile gesture mapping

| Page | Function | Desktop | Mobile Gesture |
| ---- | -------- | ------- | -------------- |
| Group Explorer | follow link | click | tap |
| &nbsp; | highlight background | mouseover | N/A |
| &nbsp; | display tooltip | hover | tap-hold |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| Group Info | follow link | click | one-finger tap |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| 3D visualizer | display tooltip | hover* | tap-hold |
| &nbsp; | zoom | wheel | two-finger spread |
| &nbsp; | re-center | right-click | two-finger tap |
| &nbsp; | rotate** | dnd | one-finger dnd |
| &nbsp; | move | right-click dnd | two-finger dnd |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| 2D visualizer | display tooltip | click | one-finger tap |
| &nbsp; | zoom | wheel | two-finger spread |
| &nbsp; | re-center | right-click | two-finger tap |
| &nbsp; | move | dnd | one-finger dnd |
| (Multtable only) | swap rows | shift-click | two-finger dnd |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| Visualizer panel | select option | click | one-finger tap |
| &nbsp; | display menu | right-click | one-finger tap |
| &nbsp; | show elements | dbl-click | two-finger tap (dbl-tap?) |
| &nbsp; | subset editor dnd | dnd | one-finger dnd |

\* Cayley diagram only.  (Maybe make all visualizers use click gesture for tooltips?)<br>
\*\* re-curve line in Cayley diagram if drag started on a line

## Local storage

Local storage is generally limited to 10M on desktops, 5M on mobile devices. Currently about 3.8M of storage is used for the 60 groups in the 'standard' library, including pre-computed graphics. If this proves to be a problem we can 1) implement an LRU policy, or 2) re-create some of the currently cached graphics instead of caching them.

## Computing power

Computing power in current high-end phones and tablets is surprisingly good -- especially the graphics capability. Newer iPads and iPhones have no trouble computing the properties of the 168 group or displaying and manipulating its Cayley diagram. This seems to be a non-problem.

## Summary

GE is surprisingly close to being completely available on mobile devices. Some events will have to be re-mapped and the MathJax issues will have to be sorted, but local storage and limited compute power do not appear to be problems. 
