// @flow
/*
 * ToDo:  disable when chunking
 */
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
   repaint_request: ?number;
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
         return;
      }

      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();

      const bounding_box = this.canvas.getBoundingClientRect();
      this.eventLocation.x = ( (mouseEvent.clientX - bounding_box.left) / this.canvas.width) * 2 - 1;
      this.eventLocation.y = -( (mouseEvent.clientY - bounding_box.top) / this.canvas.height) * 2 + 1;

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
         this.dragOver();
         break;

      case 'mouseup':
         this.drop();
         this.canvas.removeEventListener('mousemove', this.mouse_handler);
         this.canvas.removeEventListener('mouseup', this.mouse_handler);
         break;

      default:
         Log.warn(`DiagramDnD.mouseHandler unexpected event ${mouseEvent.type}`);
      }
   }
 
   touchHandler(touchEvent /*: TouchEvent */) {
      const touchCount = touchEvent.touches.length
            + ((touchEvent.type == 'touchend') ? touchEvent.changedTouches.length : 0);
      const touch = (touchEvent.type == 'touchend') ? touchEvent.changedTouches[0] : touchEvent.touches[0];
      
      if (touchCount != 1) {
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

            this.repaintPoller();

            touchEvent.preventDefault();
            touchEvent.stopPropagation();
         }
         break;

      case 'touchmove':
         this.dragOver();
         touchEvent.preventDefault();
         touchEvent.stopPropagation();
         break;

      case 'touchend':
         this.drop();
         this.canvas.removeEventListener('touchmove', this.touch_handler);
         this.canvas.removeEventListener('touchend', this.touch_handler);
         break;

      default:
         Log.warn(`DiagramDnD.touchHandler unexpected event ${touchEvent.type}`);
      }
   }

   // start drag-and-drop; see if we've found a line or node
   dragStart() /*: ?THREE.Object3D */ {
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

   dragOver() {
   }

   drop() {
      this.repaint();
      this.endDrag();
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

      if (this.object != null) {
         if (this.object.type == 'Line') {
            this.repaintLine(this.object);
         } else if (this.object.type == 'Mesh') {
            this.repaintSphere(this.object);
         }
      }
   }

   repaintLine(line /*: THREE.Object3D */) {
      // get intersection of ray with plane of line (through start, end, center)
      const lineUserData = (line.userData /*: LineUserData */);
      const start = lineUserData.line.vertices[0].point;
      const end = lineUserData.line.vertices[1].point;
      const center = this.displayDiagram._getCenter(lineUserData.line);
      const center2start = start.clone().sub(center);
      const center2end = end.clone().sub(center);

      // find 'intersection', the point the raycaster ray intersects the plane defined by start, end and center
      const m = new THREE.Matrix3().set(...center2start.toArray(),
                                        ...center2end.toArray(),
                                        ...this.raycaster.ray.direction.toArray())
                                   .transpose();
      const s = this.raycaster.ray.origin.clone().applyMatrix3(new THREE.Matrix3().getInverse(m));
      const intersection = this.raycaster.ray.origin.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(-s.z));

      // get offset length
      const start2intxn = intersection.clone().sub(start);
      const start2end = end.clone().sub(start);
      const plane_normal = new THREE.Vector3().crossVectors(center2start, center2end).normalize();
      const line_length = start2end.length();
      const offset = new THREE.Vector3().crossVectors(start2intxn, start2end).dot(plane_normal)/(line_length * line_length);

      // set line offset in diagram, and re-paint lines, arrowheads
      lineUserData.line.style = Diagram3D.CURVED;
      lineUserData.line.offset = offset;
      const diagram3D = (this.displayDiagram.scene.userData /*: CayleyDiagram */);
      this.displayDiagram.updateLines(diagram3D);
      this.displayDiagram.updateArrowheads(diagram3D);
   }

   repaintSphere(sphere /*: THREE.Object3D */) {
      // change node location to 3D intersection between ray and plane normal to camera POV containing node
      const sphereUserData = (sphere.userData /*: SphereUserData */);
      const node = sphereUserData.node.point;
      const ray_origin = this.raycaster.ray.origin;
      const ray_direction = this.raycaster.ray.direction;
      const projection = ray_origin.clone().multiplyScalar(ray_origin.dot(node)/node.length()/ray_origin.length()/ray_origin.length());
      const inplane = node.clone().sub(projection);
      const normal = new THREE.Vector3().crossVectors(inplane, ray_origin).normalize();

      const m = new THREE.Matrix3().set(...inplane.toArray(),
                                        ...normal.toArray(),
                                        ...ray_direction.toArray() )
                                   .transpose();
      const s = ray_origin.clone().sub(projection).applyMatrix3(new THREE.Matrix3().getInverse(m));
      const new_node = ray_origin.clone().add(ray_direction.clone().multiplyScalar(-s.z));

      sphereUserData.node.point = new_node;

      const diagram3D = (this.displayDiagram.scene.userData /*: CayleyDiagram */);
      this.displayDiagram.updateNodes(diagram3D);
      this.displayDiagram.updateHighlights(diagram3D);
      this.displayDiagram.updateLabels(diagram3D);
      this.displayDiagram.updateLines(diagram3D);
      this.displayDiagram.updateArrowheads(diagram3D);
//      this.displayDiagram.render();
   }
}
