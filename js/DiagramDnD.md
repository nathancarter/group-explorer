/* @flow

# Cayley Diagram Manual Rearrangement
The [Cayley diagram visulizer](../help/rf-um-cd-options/index.html) lets users customize the
appearance of a [Cayley diagram](../help/rf-groupterms/#cayley-diagrams) by [repositioning the
nodes](../help/rf-um-cd-options/index.html#changing-the-positions-of-nodes-in-the-diagram) and
[adjusting the degree to which the arcs in the diagram are
curved](../help/rf-um-cd-options/index.html#changing-the-arcing-of-arrows-in-the-diagram).  The
**DiagramDnD** class in this file handles the drag-and-drop operations that implement this
capability, updating the Cayley diagram and redrawing the graphic as needed.

## Life cycle
The [Cayley diagram visualizer page](../CayleyDiagram.js) creates a **DiagramDnD** instance during
initialization and places a reference in the global variable `DnD_handler`. It is bound to the large
Cayley diagram and listens to mouse/touch events on the canvas. (There is no use for this variable
after initialization, it exists only for debugging.)

## Event handling
The [DiagramDnD constructor](#constructor) sets up the event handlers to listen for the start of a
rearrangement. Since mouse and touch events work a bit differently and it is confusing to handle
both within the same code, there are separate [mouse](#mouse-event-handler) and
[touch](#touch-event-handler) handlers in **DiagragDnD**. The event handlers recognize these events
associated with diagram rearrangement:
* The start of a rearrangement is indicated by a *shift-mousedown* or *one-point touchstart* over a
  node or arc. The [pickedObject3D()](#find-picked-object) method returns the node or arc over which
  the event occurred, or *null* if there isn't one (and thus the event is not the start of a
  rearrangement). Upon starting a rearrangement the handlers register as listeners for *move* and
  *end* events, which have been ignored until now in the interests of performance.
* The handlers store location information from subsequent *shift-mousemove*\/*touchmove* events as
  they are received, which are used by the [asynchronous painter](#asynchronous-painting) to perform
  the actual diagram changes.
* The end of an ongoing rearrangement is indicated by a *shift-mouseup* or *touchend* event. Upon
  termination the handlers call[`repaint`](#asynchronous-painting)directly to update the diagram one
  last time, followed by a call to [endDrag()](#end-drag) to clean up.
* An unexpected event will abort a rearrangement in progress by calling [endDrag()](#end-drag).

Note that **DiagramDnD** handles events for the &lt;canvas&gt; element, before they bubble up to
the containing &lt;div&gt;. Thus, when the handler identifies a drag-and-drop-related event, it
prevents it from propagating up the DOM tree, where it would be interpreted as a command to display
a tooltip or to rotate the visualization.
 
## Drawing
Redrawing the main graphic is done asynchronously to the main event handling in order to keep
potentially time-consuming graphics operations from tying up the main thread and stacking up user
interface events. Depending on the type of object originally picked, node or arc, the [asynchronous
painting](#asynchronous-painting) routine
calls[`redrawArc()`](#redraw-arc)or[`redrawSphere()`](#redraw-sphere)to rearrange the
[DiagramDisplay scene](./DisplayDiagram.js#scene).  Actual rerendering of the scene occurs on the59
next execution of the [DisplayDiagram render() automation routine](./DisplayDiagram.js#render).

```js
*/
import {CayleyDiagramView} from './CayleyDiagramView.js';
import GEUtils from './GEUtils.js';
import Log from './Log.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import type {ArrowData, NodeData, ArrowUserData, NodeUserData} from './CayleyDiagramView.js';
*/

