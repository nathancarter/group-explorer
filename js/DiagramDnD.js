// @flow
/*::
import Diagram3D from './Diagram3D.js';
import CayleyDiagram from './CayleyDiagram.js';
import DisplayDiagram from './DisplayDiagram.js';
import type {LineUserData, SphereUserData} from './DisplayDiagram.js';
import Log from './Log.js';

export default
 */
class DiagramDnD {
/*::
   displayDiagram: DisplayDiagram;
   canvas: HTMLCanvasElement;
   eventLocation: THREE.Vector2;
   raycaster: THREE.Raycaster;
   mouse_handler: (MouseEvent) => void;
   touch_handler: (TouchEvent) => void;
   repaint_poller: ?number;
   start_time: number;
   object: ?THREE.Object3D;
 */
   constructor(displayDiagram /*: DisplayDiagram */) {
      this.displayDiagram = displayDiagram;
      this.canvas = displayDiagram.renderer.domElement;
      this.eventLocation = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.linePrecision = 0.01;
      this.repaint_poller = null;
      this.object = null;

      if (window.ontouchstart === undefined) {
         this.mouse_handler = (mouseEvent /*: MouseEvent */) => this.mouseHandler(mouseEvent);
         this.canvas.addEventListener('mousedown', this.mouse_handler);
      } else {
         this.touch_handler = (touchEvent /*: TouchEvent */) => this.touchHandler(touchEvent);
         this.canvas.addEventListener('touchstart', this.touch_handler);
      }
   }

