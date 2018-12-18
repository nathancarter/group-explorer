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
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads', 'nodeHighlights']
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

   // Small graphics don't need high resolution features such as many-faceted spheres, labels, thick lines
   // Removing labels is particularly beneficial, since each label (384 in Tesseract) requires a canvas element
   //   and a context, which often causes loading failure due to resource limitations
   getImage(diagram3D) {
      const img = new Image();
      // this.showGraphic(diagram3D);

      diagram3D.normalize();

      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D, 5);  // 5 facets instead of 20
      // this.updateHighlights(diagram3D);
      // this.updateLabels(diagram3D);
      this.updateLines(diagram3D, true);  // use webgl native line width
      this.updateArrowheads(diagram3D);
      this.render();

      img.src = this.renderer.domElement.toDataURL();
      return img;
   }

   // Display diagram
   showGraphic(diagram3D) {
      Log.log('showGraphic');

      diagram3D.normalize();

      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D);
      this.updateHighlights(diagram3D);
      this.updateLabels(diagram3D);
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
      this.render();
   }

   getGroup(name) {
      return this.scene.children.find( (el) => el.name == name );
   }

   /*
    * Position the camera and point it at the center of the scene
    *
    * Camera positioned to match point of view in GE2:
    *   If diagram lies entirely in y-z plane (all x == 0)
    *     place camera on z-axis, x-axis to the right, y-axis down
    *   If diagram lies entirely in the x-z plane
    *     place camera on negative y-axis, x-axis to the right, z-axis up
    *   If diagram lies entirely in the x-y plane
    *     place camera on negative z-axis, x-axis to the right, y-axis down
    *   Otherwise place camera on (1,-1,-1) vector with y-axis down
    */
   setCamera(diagram3D) {
      Log.log('setCamera');

      if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
         this.camera.position.set(3, 0, 0);
         this.camera.up.set(0, -1, 0);
      } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
         this.camera.position.set(0, -3, 0);
         this.camera.up.set(0, 0, 1);
      } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
         this.camera.position.set(0, 0, -3);
         this.camera.up.set(0, -1, 0);
      } else {
         this.camera.position.set(2, -2, -2);
         this.camera.up.set(0, -1, 0);
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
   updateNodes(diagram3D, sphere_facets = 20) {
      Log.log('updateNodes');

      const defaultNodeRadius = 0.3 / Math.sqrt(diagram3D.nodes.length);

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      diagram3D.nodes.forEach( (node) => {
         const nodeColor = (node.color === undefined) ? DisplayDiagram.DEFAULT_NODE_COLOR : node.color,
               nodeRadius = (node.radius === undefined) ? defaultNodeRadius : node.radius,
               scaledNodeRadius = diagram3D.nodeScale * nodeRadius,
               sphereMaterial = new THREE.MeshPhongMaterial({color: nodeColor}),
               sphereGeometry = new THREE.SphereGeometry(scaledNodeRadius, sphere_facets, sphere_facets),
               sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         spheres.add(sphere);
      } )
   }

   updateHighlights(diagram3D) {
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children);

      this.getGroup('spheres').children.forEach( (sphere) => {
         const node = diagram3D.nodes[sphere.userData.node.element];

         // Find sphere's desired color: priority is colorHighlight, color, or default
         const desiredColor = new THREE.Color(
            (node.colorHighlight !== undefined) ? node.colorHighlight :
            ((node.color !== undefined) ? node.color :
             DisplayDiagram.DEFAULT_NODE_COLOR) );
         // If sphere is not desired color set material color to desired color
         if (!sphere.material.color.equals(desiredColor)) {
            sphere.material.color = new THREE.Color(desiredColor);
         }

         // if node has ring, draw it
         if (node.ringHighlight !== undefined) {
            this._drawRing(node, sphere.geometry.parameters.radius);
         }

         // if node has square, draw it
         if (node.squareHighlight !== undefined) {
            this._drawSquare(node, sphere.geometry.parameters.radius);
         }
      } );
   }

   _drawRing(node, nodeRadius) {
      // Expand ring to clear sphere
      const scale = 2.5 * nodeRadius;  // 2.5: experimental computer science in action...

      // create new canvas with enough pixels to get smooth circle
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw circle
      const context = canvas.getContext('2d');
      context.lineWidth = 0.66 / scale;  // scales to webGl lineWidth = 10
      context.strokeStyle = node.ringHighlight;
      context.beginPath();
      context.arc(canvas.width/2, canvas.height/2, canvas.width/2-6, 0, 2*Math.PI);
      context.stroke();

      // create texture
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      // create material, sprite
      const ringMaterial = new THREE.SpriteMaterial({ map: texture });
      const ring = new THREE.Sprite(ringMaterial);

      // scale, position middle of ring
      ring.scale.set(scale, scale, 1);
      ring.center = new THREE.Vector2(0.5, 0.5);
      ring.position.set(node.point.x, node.point.y, node.point.z);

      this.getGroup('nodeHighlights').add(ring);
   }

   _drawSquare(node, nodeRadius) {
      // Expand square to clear ring (which clears sphere)
      const scale = 2.65 * nodeRadius;

      // create new canvas
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;

      // get context, draw square
      const context = canvas.getContext('2d');
      context.lineWidth = 1.2 / scale;  // scales to webGl lineWidth = 10
      context.strokeStyle = node.squareHighlight;
      context.rect(0, 0, canvas.width, canvas.height);
      context.stroke();

      // create texture
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      // create material, sprite
      const squareMaterial = new THREE.SpriteMaterial({ map: texture });
      const square = new THREE.Sprite(squareMaterial);

      // scale, position middle of square
      square.scale.set(scale, scale, 1);
      square.center = new THREE.Vector2(0.5, 0.5);
      square.position.set(node.point.x, node.point.y, node.point.z);

      this.getGroup('nodeHighlights').add(square);
   }

   // Draw labels on sprites positioned at nodes
   updateLabels(diagram3D) {
      Log.log('updateLabels');

      const labels = this.getGroup('labels');
      labels.remove(...labels.children);

      const spheres = this.getGroup('spheres').children;
      const nominal_radius = spheres.find( (el) => el !== undefined ).geometry.parameters.radius;
      const scale = 12 * nominal_radius * diagram3D.labelSize;
      let canvas_width, canvas_height, label_font, label_offset;
      const big_node_limit = 0.1, small_node_limit = 0.05;
      if (nominal_radius >= big_node_limit) {
         canvas_width = 2048
         canvas_height = 256;
         label_font = '120pt Arial';
         label_offset = 160 * Math.sqrt(diagram3D.nodeScale);  // don't know why, it just looks better
      } else if (nominal_radius <= small_node_limit) {
         canvas_width = 512;
         canvas_height = 64;
         label_font = '32pt Arial';
         label_offset = 40 * Math.sqrt(diagram3D.nodeScale);
      } else {
         canvas_width = 1024;
         canvas_height = 128;
         label_font = '64pt Arial';
         label_offset = 80 * Math.sqrt(diagram3D.nodeScale);
      }

      spheres.forEach( (sphere) => {
         const node = sphere.userData.node;
         if (node.label === undefined || node.label == '') {
            return;
         };

         // make canvas big enough for any label and offset it to clear the node while still being close
         const canvas = document.createElement('canvas');
         canvas.id = `label_${node.element}`;
         const context = canvas.getContext('2d');

         const textLabel = mathml2text(node.label);
         canvas.width =  canvas_width;
         canvas.height = canvas_height;
         context.font = label_font;
         context.fillStyle = 'rgba(0, 0, 0, 1.0)';
         context.fillText(textLabel, label_offset, 0.7*canvas.height);

         const texture = new THREE.Texture(canvas)
         texture.needsUpdate = true;
         const labelMaterial = new THREE.SpriteMaterial({ map: texture });
         const label = new THREE.Sprite( labelMaterial );
         label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);
         label.center = new THREE.Vector2(0.0, 0.0);
         label.position.set(...node.point.toArray())

         labels.add(label);
      } )
   }

   /*
    * Draw lines between nodes
    *   An arc is drawn in the plane specified by the two ends and the center, if one is given, or [0,0,0]
    */
   updateLines(diagram3D, use_webgl_native_lines) {
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
               lineWidth = use_webgl_native_lines ? 1 : (isIOS ? DisplayDiagram.IOS_LINE_WIDTH : diagram3D.lineWidth),
               lineMaterial =
                  lineWidth <= maxLineWidth ?
                  new THREE.LineBasicMaterial({color: lineColor, linewidth: lineWidth}) :
                  new MeshLineMaterial({
                     color: new THREE.Color(lineColor),
                     lineWidth: lineWidth,
                     sizeAttenuation: false,
                     side: THREE.DoubleSide,
                     resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                  }),
               geometry = new THREE.Geometry();

         geometry.vertices = this._getLineVertices(line)

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

   _getLineVertices(line) {
      const spheres = this.getGroup('spheres').children,
            vertices = line.vertices;

      if (vertices.length > 2) {
         return vertices.map( (vertex) => vertex.point );
      }

      // offset center of arc 40% of the distance between the two nodes, in the plane of origin/start/end
      if (line.style == Diagram3D.CURVED) {
         const points = this._curvePoints(line, 0.4 * (line.length - 2*spheres[0].geometry.parameters.radius));
         return points;
      }

      // arc around intervening points
      const radius = spheres.find( (sphere) => sphere.geometry.parameters.radius !== undefined ).geometry.parameters.radius,
            start = vertices[0].point,
            end = vertices[1].point,
            start2end = end.clone().sub(start),
            start2end_sq = start.distanceToSquared(end),
            start2end_len = Math.sqrt(start2end_sq),
            min_squared_distance = 1.5 * radius * radius;
      for (const sphere of spheres) {
         const start2sphere = sphere.position.clone().sub(start),
               start2sphere_sq = start.distanceToSquared(sphere.position),
               end2sphere_sq = end.distanceToSquared(sphere.position),
               start2end_sq = start.distanceToSquared(end),
               x = (start2end_sq - end2sphere_sq + start2sphere_sq)/(2 * start2end_len),
               normal = start2sphere.clone().sub(start2end.clone().multiplyScalar(x/start2end_len));
         if (   start2sphere_sq != 0
             && end2sphere_sq != 0
             && x > 0
             && x < start2end_len
             && normal.lengthSq() < min_squared_distance )
            {
               const points = this._curvePoints(line, 3*radius - normal.length());
               return points;
            }
      }

      return vertices.map( (vertex) => vertex.point );
   }

   
   _curvePoints(line, offset, center = new THREE.Vector3(0, 0, 0)) {
      let middle;
      const start_point = line.vertices[0].point,
            end_point = line.vertices[1].point,
            start = start_point.clone().sub(center),
            end = end_point.clone().sub(center);

      // center lies on line -- choose a direction normal to the camera direction
      if (new THREE.Vector3().crossVectors(start, end).length() < 1e-3) {
         const normal = new THREE.Vector3().crossVectors(this.camera.position, start),
               scaled_normal = normal.multiplyScalar(offset/normal.length());
         middle = start.add(end).multiplyScalar(0.5).add(scaled_normal);
      } else {
         const halfway = start.clone().add(end).multiplyScalar(0.5),  // (start + end)/2
               start2end = end.clone().sub(start),
               x = -start.dot(start2end)/end.dot(start2end),  // a + xb is normal to b-a
               normal = (end.dot(start2end) == 0) ? end : start.clone().add(end.clone().multiplyScalar(x)),
               scaled_normal = normal.clone().multiplyScalar(offset/normal.length());
         middle = halfway.add(scaled_normal);
      }

      const curve = new THREE.QuadraticBezierCurve3(start_point, middle, end_point),
            points = curve.getPoints(10);

      return points;
   }

   updateArrowheads(diagram3D) {
      Log.log('updateArrowheads');

      const spheres = this.getGroup('spheres').children;
      const lines = this.getGroup('lines').children;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      lines.filter( (line) => line.userData.line.arrowhead )
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

   updateLabelSize(diagram3D) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D) {
      this.updateArrowheads(diagram3D);
   }
}