export default class DiagramDnD {
/*::
   cayley_diagram_view: CayleyDiagramView;
   canvas: HTMLCanvasElement;
   eventLocation: THREE.Vector2;  // position of the last mouse/touch event
                                  //    (note that we don't drag-and-drop on multi-touch events)
   raycaster: THREE.Raycaster;
   mouse_handler: (MouseEvent) => void;
   touch_handler: (TouchEvent) => void;
   async_painter: ?number;  // asyncPainter timeoutID; null if asyncPainter not queued
   start_time: number;  // time of first touch event
   picked_object: ?({node: NodeData} | {arrow: ArrowData});
 */
/*
```
### Constructor
Registers event handlers for touch or non-touch devices, as appropriate.
```js
*/
   constructor (cayley_diagram_view /*: CayleyDiagramView */) {
      this.cayley_diagram_view = cayley_diagram_view;
      this.canvas = cayley_diagram_view.renderer.domElement;
      this.eventLocation = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.linePrecision = 0.02;
      this.async_painter = null;
      this.picked_object = null;

      if (GEUtils.isTouchDevice()) {
         this.touch_handler = (touchEvent /*: TouchEvent */) => this.touchHandler(touchEvent);
         this.canvas.addEventListener('touchstart', this.touch_handler);
      } else {
         this.mouse_handler = (mouseEvent /*: MouseEvent */) => this.mouseHandler(mouseEvent);
         this.canvas.addEventListener('mousedown', this.mouse_handler);
      }
   }
/*
```
### Mouse event handler

The mouse event handler starts and stops the drag-and-drop operation and updates the current event
location in`this.eventLocation.` Modifying the diagram is not generally done directly from this
routine; that is usually done from[`asyncPainter().`](#asynchronous-painting) An exception occurs
on normal termination by _shift-mouseup_, on which the handler
calls[`repaint()`](#asynchronous-painter)directly to update the diagram one last time.

```js
*/
   mouseHandler (mouseEvent /*: MouseEvent */) {
      if (!mouseEvent.shiftKey) {
         this.endDrag();
         return;
      }

      const bounding_box = this.canvas.getBoundingClientRect();
      this.eventLocation.x = ( (mouseEvent.clientX - bounding_box.left) / this.canvas.width) * 2 - 1;
      this.eventLocation.y = -( (mouseEvent.clientY - bounding_box.top) / this.canvas.height) * 2 + 1;

      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();

      switch (mouseEvent.type) {
      case 'mousedown':
         this.picked_object = this.pickedObject();
         if (this.picked_object != undefined) {
            this.canvas.addEventListener('mousemove', this.mouse_handler);
            this.canvas.addEventListener('mouseup', this.mouse_handler);
            this.canvas.style.cursor = 'move';  // change cursor to grab
            this.asyncPainter();  // start asynch painting
         }
         break;

      case 'mousemove':
         break;

      case 'mouseup':
         this.repaint();
         this.endDrag();
         break;

         // Unexpected events
      default:
         Log.warn(`DiagramDnD.mouseHandler unexpected event ${mouseEvent.type}`);
         this.endDrag();
      }
   }
 /*
 ```
 ### Touch event handler
 
Like the [mouse event handler](#mouse-event-handler), the touch handler starts and stops the
drag-and-drop operation and updates the current event location in`this.eventLocation.` Modifying the
diagram is not generally done directly from this routine; that is usually done
from[`asyncPainter().`](#asynchronous-painting) An exception occurs on normal termination by
*shift-mouseup*, on which the handler calls[`repaint()`](#asynchronous-painter)directly to update
the diagram one last time. There are a couple of significant differences, however:
* Mouse events associated with diagram rearrangement are easy to recognize because they are all
 modified by the *shift* key; touch events have no such discriminant. To distinguish between a short
 tap intended to display a tooltip and a tap-hold intended to reposition a node, the initial
 *touchstart* event is first checked to see whether it happened over a node or an arc. If it
 happened over a node it might be the start of a short tap intended for the tooltip handler, so the
 repositioning operation is set up as in the mouse event handler, but it is not performed
 immediately.  Instead,[`asyncPainter`](#asynchronous-painting)execution queued with a 300ms delay,
 the time of the event is recorded in`this.start_time,`and the event is allowed to propagate. If a
 *touchend* event occurs before the 300ms have elapsed the event was evidently the start of a quick
 tap, not a tap-hold, and the queued execution of`asyncPainter()`is cancelled and`endDrag()`called
 to clean up.  If no such event occurs,`asyncPainter`executes and redraws the diagram just as in the
 mouse event handler.
* It is straightforward to provide user feedback when a pick event using a mouse is successful: a
cursor change is easy to see and well understood. On a touch device, however, the finger that
performs the touch obscures the cursor, so another mechanism must be found. Nodes are easy to pick
because they are pretty large and it's easy to see the slight jump that occurs when they are
selected. (Since the touch is never in the exact center of the node, repainting the node with its
center directly under the touch always moves it a little.) Arcs, however, have a much narrower
target area and a much less noticeable jump, so on touch devices we change the color of the arc and
its arrowhead when it is picked, and then change it back upon completion of the operation.

 ```js
 */ 
   touchHandler (touchEvent /*: TouchEvent */) {
      const touchCount = touchEvent.touches.length
            + ((touchEvent.type == 'touchend') ? touchEvent.changedTouches.length : 0);
      const touch = (touchEvent.type == 'touchend') ? touchEvent.changedTouches[0] : touchEvent.touches[0];
      
      if (touchCount != 1) {
         this.endDrag();
         return;
      }

      const bounding_box = this.canvas.getBoundingClientRect();
      this.eventLocation.x = ( (touch.clientX - bounding_box.left) / this.canvas.width) * 2 - 1;
      this.eventLocation.y = -( (touch.clientY - bounding_box.top) / this.canvas.height) * 2 + 1;

      switch (touchEvent.type) {
      case 'touchstart': {
         this.picked_object = this.pickedObject();
         if (this.picked_object != undefined) {
            let picked_object = this.picked_object;
            if (this.picked_object.hasOwnProperty('arrow')) {
               const picked_object3d = ((this.findObject3DByUserData(picked_object) /*: any */) /*: ?(THREE.Line | THREE.Mesh) */);
               if (picked_object3d != undefined) {
                  picked_object3d.material.color.set('gray'); // turn arc gray to show it's been selected
               }
               this.asyncPainter();
            } else {
               this.async_painter = window.setTimeout(() => this.asyncPainter(), 300);
            }
            this.start_time = touchEvent.timeStamp;

            this.canvas.addEventListener('touchmove', this.touch_handler);
            this.canvas.addEventListener('touchend', this.touch_handler);
         } }
         break;

      case 'touchmove':
         if (this.picked_object != undefined) {
            touchEvent.stopPropagation();
            touchEvent.preventDefault();
         }
         break;

      case 'touchend':
         const picked_object = this.picked_object;
         if (picked_object != undefined) {
            // reset arc, arrowhead color
            if (picked_object.hasOwnProperty('arrow')) {
               const picked_object3d = ((this.findObject3DByUserData(picked_object) /*: any */) /*: ?(THREE.Line | THREE.Mesh) */);
               if (picked_object3d != undefined) {
                  picked_object3d.material.color.set(((picked_object /*: any */) /*: {arrow: ArrowData} */).arrow.color);
               }
            }

            // don't redraw if this appears to be a short tap over a node (to display a tooltip)
            //   redrawing makes the node jump in an unintended way
            if (touchEvent.timeStamp - this.start_time > 300 || picked_object.hasOwnProperty('arrow')) {
               this.repaint();
               touchEvent.preventDefault();  // prevents generation of mouse-like events (like a click)
            }

            this.endDrag();
            touchEvent.stopPropagation();  // prevents propagation that might cause, e.g., canvas rotation 
         }
         break;

      default:
         Log.warn(`DiagramDnD.touchHandler unexpected event ${touchEvent.type}`);
         this.endDrag();
      }
   }

