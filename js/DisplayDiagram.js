/*
 * Routines to draw 3D ball-and-stick diagrams using three.js
 */


class DisplayDiagram {
   /*
    * Create three.js objects to display data in container
    *
    * create a scene to hold all the elements such as lights and objects
    * create a camera, which defines the point of view
    * create a renderer, sets the size
    * add the output of the renderer to the container element (a jquery wrapped set)
    */
   constructor(options) {
      Log.log('DisplayDiagram');

      if (options === undefined) {
         options = {};
      }

      DisplayDiagram.setDefaults();
      this.scene = new THREE.Scene();
      DisplayDiagram.groupNames.forEach( (name) => {
         const group = new THREE.Group();
         group.name = name;
         this.scene.add(group);
      } );
      
      if (options.fog === undefined || options.fog) {
         this.scene.fog = new THREE.Fog(DisplayDiagram.DEFAULT_FOG_COLOR, 2, 100);
      }

      // take canvas dimensions from container (if specified), option, or default
      let width, height;
      if (options.container !== undefined) {
         width = options.container.width();
         height = options.container.height();
      } else {
         width = (options.width === undefined) ? DisplayDiagram.DEFAULT_CANVAS_WIDTH : options.width;
         height = (options.height === undefined) ? DisplayDiagram.DEFAULT_CANVAS_HEIGHT : options.height;
      }

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);

