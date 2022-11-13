/* @flow

# Cayley Diagram Manual Rearrangement

The [Cayley diagram visulizer](../help/rf-um-cd-options/index.html) lets users customize the
appearance of a [Cayley diagram](../help/rf-groupterms/#cayley-diagrams) by [repositioning the
nodes](../help/rf-um-cd-options/index.html#changing-the-positions-of-nodes-in-the-diagram) and
[adjusting arcing of arrows in the
diagram](../help/rf-um-cd-options/index.html#changing-the-arcing-of-arrows-in-the-diagram).  The
**DiagramDnD** class in this file handles the drag-and-drop operations that implement this
rearrangement capability, updating the Cayley diagram and redrawing the graphic as needed.

## Life cycle

The [Cayley diagram visualizer page](../CayleyDiagram.js) creates a **DiagramDnD** instance during
initialization and places a reference in the global variable `DnD_handler`. It is bound to the large
Cayley diagram and listens to mouse/pen/touch pointer events on the canvas. (There is no use for
this variable after initialization, it exists only for debugging.)

## Event handling

The [DiagramDnD constructor](#constructor) sets up the DiagramDnD [event handler](#event-handler) to
listen for the start of a rearrangement. Mouse and touch events are both handled by the same
routine, using [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events).
The event handler captures events for the &lt;canvas&gt; element before they bubble up to other
event handlers such as the [Cayley diagram tooltip handler](../CayleyDiagram.js) or the Three.js
[TrackballControls](https://threejs.org/docs/#examples/en/controls/TrackballControls) handler.  When
it identifies a drag-and-drop-related event, it stops it from propagating to further, so it won't be
interpreted as a command to display a tooltip or to rotate the visualization.

## Drawing

Redrawing the main graphic is done asynchronously to the main event handling in order to keep
potentially time-consuming graphics operations from tying up the main thread and stacking up user
interface events. Depending on the type of object originally picked, node or arc, the [asynchronous
painting](#asynchronous-painting) routine
calls[`redrawArc()`](#redraw-arc)or[`redrawSphere()`](#redraw-sphere)to rearrange the scene defined in
[AbstractDiagramDisplay](./AbstractDiagramDisplay.js).  Actual rerendering of the scene occurs on the
next execution of the AbstractDiagramDisplay `render()` routine.

```js
*/
import Log from './Log.js';

// $FlowFixMe -- external module imports described in flow-typed directory
import {THREE} from '../lib/externals.js';

/*::
import {CayleyDiagramView} from './CayleyDiagramView.js';
import type {LineType, ArrowData, NodeData, LineUserData, SphereUserData} from './CayleyDiagramView.js';
*/

export default class DiagramDnD {
/*::
   cayley_diagram_view: CayleyDiagramView;
   canvas: HTMLCanvasElement;
   eventLocation: THREE.Vector2;  // position of the last mouse/touch event
                                  //    (note that we don't drag-and-drop on multi-touch events)
   raycaster: THREE.Raycaster;
   event_handler: (PointerEvent) => void;
   touch_event_handler: (TouchEvent) => void;
   async_painter: ?number;  // asyncPainter timeoutID; null if asyncPainter not queued
   start_time: number;  // time of first touch event
   picked_object: ?({node: NodeData} | {arrow: ArrowData});
 */
/*
```
### Constructor
Initialize instance variables, Registers event handlers.
```js
*/
   constructor (cayley_diagram_view /*: CayleyDiagramView */) {
      this.cayley_diagram_view = cayley_diagram_view;
      this.canvas = cayley_diagram_view.renderer.domElement;
      this.eventLocation = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.params.Line2 = { threshold: 10 } // Widen line capture region, for touch devices (pixels)
      this.async_painter = null;
      this.picked_object = null;

      this.event_handler = (event) => this.eventHandler(event)
      this.touch_event_handler = (event) => this.touchEventHandler(event)
      this.canvas.addEventListener('pointerdown', this.event_handler)
      
   }
/*
```
### Event handler

The event handler initiates a drag-and-drop rearrangement and updates data fields that describe its
progress, but it does not modify the diagram directly: that is done in
[`this.asyncPainter().`](#asynchronous-painting) The normal event sequence in a drag-and-drop
rearrangement is:

* A *pointerdown* event occurs over a node or arc.  The [pickedObject3D()](#find-picked-object)
  method returns the node or arc over which the event occurred, or *null.* If a picked object is
  found indicating the start of a rearrangement, the handler

    * registers as a listener for subsequent *pointermove*, *pointerup*, *pointerout". and
      *pointerleave" evants, which have been ignored until now in the interest of performance

    * stores the picked object and pointer location for later use by the [asynchronous
      painter](#asynchronous-painting)

    * starts the [asynchronous painter](#asynchronous-painting) to update the diagram outside the
      main thread

* A sequence of *pointermove* events occurs as the object is dragged across the screen. These are
  handled by copying the current pointer position into `this.eventLocation,` where it is
  accessed by the [asynchronous painter](#asynchronous-painting) routine.

* A *pointerup* event terminates the ongoing rearrangement. The diagram is painted one last time by
  `this.repaint(),` and [this.endDrag()](#end-drag) is called to stop the [asynchronous
  painter](#asynchronous-painting) and clean up.

When an event that breaks this sequence occurs, the rearrangement in progress is aborted by calling
[endDrag().](#end-drag) This might be because the pointer was dragged off the screen, for example,
indicated by a *pointerleave* event. If a second touch occurs, a non-primary *pointerdown* event
indicating the start of a multi-touch gesture, all pointer event handling is suspended and only
`touchend` events are handled. When a `touchend` event with an emtpy `touches` list arrives, normal
operation is resumed.

```js
*/
   eventHandler (event /*: PointerEvent */) {
      if ((event.type.startsWith('pointer') && event.pointerType == 'mouse') && !event.shiftKey) {
         this.endDrag()
         return
      }

      const bounding_box = this.canvas.getBoundingClientRect()
      this.eventLocation.x = ( (event.clientX - bounding_box.left) / this.canvas.width) * 2 - 1
      this.eventLocation.y = -( (event.clientY - bounding_box.top) / this.canvas.height) * 2 + 1

      event.preventDefault()

      switch (event.type) {
      case 'pointerdown':
         // A second touch has occurred: stop drag and wait until multi-touch gesture is complete
         if (!event.isPrimary) {
            this.endDrag()
            this.canvas.removeEventListener('pointerdown', this.event_handler)
            this.canvas.addEventListener('touchend', this.touch_event_handler)
            break
         }

         this.picked_object = this.findPickedObject()
         if (this.picked_object != undefined) {
            this.canvas.addEventListener('pointermove', this.event_handler)
            this.canvas.addEventListener('pointerup', this.event_handler)
            this.canvas.addEventListener('pointerout', this.event_handler)
            this.canvas.addEventListener('pointerleave', this.event_handler)
            this.canvas.style.cursor = 'move' // change cursor to grab
            this.asyncPainter() // start asynch painting
            event.stopPropagation()
         }
         break

      case 'pointermove':
         event.stopPropagation()
         break

      case 'pointerup':
         this.repaint()
         this.endDrag()
         event.stopPropagation()
         break

      case 'pointerout':
      case 'pointerleave':
         this.endDrag()
         break

         // Unexpected events
      default:
         Log.warn(`DiagramDnD.eventHandler unexpected event ${event.type}`)
         this.endDrag()
         break
      }
   }