   findObject3DByUserData (userData /*: {node: NodeData} | {arrow: ArrowData} */) /*: ?THREE.Object3D */ {
      let object3d;
      if (userData.hasOwnProperty('node')) {
         const sphere_data = ((userData /*: any */) /*: {node: NodeData} */);
         const spheres = this.cayley_diagram_view.getGroup('spheres').children;
         object3d = spheres.find( (sphere) => ((sphere.userData /*: any */) /*: NodeUserData */).node == sphere_data.node );
      } else if (userData.hasOwnProperty('arrow')) {
         const line_data = ((userData /*: any */) /*: {arrow: ArrowData} */);
         const lines = this.cayley_diagram_view.getGroup('lines').children;
         object3d = lines.find( (line) => ((line.userData /*: any */) /*: ArrowUserData */).arrow == line_data.arrow );
      }
      return object3d;
   }
/*
```
### Find picked object
This routine returns the top *sphere* or *line* at an `eventLocation`, or *null* if none exist.

[THREE.js](http://www.threejs.org/) has a convenient
[raycaster](https://threejs.org/docs/#api/en/core/Raycaster) class used for mouse picking.  However,
the [**THREE.Mesh**](https://threejs.org/docs/#api/en/objects/Mesh) objects created by
[**MeshLine**](https://github.com/spite/THREE.MeshLine) to achieve the wide lines used in most
Cayley diagrams (see discussion in [DisplayDiagram](./DisplayDiagram.js)) are not supported by
raycasting: you have to use the **MeshLine** object itself for raycasting, not the **THREE.Mesh**
object that created it.  Thus the [startDrag](#start-drag) routine must
* Collect all the objects we can drag and drop into `draggable_objects`
    * *spheres* (**THREE.Mesh** instances)
    * *lines* (**THREE.Line** instances for thin lines; and **THREE.Mesh** instances, generated from
      **MeshLine**, for wide lines)
* Form an array of `pickable_objects` from the `draggable_objects` by replacing the **THREE.Mesh**
  objects created from **MeshLine** with the **MeshLine** objects themselves
* Perform raycasting on the `pickable_objects` array
* If the closest resulting intersection is a **THREE.Mesh** or **THREE.Line** object, return that as
  the result. If instead the closest intersection is a **MeshLine** object, return the
  **THREE.Mesh** object that it generated
    * the **MeshLine** object is recognized as neither a **THREE.Mesh** object nor a **THREE.Line**
      object
    * a reference to the **THREE.Mesh** object generated by the **MeshLine** was placed in the
         `meshLine.geometry.userData` field by the `updateLine{s}` routines in
         [DisplayDiagram](./DisplayDiagram.js)

```js
*/
   pickedObject () /*: ?({node: NodeData} | {arrow: ArrowData}) */ {
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.eventLocation, this.cayley_diagram_view.camera);