   mouseHandler(mouseEvent /*: MouseEvent */) {
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
         if ((this.object = this.dragStart()) != undefined) {
            this.canvas.addEventListener('mousemove', this.mouse_handler);
            this.canvas.addEventListener('mouseup', this.mouse_handler);

            // change cursor to grab
            this.canvas.style.cursor = 'move';

            this.repaintPoller();
         }
         break;

      case 'mousemove':
         break;

      case 'mouseup':
         this.repaint();
         this.endDrag();
         this.canvas.removeEventListener('mousemove', this.mouse_handler);
         this.canvas.removeEventListener('mouseup', this.mouse_handler);
         break;

         // Unexpected events
      default:
         Log.warn(`DiagramDnD.mouseHandler unexpected event ${mouseEvent.type}`);
      }
   }
 
   touchHandler(touchEvent /*: TouchEvent */) {
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
      case 'touchstart':
         if ((this.object = this.dragStart()) != undefined) {
            this.canvas.addEventListener('touchmove', this.touch_handler);
            this.canvas.addEventListener('touchend', this.touch_handler);
            this.repaint_poller = window.setTimeout(() => this.repaintPoller(), 300);
            this.start_time = touchEvent.timeStamp;
         }
         break;

      case 'touchmove':
         if (this.object) {
            touchEvent.stopPropagation();
            touchEvent.preventDefault();
         }
         break;

      case 'touchend':
         if (touchEvent.timeStamp - this.start_time > 300) {  // this avoids an unintended bump on a quick tap
            this.repaint();
            touchEvent.preventDefault();  // prevents generation of mouse events
         }
         this.endDrag();
         touchEvent.stopPropagation();  // prevents rotation
         this.canvas.removeEventListener('touchmove', this.touch_handler);
         this.canvas.removeEventListener('touchend', this.touch_handler);
         break;

      default:
         Log.warn(`DiagramDnD.touchHandler unexpected event ${touchEvent.type}`);
      }
   }

   // start drag-and-drop; see if we've found a line or node
   dragStart() /*: ?THREE.Object3D */ {
      // Don't allow manual re-arrangement if we're chunking
      if (this.displayDiagram.scene.userData.chunk != 0) {
         return null;
      }
      
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.eventLocation, this.displayDiagram.camera);

      // temporarily change the width of the lines to 1 for raycasting -- doesn't seem to work with meshLines (sigh)
      // (this change is never rendered, so user never sees it)
      const diagram3D = (this.displayDiagram.scene.userData /*: CayleyDiagram */);
      const saved_width = diagram3D.lineWidth;
      diagram3D.lineWidth = 1;
      this.displayDiagram.updateLines(diagram3D);

      // calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects(
         ((this.displayDiagram.getGroup("lines").children.concat(
            this.displayDiagram.getGroup("spheres").children) /*: any */) /*: THREE.Object3D */),
         false );

      // now change the line width back
      diagram3D.lineWidth = saved_width;
      this.displayDiagram.updateLines(diagram3D);

     // return intersect or null
      return (intersects.length == 0) ? null : intersects[0].object;
   }

   endDrag() {
      this.canvas.style.cursor = '';
      window.clearTimeout( ((this.repaint_poller /*: any */) /*: number */) );
      this.repaint_poller = null;
      this.object = undefined;
   }

   repaintPoller() {
      this.repaint();
      this.repaint_poller = window.setTimeout(() => this.repaintPoller(), 0);
   }

   // update line to run through current mouse position
   repaint() {
      // get ray through mouse
      this.raycaster.setFromCamera(this.eventLocation, this.displayDiagram.camera);

      if (this.object != undefined) {
         if (this.object.type == 'Line') {
            this.repaintLine(this.object);
         } else if (this.object.type == 'Mesh') {
            this.repaintSphere(this.object);
         }
      }
   }

   /* Re-draw line by adjusting line.offset so the center of the line is under the drag point
    */
   repaintLine(line /*: THREE.Object3D */) {
      const lineUserData = (line.userData /*: LineUserData */);

      const start = lineUserData.line.vertices[0].point;
      const end = lineUserData.line.vertices[1].point;
      const center = this.displayDiagram._getCenter(lineUserData.line);

      const plane = new THREE.Plane().setFromCoplanarPoints(start, end, center);
      const ray = new THREE.Line3(this.raycaster.ray.origin,
                                  this.raycaster.ray.origin.clone().addScaledVector(this.raycaster.ray.direction, 100));
      
      const pick = plane.intersectLine(ray, new THREE.Vector3());

      const pick_projection = new THREE.Line3(start, end).closestPointToPointParameter(pick, true);
      if (pick_projection < 0.3 || pick_projection > 0.7) {
         this.endDrag();
         return;
      }

      // check that pick is over (middle third of) line?

      // transformation from real to canonical space to simplify problem 
      const midpoint = start.clone().add(end).multiplyScalar(0.5);
      const start_end_normal = new THREE.Vector3().crossVectors(end.clone().sub(start), plane.normal).normalize();
      const transform = new THREE.Matrix4().makeBasis(start.clone().sub(midpoint), start_end_normal, plane.normal)
                                           .setPosition(midpoint);

      // map pick to canonical space
      const pick_canonical = pick.clone().applyMatrix4(new THREE.Matrix4().getInverse(transform));
      const ymax_canonical = -pick_canonical.y/(pick_canonical.x*pick_canonical.x - 1);
      const ymax_real =
            Math.sign(ymax_canonical) * (new THREE.Vector3(0, ymax_canonical, 0).applyMatrix4(transform).sub(midpoint).length());

      // set line offset in diagram, and re-paint lines, arrowheads
      lineUserData.line.style = Diagram3D.CURVED;
      lineUserData.line.offset = ymax_real/start.clone().sub(end).length();
      const diagram3D = (this.displayDiagram.scene.userData /*: CayleyDiagram */);
      this.displayDiagram.updateLines(diagram3D);
      this.displayDiagram.updateArrowheads(diagram3D);
   }

   /* Re-draw sphere by placing it under the drag point in the plane normal to the ray origin
    */
   repaintSphere(sphere /*: THREE.Object3D */) {
      const sphereUserData = (sphere.userData /*: SphereUserData */);
      const node = sphereUserData.node.point;
      const ray_origin = this.raycaster.ray.origin;
      const ray_direction = this.raycaster.ray.direction;
      const square = (val) => val * val;
      let new_node;
      // Find intersection of raycaster ray with plane through the sphere and normal to the camera POV
      if (Math.abs(square(ray_origin.dot(ray_direction)) - ray_origin.lengthSq()*ray_direction.lengthSq()) < 1.e-6) {
         // Degenerate case: mouse lies right on camera POV, just project the current node position onto the camera POV
         new_node = node.clone().projectOnVector(ray_origin);
      } else {
         /* center is the point where the camera POV intersects the plane containing the sphere
          * intxn is the point where the raycaster ray intersects the plane
          * camera2intxn is the distance between the camera and intxn
          */
         const origin2center = node.clone().projectOnVector(ray_origin);
         const center2camera = ray_origin.clone().sub(origin2center);
         const camera2intxn = -center2camera.lengthSq()/(ray_direction.dot(center2camera));
         new_node = ray_origin.clone().addScaledVector(ray_direction, camera2intxn);
      }

      sphereUserData.node.point = new_node;

      // update a single node by changing its position
      const diagram3D = (this.displayDiagram.scene.userData /*: CayleyDiagram */);
      sphere.position.set(...new_node.toArray());
      const sphere_index = this.displayDiagram.getGroup('spheres').children.findIndex( (sp) => sp.uuid == sphere.uuid );

      // update the single node's label by changing the label's position
      const label = this.displayDiagram.getGroup('labels').children[sphere_index];
      label.position.set(...new_node.toArray());
      
      this.displayDiagram.updateHighlights(diagram3D);
      this.displayDiagram.updateLines(diagram3D);
      this.displayDiagram.updateArrowheads(diagram3D);
   }
}