      this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true});
      this.renderer.setSize(width, height);

      if (options.container !== undefined) {
         options.container.append(this.renderer.domElement);
      }

      if (options.trackballControlled) {
         this.camControls = new THREE.TrackballControls(this.camera, options.container[0]);
      }
   }

   static setDefaults() {
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads'];
      DisplayDiagram.DEFAULT_CANVAS_HEIGHT = 50;
      DisplayDiagram.DEFAULT_CANVAS_WIDTH = 50;
      DisplayDiagram.DEFAULT_BACKGROUND = 0xE8C8C8;  // Cayley diagram background
      DisplayDiagram.DEFAULT_NODE_COLOR = 0x8C8C8C;  // gray
      DisplayDiagram.DEFAULT_LINE_COLOR = 0x000000;  // black
      DisplayDiagram.DEFAULT_FOG_COLOR = 0xA0A0A0;
      DisplayDiagram.IOS_LINE_WIDTH = 1;
      DisplayDiagram.DEFAULT_ARC_OFFSET = 0.2;
      DisplayDiagram.LIGHT_POSITIONS = [
         [105, 0, 0],
         [-35, -50, -87],
         [-35, -50, 87],
         [-35, 100, 0],
      ];
   }

   // Small graphics don't need high resolution features:
   //   Many-faceted spheres, labels, thick lines, arrows?
   getImageURL(diagram3D) {
      const img = new Image();
      this.showGraphic(diagram3D);
      img.src = this.renderer.domElement.toDataURL();
      return img;
   }

   // Display diagram
   showGraphic(diagram3D) {
      Log.log('showGraphic');

      diagram3D.normalize();

      var t0, t1, t2, t3, t4, t5;
      t0 = performance.now();
      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      t1 = performance.now();
      this.updateNodes(diagram3D);
      t2 = performance.now();
      this.updateLabels(diagram3D);
      t3 = performance.now();
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
      t4 = performance.now();
      this.render();
      t5 = performance.now();
      Log.log(
         `setup ${t1-t0}; nodes ${t2-t1}; labels ${t3-t2}; lines ${t4-t3}; render ${t5-t4}`);
   }

   getGroup(name) {
      return this.scene.children.find( (el) => el.name == name );
   }

   // Position and point the camera to the center of the scene
   setCamera(diagram3D) {
      Log.log('setCamera');

      if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
         this.camera.position.set(3, 0, 0);
         this.camera.up.set(0, 0, 1);
      } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
         this.camera.position.set(0, 3, 0);
         this.camera.up.set(0, 0, 1);
      } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
         this.camera.position.set(0, 0, 3);
         this.camera.up.set(0, 1, 0);
      } else {
         this.camera.position.set(2, 2, 2);
         this.camera.up.set(0, 1, 0);
      }
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
   }

   setBackground(diagram3D) {
      Log.log('setBackground');

      const background = (diagram3D.background === undefined) ?
                         DisplayDiagram.DEFAULT_BACKGROUND : diagram3D.background;
      this.renderer.setClearColor(background, 1.0);
   }

   // Create, arrange lighting
   updateLights() {
      Log.log('updateLights');

      const lights = this.getGroup('lights');
      lights.remove(...lights.children);
      DisplayDiagram.LIGHT_POSITIONS.forEach( (position) => {
         const light = new THREE.DirectionalLight();
         light.position.set(...position);
         lights.add(light);
      } )
   }

   // Create a sphere for each node, add to scene as THREE.Group named "spheres"
   updateNodes(diagram3D) {
      Log.log('updateNodes');

      const defaultNodeRadius = 0.3 / Math.sqrt(diagram3D.nodes.length);

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      diagram3D.nodes.forEach( (node) => {
         const nodeColor = (node.color == undefined) ?
                           DisplayDiagram.DEFAULT_NODE_COLOR : node.color,
               nodeRadius = diagram3D.nodeScale * ((node.radius == undefined) ?
                                                   defaultNodeRadius : node.radius),
               sphereMaterial = new THREE.MeshPhongMaterial({color: nodeColor}),
               sphereGeometry = new THREE.SphereGeometry(nodeRadius, 20, 20),
               sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         spheres.add(sphere);
      } )
   }

   // Draw labels on sprites positioned at nodes
   updateLabels(diagram3D) {
      Log.log('updateLabels');

      const labels = this.getGroup('labels');
      labels.remove(...labels.children);

      const spheres = this.getGroup('spheres').children;

      spheres.forEach( (sphere) => {
         const node = sphere.userData.node;
         if (node.label === undefined || node.label == '') {
            return;
         };

         // make canvas big enough for any label and offset it to clear the node while being close
         const canvas = document.createElement('canvas');
         canvas.id = `label_${node.element}`;
         const context = canvas.getContext('2d');

         const radius = sphere.geometry.parameters.radius;
         const scale = 12 * radius * diagram3D.labelSize;
         const textLabel = mathml2text(node.label);
         canvas.width = 2048;
         canvas.height = 256;
         context.fillStyle = 'rgba(0, 0, 0, 1.0)';
         context.font = '120pt Arial';
         const xoff = 600 * Math.sqrt(radius) / diagram3D.labelSize;
         context.fillText(textLabel, xoff, 0.7*canvas.height);

         const texture = new THREE.Texture(canvas)
         texture.needsUpdate = true;

         const labelMaterial = new THREE.SpriteMaterial({ map: texture });

         const label = new THREE.Sprite( labelMaterial );
         label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);

         label.center = new THREE.Vector2(0.0, 0.0);
         label.position.set(node.point.x, node.point.y, node.point.z);

         labels.add(label);
      } )
   }

   /*
    * Draw lines between nodes
    *   An arc is drawn in the plane specified by the normal vector if one is given
    */
   updateLines(diagram3D) {
      Log.log('updateLines');

      const lines = diagram3D.lines;
      const spheres = this.getGroup('spheres').children;
      const lineGroup = this.getGroup('lines');
      lineGroup.remove(...lineGroup.children);

      const userAgent = window.navigator.userAgent;
      const isIOS = !!userAgent.match(/iPad/i) || !!userAgent.match(/iPhone/i);
      // This generally works, but Chrome/Linux can't display its max (!?) -- punt for the moment
      // const maxLineWidth = this.renderer.context.getParameter(
      //   this.renderer.context.ALIASED_LINE_WIDTH_RANGE)[1];
      const maxLineWidth = 1;

      lines.forEach( (line) => {
         const vertices = line.vertices,
               lineColor = (line.color === undefined) ?
                           DisplayDiagram.DEFAULT_LINE_COLOR : line.color,
               lineWidth = isIOS ? DisplayDiagram.IOS_LINE_WIDTH : diagram3D.lineWidth,
               lineMaterial =
                  lineWidth <= maxLineWidth ?
                  new THREE.LineBasicMaterial({color: lineColor, linewidth: lineWidth}) :
                  new MeshLineMaterial({
                     color: new THREE.Color(lineColor),
                     lineWidth: lineWidth,
                     sizeAttenuation: false,
                     side: THREE.DoubleSide,
                     resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                  });

         var geometry = new THREE.Geometry();
         if (line.normal === undefined) {
            geometry.vertices = vertices.map( (vertex) => vertex.point );
         } else {
            // Put bow in arc so that (start, middle, end) is clockwise when viewed from normal
            const normal = line.normal,
                  start = vertices[0].point,
                  end = vertices[vertices.length - 1].point,
                  offset = (line.arcOffset === undefined) ?
                           DisplayDiagram.DEFAULT_ARC_OFFSET : line.arcOffset,
                  // (start + end)/2 - (end - start) X normal
                  middle = start.clone().add(end).multiplyScalar(0.5).sub(
                     end.clone().sub(start).cross(normal).multiplyScalar(offset)),
                  curve = new THREE.QuadraticBezierCurve3(start, middle, end),
                  points = curve.getPoints(10);
            geometry.vertices = points;
         }

         let newLine;
         if (lineWidth == 1) {
            newLine = new THREE.Line(geometry, lineMaterial);
         } else {
            const meshLine = new MeshLine()
            meshLine.setGeometry(geometry);
            newLine = new THREE.Mesh(meshLine.geometry, lineMaterial);
         }
         newLine.userData = {line: line, vertices: geometry.vertices, color: lineColor};
         lineGroup.add(newLine);
      } )
   }

   updateArrowheads(diagram3D) {
      Log.log('updateArrowheads');

      const spheres = this.getGroup('spheres').children;
      const lines = this.getGroup('lines').children;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      lines.filter( (line) => line.userData.line.arrow )
           .forEach( (line) => {
              const lineData = line.userData.line,
                    vertices = line.userData.vertices,
                    numNodes = vertices.length,
                    numSegments = numNodes - 1,
                    startNode = vertices[0],
                    endNode = vertices[numNodes - 1],
                    nodeRadius = spheres[lineData.vertices[lineData.vertices.length - 1].element].geometry.parameters.radius,
                    center2center = endNode.clone().sub(startNode).length(),
                    dLength = center2center / numSegments;
              if (center2center <= 2*nodeRadius) {
                 return;
              }
              const headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
                    headWidth = 0.6 * headLength,
                    start2tip = nodeRadius + headLength +
                                diagram3D.arrowheadPlacement*(center2center - 2*nodeRadius - headLength),
                    tipSegment = Math.floor(start2tip/dLength),
                    tip = vertices[tipSegment].clone().add(
                       vertices[tipSegment+1].clone().sub(vertices[tipSegment]).multiplyScalar(
                          start2tip/dLength - tipSegment)),
                    start2base = start2tip - headLength,
                    baseSegment = Math.floor(start2base/dLength),
                    base = vertices[baseSegment].clone().add(
                       vertices[baseSegment+1].clone().sub(vertices[baseSegment]).multiplyScalar(
                          start2base/dLength - baseSegment)),
                    arrowDir = tip.clone().sub(base).normalize(),
                    color = line.userData.color,
                    arrowhead = new THREE.ArrowHelper(arrowDir, base, 1.1*headLength, color, headLength, headWidth);
              arrowheads.add(arrowhead);
           } )
   }

   // Render graphics, recursing to animate if a TrackballControl is present
   render() {
      this.renderer.render(this.scene, this.camera);
      if (this.camControls !== undefined) {
         window.requestAnimationFrame( () => this.render() );
         this.camControls.update();
      }
   }

   updateZoomLevel(diagram3D) {
      this.camera.zoom = diagram3D.zoomLevel;
      this.camera.updateProjectionMatrix();
   }

   updateLineWidth(diagram3D) {
      this.updateLines(diagram3D);
   }

   updateNodeRadius(diagram3D) {
      this.updateNodes(diagram3D);
      this.updateArrowheads(diagram3D);
   }

   // reduce fog level by increasing 'far' parameter (experimentally determined parameters :-)
   updateFogLevel(diagram3D) {
      const cameraDistance = this.camera.position.length();
      this.scene.fog.far = (diagram3D.fogLevel == 0) ? 100 : (cameraDistance + 6 - 7*diagram3D.fogLevel);
   }

   // ToDo: adjust label placement as well
   updateLabelSize(diagram3D) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D) {
      this.updateArrowheads(diagram3D);
   }
}