      // collect drag candidates, spheres & lines
      const draggable_objects /*: Array<THREE.Mesh | THREE.Line> */ =
            Array.from(((this.cayley_diagram_view.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */)).concat(
               Array.from(((this.cayley_diagram_view.getGroup('lines').children /*: any */) /*: Array<THREE.Mesh | THREE.Line> */)) );

      // replace Mesh objects with related MeshLines
      const pickable_objects = draggable_objects.map( (draggable) => draggable.userData.meshLine || draggable );
      
      // find intersection with closest object
      const intersects = this.raycaster.intersectObjects(pickable_objects, false);

      let intersect = (intersects.length == 0) ? null : ((intersects[0].object /*: any */) /*: THREE.Line | THREE.Mesh | MeshLine */);
      if (intersect != undefined && !intersect.isMesh && !intersect.isLine)
         // follow link in BufferGeometry created in DisplayDiagram back to Mesh
         intersect = ((((intersect /*: any */) /*: MeshLine */).geometry.userData /*: any */) /*: THREE.Mesh */);

      intersect = ((intersect /*: any */) /*: ?(THREE.Mesh | THREE.Line) */);  // know that it can't be MeshLine any more

      let picked_userdata;
      if (intersect != undefined) {
         if (intersect.userData.hasOwnProperty('arrow')) {
            picked_userdata = {arrow: intersect.userData.arrow};
         } else if (intersect.userData.hasOwnProperty('node')) {
            picked_userdata = {node: intersect.userData.node};
         }
      }

      return picked_userdata;
   }
/*
```
### End drag

Generally clean up after a drag-and-drop operation
* remove event handlers that are only used during a manual rearrangement
* return the cursor to its default style (generally an arrow)
* stop [asynchronous painting](#asynchronous-painting)
* clear`this.picked_object`so even if the [asynchronous painter] runs it will exit without doing anything

```js
*/
   endDrag () {
      this.canvas.style.cursor = '';
      window.clearTimeout( ((this.async_painter /*: any */) /*: number */) );
      this.async_painter = null;
      this.picked_object = null;
      if (GEUtils.isTouchDevice()) {
         this.canvas.removeEventListener('touchmove', this.touch_handler);
         this.canvas.removeEventListener('touchend', this.touch_handler);   
      } else {
         this.canvas.removeEventListener('mousemove', this.mouse_handler);
         this.canvas.removeEventListener('mouseup', this.mouse_handler);
      }
   }
/*
```
### Asynchronous painting
Done asynchronously to avoid stacking up move events faster than we can paint them.
```js
*/
   asyncPainter () {
      this.repaint();
      if (this.picked_object != undefined) {
         this.async_painter = window.setTimeout(() => this.asyncPainter(), 0);
      }
   }