	 touchEventHandler (touchEvent /*: TouchEvent */) {
      if (touchEvent.type == 'touchend' && touchEvent.touches.length == 0) {
         // Only listen for touchend events when waiting for a multi-touch gesture to complete
         this.canvas.removeEventListener('touchend', this.touch_event_handler)
         this.canvas.addEventListener('pointerdown', this.event_handler)
			} else {
         Log.warn(`DiagramDnD.touchEventHandler unexpected event ${touchEvent.type}`)
			}
	 }
 
   findObject3DByUserData (userData /*: {node: NodeData} | {arrow: ArrowData} */) /*: ?THREE.Object3D */ {
      let object3d;
      if (userData.hasOwnProperty('node')) {
         const sphere_data = ((userData /*: any */) /*: {node: NodeData} */);
         const spheres = this.cayley_diagram_view.getGroup('spheres').children;
         object3d = spheres.find( (sphere) => ((sphere.userData /*: any */) /*: SphereUserData */).node == sphere_data.node );
      } else if (userData.hasOwnProperty('arrow')) {
         const line_data = ((userData /*: any */) /*: {arrow: ArrowData} */);
         const lines = this.cayley_diagram_view.getGroup('lines').children;
         object3d = lines.find( (line) => ((line.userData /*: any */) /*: LineUserData */).arrow == line_data.arrow );
      }
      return object3d;
   }
/*
```
### Find picked object
This routine returns the top *sphere* or *line* at an `eventLocation`, or *null* if none exist. It uses
the [raycaster](https://threejs.org/docs/#api/en/core/Raycaster) class from [THREE.js](http://www.threejs.org/).

```js
*/
   findPickedObject () /*: ?(SphereUserData | LineUserData) */ {
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.eventLocation, this.cayley_diagram_view.camera);

      // collect drag candidates, spheres & lines
      const pickable_objects /*: Array<THREE.Object3D> */ =
            ((this.cayley_diagram_view.getGroup('lines').children /*: any */) /*: Array<LineType> */)
            .concat( ((this.cayley_diagram_view.getGroup('spheres').children /*: any */) /*: Array<THREE.Mesh> */) );
      
      // find intersection with closest pickable object
      const intersects = this.raycaster.intersectObjects(pickable_objects, false);

      const picked_object = (intersects.length == 0) ? null :
            ((intersects[0].object.userData /*: any */) /*: SphereUserData | LineUserData */);

      return picked_object;
   }
/*
```
### End drag

Generally clean up after a drag-and-drop operation
* return the cursor to its default style (generally an arrow)
* stop [asynchronous painting](#asynchronous-painting)
* clear`this.picked_object`so even if the [asynchronous painter] runs it will exit without doing anything
* remove event handlers that are only used during a manual rearrangement

```js
*/
   endDrag () {
      this.canvas.style.cursor = '';
      window.clearTimeout( ((this.async_painter /*: any */) /*: number */) );
      this.async_painter = null;
      this.picked_object = null;

      this.canvas.removeEventListener('pointermove', this.event_handler);
      this.canvas.removeEventListener('pointerup', this.event_handler);
      this.canvas.removeEventListener('pointerout', this.event_handler);
      this.canvas.removeEventListener('pointerleave', this.event_handler);
   }
/*
```
### Asynchronous painting
Done asynchronously to avoid stacking up move events faster than we can paint them.

`repaint()` is called directly from the [eventHandler](#event-handler) to repaint the screen for the
last time.

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

      const line = ((this.findObject3DByUserData(picked_object) /*: any */) /*: LineType */);
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
      this.cayley_diagram_view.redrawLines([line]);
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