   // update line to run through current mouse position
   repaint () {
      if (this.picked_object != undefined) {
         const picked_object = this.picked_object;
         if (picked_object.hasOwnProperty('arrow')) {
            this.redrawArc();
         } else if (picked_object.hasOwnProperty('node')) {
            this.redrawSphere();
         }
      }
   }
/*
```
### Redraw arc
Redraw the Cayley diagram, adjusting the offset so the arc is drawn under the pick point in its
original plane.  Updates the line offset of the associated [Diagram3D.Line](./Diagram3D.js)
at`line.userData,`and updates the arc and its associated arrowheads in`cayley_diagram_view`.

<image src="../images/DiagramDnD_2.png" style="width: 605px; height: 400px; display: block;
       margin-left: auto; margin-right: auto"></img> <center><b>Arc reshaping
       geometry</b></center><br>

The figure above shows values used in the`redrawArc`calculations and their geometry (vector-valued
quantities shown in **bold**, scalars in *italics*, program variables in`code font`)
* &nbsp;**Camera** -- the observer's point of view; the`cayley_diagram_view.camera`position
* &nbsp;**Origin** -- the coordinate origin`(0,0,0)`of the scene being viewed; the default center of
  the visualizer display
* **`start, end`**-- the start and end points of the arc being redrawn
* *`chord`*-- the distance between the**`start`**and**`end`**points
* **`third_point`**-- point used to determine the plane in which the arc will be drawn (see
[DisplayDiagram](./DisplayDiagram.js) for details)
* `arc_plane`-- the [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) determined by
the**`start, end,`**and**`third_point`**points
* **`raycaster.ray.origin`**-- the **Origin-Camera** vector
* **`raycaster.ray.direction`**-- a unit vector from the **Camera** to the pick event
* `pick_line`-- a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
through the scene in the direction of the pick event
* **`pick`**-- the intersection of the`pick_line`with`arc_plane`
* *`u_pick, v_pick`*--**`pick`**coordinates in the local **U-V** coordinate system
* *`pick_projection`*-- the projection of**`pick`**onto the**`start-end`**vector, a number between 0
  and 1
* *`offset`*-- the distance from the top of the arc to the**`start-end`**line
* *`pick_sign`*-- positive if the arc is concave towards the **`third_point;`** negative if it is convex

We use the [Raycasting](https://threejs.org/docs/#api/en/core/Raycaster),
[Plane](https://threejs.org/docs/#api/en/math/Plane), and
[Line3](https://threejs.org/docs/#api/en/math/Line3) classes from [THREE.js](https://threejs.org) to
calculate the new offset for the arc:
* Set`raycaster`from the position of the`cayley_diagram_view.camera`and the pick event location.
* Create`pick_line,`a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
at**`raycaster.ray.origin`**through the scene in the direction of**`raycaster.ray.direction.`**
* Create`arc_plane,`the [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) through the
arc's**`start, end,`**and**`third_point`**points.
* Calculate*`pick_projection,`*the projection of the **start-pick** vector onto the **start-end**
vector as a percentage of the **start-end** vector, a number from 0 to 1.
    * Check that the**`pick`**is still over the middle of the line; if not, terminate the drag
    operation and pass the mouse/touch event along, to be treated as a command to reposition the
    whole diagram.
* Consider the local coordinate system **U-V**, centered at**`start`**, in the plane`arc_plane`(see
  diagram).
    * The points**`start, end, pick,`**and**`third_point`**are all contained in`arc_plane,`as well as the
    arc itself.  The problem of calculating the new line offset is two-dimensional in this
    coordinate system.
    * Calculate the local coordinates*`u_pick`*and*`v_pick`*of**`pick`**in the **U-V** coordinate
    system. (Note that in the current routine we really only calculate`|v_pick|,`since we chose the
    positive square root when a negative value would have been just as valid.)
    * A parabola passing through**`start, pick,`**and**`end`**in this coordinate system satisfies
    the equation <br>&nbsp;&nbsp;&nbsp;&nbsp;`v/offset = 4*(1 - u/chord)*(u/chord),`
    <br>so if the parabola passes through`u = u_pick`and`v = ±v_pick,`
    <br>&nbsp;&nbsp;&nbsp;&nbsp;`offset = ±v_pick * chord² / (4 * u_pick * (chord -
    u_pick)),` <br>where we still have to determine the sign.
    * The sign of the offset is positive if**`pick`**is on the opposite side of the **start-end**
    vector from**`third_point.`** This means that the**`start-pick-end`**triangle has the same
    orientation as the**`start-end-third_point`**triangle or, using vector cross products, that
    <br>&nbsp;&nbsp;&nbsp;&nbsp;**`(end-start`⨯`third_point-end)`⋅`(pick-start`⨯`end-pick)`** <br>is
    positive.

After combining these results and calculating the new arc offset, update the
[Diagram3D.Line](./Diagram3D.js) at`line.userData,`and use
[`this.cayley_diagram_view`](./DisplayDiagram.js) methods to redraw the arc and its arrowhead.

```js
*/
   redrawArc () {
      const picked_object = this.picked_object;
      if (picked_object == undefined || !picked_object.hasOwnProperty('arrow'))
         return;
      
      const line = ((this.findObject3DByUserData(picked_object) /*: any */) /*: THREE.Line | THREE.Mesh */);
      const arrow = ((picked_object /*: any */) /*: {arrow: ArrowData} */).arrow;

      // update raycaster with new event location
      this.raycaster.setFromCamera(this.eventLocation, this.cayley_diagram_view.camera);
      const pick_line = new THREE.Line3(this.raycaster.ray.origin,
                                        this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 100));
   
      const start = arrow.start_node.position;
      const end = arrow.end_node.position
      const third_point = arrow.thirdPoint;
      const arc_plane = new THREE.Plane().setFromCoplanarPoints(start, end, third_point);

      const chord = new THREE.Line3(start, end).distance();

      const pick = arc_plane.intersectLine(pick_line, new THREE.Vector3());
           
      const pick_projection = new THREE.Line3(start, end).closestPointToPointParameter(pick, true);
      if (pick_projection < 0.2 || pick_projection > 0.8) {  // check that pick is over middle of line
         this.endDrag();
         return;
      }

      const u_pick = pick_projection * chord;
      const v_pick = Math.sqrt(new THREE.Line3(start, pick).distanceSq() - u_pick * u_pick);
      const pick_sign = Math.sign(
         new THREE.Vector3().crossVectors(end.clone().sub(start), third_point.clone().sub(end))
            .dot(new THREE.Vector3().crossVectors(pick.clone().sub(start), end.clone().sub(pick))));
      const offset = pick_sign * chord * chord * v_pick / (4 * u_pick * (chord - u_pick));

      // set line offset in diagram
      arrow.offset = offset / chord;
       
      // redraw line, arrowheads
      this.cayley_diagram_view.redrawLines([arrow]);
   }
/*
```
### Redraw sphere
Redraws the Cayley diagram, moving the node in the plane normal to the camera-origin vector so that
it lies under the pick point. Updates the position of the associated
[Diagram3D.Node](./Diagram3D.js) at`sphere.userData.node,`and updates the position of the sphere and
its associated labels, highlighting, lines, and arrowheads in`cayley_diagram_view`.

<image src="../images/DiagramDnD_1.png" style="width: 640px; height: 400px; display: block;
       margin-left: auto; margin-right: auto"></img> <center><b>Node repositioning
       geometry</b></center><br>

The figure above shows the values used in the`redrawSphere`calculation and their geometry
(vector-valued quantities shown in **bold**, program variables in`code font`):
* &nbsp;**Camera** -- the observer's point of view; the`cayley_diagram_view.camera`position
* &nbsp;**Origin** -- the coordinate origin`(0,0,0)`of the scene being viewed; the default center of
  the visualizer display
* **`raycaster.ray.origin`**-- the **Origin-Camera** vector
* **`raycaster.ray.direction`**-- a unit vector from the **Camera** to the pick event
* `pick_line`-- a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
through the scene in the direction of the pick event
* **`camera_direction`**-- a unit vector from the **Origin** in the direction of the
  **Origin-Camera** vector
* **`curr_position`**-- vector to the current position of the node being repositioned
* `node_plane`-- a [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) normal to the
 **Origin-Camera** vector containing the current node position
* **`new_position`**-- the point at which the**`pick_direction`**intersects`node_plane`

We use the [THREE.Raycaster](https://threejs.org/docs/#api/en/core/Raycaster),
[THREE.Plane](https://threejs.org/docs/#api/en/math/Plane), and
[THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) classes to calculate the new position for
the node:
* set`raycaster`from the position of the`cayley_diagram_view.camera`and the pick event location
* create`pick_line,`a [THREE.Line3](https://threejs.org/docs/#api/en/math/Line3) from the **Camera**
at**`raycaster.ray.origin`**through the scene in the direction of**`raycaster.ray.direction`**
* create`node_plane,`a [THREE.Plane](https://threejs.org/docs/#api/en/math/Plane) normal to the 
 **Origin-Camera** unit vector**`camera_direction`**that contains the current node
 position**`curr_position`**
* calculate**`new_position,`**the point at which**`pick_line`**intersects`node_plane`

After finding the new position of the sphere,
use [`cayley_diagram_view.moveSphere(...)`](./CayleyDiagramView.js) to update the sphere and its associated
highlighting, labels, lines, and arrowheads.

```js
*/
   redrawSphere () {
      const picked_object = this.picked_object;
      if (picked_object == undefined || !picked_object.hasOwnProperty('node'))
         return;
      
      const sphere = ((this.findObject3DByUserData(picked_object) /*: any */) /*: THREE.Mesh */);
      const node = ((picked_object /*: any */) /*: {node: NodeData} */).node;

      // update raycaster with new event location
      this.raycaster.setFromCamera(this.eventLocation, this.cayley_diagram_view.camera);

      const pick_line = new THREE.Line3(this.raycaster.ray.origin,
                                        this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 100));
      const camera_direction = this.raycaster.ray.origin.clone().normalize();
      const curr_position = node.position;
      const node_plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera_direction, curr_position);
      const new_position = node_plane.intersectLine(pick_line, new THREE.Vector3());
      
      // move sphere
      this.cayley_diagram_view.moveSphere(sphere, new_position);
   }
}
/*
```
*/
