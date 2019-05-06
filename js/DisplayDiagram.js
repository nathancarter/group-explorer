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
         this.scene.fog = new THREE.Fog(DisplayDiagram.DEFAULT_BACKGROUND);
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
      this.setSize(width, height);

      if (options.container !== undefined) {
         options.container.append(this.renderer.domElement);
      }

      if (options.trackballControlled) {
         this.camControls = new THREE.TrackballControls(this.camera, options.container[0]);
      }
   }

   setSize ( w, h ) { this.renderer.setSize( w, h ); }
   getSize () {
       const size = this.renderer.getSize();
       return { w : size.width, h : size.height };
   }

   static setDefaults() {
      DisplayDiagram.groupNames = ['lights', 'spheres', 'labels', 'lines', 'arrowheads', 'nodeHighlights', 'chunks']
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
   getImage(diagram3D,options) {
      // Options parameter:
      // size: "small" or "large", default is "small"
      // resetCamera : true or false, default is true
      if ( !options ) options = { size : 'small', resetCamera : true };
      const img = new Image();

      // save diagram for use by DiagramDnD -- not used for thumbnails
      if (this.lineDnD !== undefined) {
         this.scene.userData = diagram3D;
      }

      if ( options.resetCamera ) this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D, options.size == "large" ? 20 : 5);
      if ( options.size == "large" ) {
         this.updateHighlights(diagram3D);
         this.updateLabels(diagram3D);
      }
      this.updateLines(diagram3D, options.size == "small");
      this.updateArrowheads(diagram3D);
      this.updateChunking(diagram3D);
      this.render();

      img.src = this.renderer.domElement.toDataURL();
      return img;
   }

   // Display diagram
   showGraphic(diagram3D) {
      Log.log('showGraphic');

      // save diagram for use by LineDnD
      if (this.camControls !== undefined && diagram3D.isCayleyDiagram) {
         if (this.lineDnD === undefined) {
            this.lineDnD = new DiagramDnD(this);
         }
         this.scene.userData = diagram3D;
      }

      this.setCamera(diagram3D);
      this.setBackground(diagram3D);
      this.updateLights(diagram3D);
      this.updateNodes(diagram3D);
      this.updateHighlights(diagram3D);
      this.updateLabels(diagram3D);
      this.updateLines(diagram3D);
      this.updateArrowheads(diagram3D);
      this.updateChunking(diagram3D);
      this.render();
   }

   getGroup(name) {
      return this.scene.children.find( (el) => el.name == name );
   }

   /*
    * Position the camera and point it at the center of the scene
    *
    * Camera positioned to match point of view in GE2:
    *   If diagram is generated by GE:
    *     If diagram lies entirely in y-z plane (all x == 0)
    *       place camera on z-axis, x-axis to the right, y-axis down
    *     If diagram lies entirely in the x-z plane
    *       place camera on negative y-axis, x-axis to the right, z-axis up
    *     If diagram lies entirely in the x-y plane
    *       place camera on negative z-axis, x-axis to the right, y-axis down
    *     Otherwise place camera with y-axis down, offset a bit from
    *       the (1,-1,-1) vector so that opposite corners don't line up
    *       and make cubes look flat
    *   else (diagram is specified in .group file)
    *     If diagram lies entirely in the y-z plane (all x == 0)
    *       place camera on x-axis, y-axis up (z-axis to the left)
    *     If diagram lies entirely in the x-z plane (all y == 0)
    *       place camera on y-axis, z-axis down (x-axis to the right)
    *     If diagram lies entirely in the x-y plane (all z == 0)
    *       place camera on z-axis, y-axis up (x-axis to the right)
    *     Otherwise place camera with y-axis up, offset a bit from
    *       the (1,1,1) vector so that opposite corners don't line up
    *       and make cubes look flat; look at origina, and adjust camera
    *       distance so that diagram fills field of view
    */
   setCamera(diagram3D) {
      Log.log('setCamera');

      if (diagram3D.isGenerated) {
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
            this.camera.position.set(1.7, -1.6, -1.9);
            this.camera.up.set(0, -1, 0);
         }
      } else {
         if (diagram3D.nodes.every( (node) => node.point.x == 0.0 )) {
            this.camera.position.set(3, 0, 0);
            this.camera.up.set(0, 1, 0);
         } else if (diagram3D.nodes.every( (node) => node.point.y == 0.0 )) {
            this.camera.position.set(0, 3, 0);
            this.camera.up.set(0, 0, -1);
         } else if (diagram3D.nodes.every( (node) => node.point.z == 0.0 )) {
            this.camera.position.set(0, 0, 3);
            this.camera.up.set(0, 1, 0);
         } else {
            const position = new THREE.Vector3(1.7, 1.6, 1.9).multiplyScalar(diagram3D.radius);
            this.camera.position.set(position.x, position.y, position.z);
            this.camera.up.set(0, 1, 0);
         }
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

      const spheres = this.getGroup('spheres');
      spheres.remove(...spheres.children);

      const materialsByColor = new Map(),
            geometriesByRadius = new Map();

      const default_color = DisplayDiagram.DEFAULT_NODE_COLOR;
      const default_radius = 0.3 / Math.sqrt(diagram3D.nodes.length);
      diagram3D.nodes.forEach( (node) => {
         const color = (node.color === undefined) ? default_color : node.color;
         if (!materialsByColor.has(color)) {
            materialsByColor.set(color, new THREE.MeshPhongMaterial({color: node.color}));
         }
         const material = materialsByColor.get(color);

         const radius = (node.radius === undefined) ? default_radius : node.radius;
         if (!geometriesByRadius.has(radius)) {
            geometriesByRadius.set(radius, new THREE.SphereGeometry(radius * diagram3D.nodeScale, sphere_facets, sphere_facets));
         }
         const geometry = geometriesByRadius.get(radius);

         const sphere = new THREE.Mesh(geometry, material);
         sphere.userData = {node: node};
         sphere.position.set(node.point.x, node.point.y, node.point.z);
         sphere.name = diagram3D.group.representation[node.element];
         spheres.add(sphere);
      } )
   }

   updateHighlights(diagram3D) {
      const highlights = this.getGroup('nodeHighlights');
      highlights.remove(...highlights.children);

      const materialsByColor = this.getGroup('spheres').children.reduce( (materials, sphere) => {
         if (!materials.has(sphere.material.color)) {
            materials.set(sphere.material.color, sphere.material);
         }
         return materials;
      }, new Map());

      this.getGroup('spheres').children.forEach( (sphere) => {
         const node = diagram3D.nodes[sphere.userData.node.element];

         // Find sphere's desired color: priority is colorHighlight, color, or default
         const desiredColor = new THREE.Color(
            (node.colorHighlight !== undefined) ? node.colorHighlight :
            ((node.color !== undefined) ? node.color :
             DisplayDiagram.DEFAULT_NODE_COLOR) );
         // If sphere is not desired color set material color to desired color
         if (!sphere.material.color.equals(desiredColor)) {
            if (!materialsByColor.has(desiredColor)) {
               materialsByColor.set(desiredColor, new THREE.MeshPhongMaterial({color: desiredColor}));
            }
            sphere.material = materialsByColor.get(desiredColor);
            sphere.geometry.uvsNeedUpdate = true;
            sphere.needsUpdate = true;
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

      if (diagram3D.labelSize == 0) {
         return;
      }

      const spheres = this.getGroup('spheres').children;
      const radius = spheres.find( (el) => el !== undefined ).geometry.parameters.radius;
      let canvas_width, canvas_height, label_font;
      const big_node_limit = 0.1, small_node_limit = 0.05;
      if (radius >= big_node_limit) {
         canvas_width = 4096;
         canvas_height = 256;
         label_font = '120pt Arial';
      } else if (radius <= small_node_limit) {
         canvas_width = 1024;
         canvas_height = 64;
         label_font = '32pt Arial';
      } else {
         canvas_width = 2048;
         canvas_height = 128;
         label_font = '64pt Arial';
      }
      const scale = diagram3D.labelSize * radius * 8.197 * 2;  // factor to make label size ~ radius

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
         // debug -- paint label background
         // context.fillStyle = 'rgba(0, 0, 100, 0.5)';
         // context.fillRect(0, 0, canvas.width, canvas.height);
         context.font = label_font;
         context.fillStyle = 'rgba(0, 0, 0, 1)';
         context.fillText(textLabel, 0, 0.7*canvas.height);

         const texture = new THREE.Texture(canvas)
         texture.needsUpdate = true;
         const labelMaterial = new THREE.SpriteMaterial({ map: texture });
         const label = new THREE.Sprite( labelMaterial );
         label.scale.set(scale, scale*canvas.height/canvas.width, 1.0);
         label.center = new THREE.Vector2(-0.045/diagram3D.labelSize, 0.30 - 0.72/diagram3D.labelSize);
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
                     fog: true,
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

      // offset center of arc 20% of the distance between the two nodes, in the plane of center/start/end
      if (line.style == Diagram3D.CURVED) {
         line.offset = (line.offset === undefined) ? 0.2 : line.offset;
         const points = this._curvePoints(line);
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
               line.offset = (line.offset === undefined) ? 1.7*radius/Math.sqrt(start2end_sq) : line.offset;
               const points = this._curvePoints(line);
               return points;
            }
      }

      return vertices.map( (vertex) => vertex.point );
   }

   _curvePoints(line) {
      const start_point = line.vertices[0].point,
            end_point = line.vertices[1].point,
            center = this._getCenter(line),
            start = start_point.clone().sub(center),
            end = end_point.clone().sub(center),
            offset_distance = line.offset * start_point.distanceTo(end_point),
            halfway = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),  // (start + end)/2
            start2end = end.clone().sub(start),
            x = -start.dot(start2end)/end.dot(start2end),  // start + x*end is normal to start - end
            normal = ((end.dot(start2end) == 0) ? end.clone() : start.clone().add(end.clone().multiplyScalar(x))).normalize(),
            offset = normal.clone().multiplyScalar(2*offset_distance),
            middle = center.clone().add(halfway).add(offset),
            curve = new THREE.QuadraticBezierCurve3(start_point, middle, end_point),
            points = curve.getPoints(10);
      line.middle = middle;
      return points;
   }

   _getCenter(line) {
      const centerOK = (point) => new THREE.Vector3().crossVectors(startPoint.clone().sub(point), endPoint.clone().sub(point)).lengthSq() > 1.e-4;
      const startNode = line.vertices[0],
            endNode = line.vertices[1],
            startPoint = startNode.point,
            endPoint = endNode.point;

      // if center is spec'd, check it and if OK, return that
      if (line.center !== undefined) {
         if (centerOK(line.center)) {
            return line.center;
         }
      }

      // if nodes are in the same curved group, find avg of nodes and use that as the center
      if (startNode.curvedGroup !== undefined && startNode.curvedGroup == endNode.curvedGroup) {
         line.center = startNode.curvedGroup
                                .reduce( (center, node) => center.add(node.point), new THREE.Vector3() )
                                .multiplyScalar(1/startNode.curvedGroup.length);
         if (centerOK(line.center)) {
            return line.center;
         }
      }

      // if center not spec'd, or not OK, try (0,0,0); if that's OK, return that
      line.center = new THREE.Vector3(0, 0, 0);
      if (centerOK(line.center)) {
         return line.center;
      }

      // if (0,0,0)'s not OK, form (camera, start, end) plane, get unit normal
      line.center = new THREE.Vector3().crossVectors(this.camera.position.clone().sub(startPoint),
                                                     endPoint.clone().sub(startPoint)).normalize()
                             .add(startPoint.clone().add(endPoint).multiplyScalar(0.5));
      if (centerOK(line.center)) {
         return line.center;
      }

      console.log("can't find center for line curve!");  // debug
      line.center = undefined;
      return line.center;
   }

   updateArrowheads(diagram3D) {
      Log.log('updateArrowheads');

      const spheres = this.getGroup('spheres').children;
      const lines = this.getGroup('lines').children;
      const arrowheads = this.getGroup('arrowheads');
      arrowheads.remove(...arrowheads.children);

      const arrowheadPlacement = diagram3D.arrowheadPlacement;

      lines.forEach( (line) => {
         if (! line.userData.line.arrowhead) {
            return;
         }
         const lineData = line.userData.line,
               startNode = lineData.vertices[0],
               startPoint = startNode.point,
               endNode = lineData.vertices[1],
               endPoint = endNode.point,
               nodeRadius = spheres[endNode.element].geometry.parameters.radius,
               center2center = startPoint.distanceTo(endPoint),
               headLength = Math.min(nodeRadius, (center2center - 2*nodeRadius)/2),
               headWidth = 0.6 * headLength,
               arrowLength = 1.1 * headLength,
               color = lineData.color;
         if (center2center <= 2*nodeRadius) {
            return;
         }
         // 0.001 offset to make arrowhead stop at node surface
         let arrowStart, arrowDir;
         if (lineData.offset === undefined) {
            const length = center2center,
                  arrowPlace = 0.001 + (nodeRadius - 0.1*headLength + (length - 2*nodeRadius - headLength) * arrowheadPlacement) / length;
            arrowDir = endPoint.clone().sub(startPoint).normalize();
            arrowStart = new THREE.Vector3().addVectors(startPoint.clone().multiplyScalar(1-arrowPlace), endPoint.clone().multiplyScalar(arrowPlace));
         } else {
            const bezier = new THREE.QuadraticBezierCurve3(startPoint, lineData.middle, endPoint),
                  length = bezier.getLength(),
                  arrowPlace = 0.001 + (nodeRadius - 0.1*headLength + (length - 2*nodeRadius - headLength) * arrowheadPlacement)/length,
                  arrowTip = bezier.getPointAt(arrowPlace + headLength/length);
            arrowStart = bezier.getPointAt(arrowPlace);
            arrowDir = arrowTip.clone().sub(arrowStart).normalize();
         }
         const arrowhead = new THREE.ArrowHelper(arrowDir, arrowStart, arrowLength, color, headLength, headWidth);
         arrowheads.add(arrowhead);
      } )
   }

   updateChunking(diagram3D) {
      Log.log('updateChunking');

      // remove old chunks
      const chunks = this.getGroup('chunks');
      chunks.remove(...chunks.children);

      // find new chunk
      if (diagram3D.chunk === undefined) {
         return;
      }

      // utility functions
      const centroid = (points) => points.reduce( (sum, point) => sum.add(point), new THREE.Vector3() ).multiplyScalar(1/points.length);

      const getGeometry = () => {
         // get points of subgroup
         const strategy_index = diagram3D.chunk;
         const chunk_members = diagram3D.strategies[strategy_index].bitset;
         const chunk_points = chunk_members.toArray().map( (el) => diagram3D.nodes[el].point );
         const chunk_size = chunk_points.length;

         // find (x,y,z) extrema of subgroup nodes
         const [X_min, X_max, Y_min, Y_max, Z_min, Z_max] = chunk_points.reduce(
            ([Xm,XM,Ym,YM,Zm,ZM], p) => [Math.min(Xm,p.x),Math.max(XM,p.x),Math.min(Ym,p.y),Math.max(YM,p.y),Math.min(Zm,p.z),Math.max(ZM,p.z)],
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);

         let padding;
         if (chunk_size == diagram3D.group.order) {
            padding = 0.2 * Math.max(X_max - X_min, Y_max - Y_min, Z_max - Z_min);
         } else {
            const coset_membership = diagram3D.group
                                              .getCosets(chunk_members, true)
                                              .reduce( (mem, coset, inx) => {
                                                 coset.toArray().forEach( (el) => mem[el] = inx );
                                                 return mem;
                                              }, Array.from({length: chunk_size}) );
            padding = Math.sqrt(diagram3D.group.elements.reduce( (minsq, i) => {
               return diagram3D.group.elements.reduce( (minsq, j) => {
                  if (coset_membership[i] == coset_membership[j]) {
                     return minsq;
                  }
                  return Math.min(minsq, diagram3D.nodes[i].point.distanceToSquared(diagram3D.nodes[j].point));
               }, minsq)
            }, Number.POSITIVE_INFINITY ) ) / 3;  // set clearance to 1/3 of minimum distance from any node to any other node not in its coset
         }

         // make box
         const box_centroid = centroid(chunk_points);
         const sideLength = (max, min, center) => 2*(Math.max(Math.abs(max - center), Math.abs(min - center)) + padding);
         return new THREE.BoxGeometry(sideLength(X_max, X_min, box_centroid.x), sideLength(Y_max, Y_min, box_centroid.y), sideLength(Z_max, Z_min, box_centroid.z));
      }
      const box_geometry = getGeometry();

      const box_material = new THREE.MeshBasicMaterial( {
         color: 0x303030,
         opacity: 0.2,
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,  // needed to keep from obscuring labels underneath
         depthTest: false,
      } );

      let subgroup_name;  // MathML subgroup name, generated first time through
      const createChunks = (arr, desired, current = diagram3D.strategies.length - 1) => {
         if (current == desired) {
            const nodes = arr._flatten();
            const elements = new BitSet(diagram3D.group.order, nodes.map( (node) => node.element ));
            const points = nodes.map( (node) => node.point );
            const box = new THREE.Mesh(box_geometry, box_material);
            if (subgroup_name === undefined) {
               const subgroup_index = diagram3D.group.subgroups.findIndex( (subgroup) => subgroup.members.equals(elements) );
               subgroup_name = `<msub><mi>H</mi><mn>${subgroup_index}</mn></msub>`;
            }
            box.name = diagram3D.group.representation[nodes[0].element] + subgroup_name;
            box.position.set(...centroid(points).toArray());
            return [box];
         } else {
            const boxes = arr.map( (el) => createChunks(el, desired, current-1) );
            const all_boxes = boxes._flatten();
            const strategy = diagram3D.strategies[current];
            if (strategy.layout == CayleyDiagram.ROTATED_LAYOUT) {
               // find centroid of all boxes
               const center = centroid(all_boxes.map( (box) => box.position ));
               // calculate normalized vector from centroid of all boxes to centroid of boxes[0]
               const ref = centroid(boxes[0].map( (box) => box.position )).sub(center).normalize();
               // calculate normal to plane containing center, first, and second (and presumably all other) centroids
               const normal = centroid(boxes[1].map( (box) => box.position )).sub(center).normalize().cross(ref).normalize();
               boxes.forEach( (bxs) => {
                  // find angle between centroid of first box and centroid(bxs)
                  const curr = centroid(bxs.map( (box) => box.position )).sub(center).normalize();
                  if (Math.abs(1 - curr.dot(ref)) > 1e-6) {  // check that boxes aren't co-linear
                     const theta = Math.acos(ref.dot(curr))*Math.sign(normal.dot(new THREE.Vector3().crossVectors(ref,curr)));
                     bxs.forEach( (box) => box.rotateOnAxis(normal, theta) );
                  }
               } );
            }
            return all_boxes;
         }
      }

      chunks.add(...createChunks(diagram3D.ordered_nodes, diagram3D.chunk));
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
      this.updateLabels(diagram3D);
      this.updateArrowheads(diagram3D);
   }

   // reduce fog level by increasing 'far' parameter (experimentally determined coefficients :-)
   //   (diagram3D.fogLevel is in [0,1])
   updateFogLevel(diagram3D) {
      // distance of furthest point from (0,0,0)
      const squaredRadius = diagram3D.nodes.reduce( (sqrad,nd) => Math.max(sqrad, nd.point.lengthSq()), 0 );
      const sceneRadius = (squaredRadius == 0) ? 1 : Math.sqrt(squaredRadius);  // in case there's only one element
      const cameraDistance = this.camera.position.length();
      this.scene.fog.color = new THREE.Color(diagram3D.background);
      this.scene.fog.near = cameraDistance - sceneRadius - 1;
      this.scene.fog.far = (diagram3D.fogLevel == 0) ? 100 : (cameraDistance + sceneRadius*(5 - 4*diagram3D.fogLevel));
   }

   updateLabelSize(diagram3D) {
      this.updateLabels(diagram3D);
   }

   updateArrowheadPlacement(diagram3D) {
      this.updateArrowheads(diagram3D);
   }

   // get objects at point x,y using raycasting
   getObjectsAtPoint(x, y) {
      const mouse = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      let intersects = raycaster.intersectObjects(this.getGroup('spheres').children, false);
      if (intersects.length == 0) {
         intersects = raycaster.intersectObjects(this.getGroup('chunks').children, false);
      }

      return Array.from(new Set(intersects.map( (intersect) => intersect.object )));
   }

   // Be able to answer the question of where in the diagram any given element is drawn.
   // We answer in normalized coordinates, [0,1]x[0,1].
   unitSquarePosition ( element, cayleyDiagram ) {
      const point3d = cayleyDiagram.nodes[element].point.clone(),
            point2d = point3d.project( this.camera );
      return { x : point2d.x/2 + 1/2, y : -point2d.y/2 + 1/2 };
   }

   // two serialization functions
   toJSON ( cayleyDiagram ) {
      const tmp = {
         groupURL : cayleyDiagram.group.URL,
         _diagram_name : cayleyDiagram.diagram_name,
         highlights : cayleyDiagram.highlights,
         elements : cayleyDiagram.elements,
         zoomLevel : cayleyDiagram.zoomLevel,
         lineWidth : cayleyDiagram.lineWidth,
         nodeScale : cayleyDiagram.nodeScale,
         fogLevel : cayleyDiagram.fogLevel,
         labelSize : cayleyDiagram.labelSize,
         arrowheadPlacement : cayleyDiagram.arrowheadPlacement,
         arrowColors : cayleyDiagram.arrowColors,
         _camera : this.camera.matrix.toArray(),
         highlights : {
            background : cayleyDiagram.nodes.map( n => n.colorHighlight ),
            ring : cayleyDiagram.nodes.map( n => n.ringHighlight ),
            square : cayleyDiagram.nodes.map( n => n.squareHighlight )
         },
         strategies : cayleyDiagram.getStrategies(),
         arrows : cayleyDiagram.lines.map( x => x.arrow )
            .filter( ( v, i, s ) => s.indexOf( v ) === i ), // incl. each only 1x
         nodePositions : cayleyDiagram.nodes.map( node => {
            return { x : node.point.x, y : node.point.y, z : node.point.z };
         } ),
         nodeRadii : cayleyDiagram.nodes.map( node => node.radius ),
         chunkIndex : cayleyDiagram.chunk,
         arrowsData : cayleyDiagram.lines.map( ( arrow, index ) => {
            return { style : arrow.style, offset : arrow.offset };
         } )
      };
      // console.log( 'Sending:', tmp );
      return tmp;
   }
   fromJSON ( json, cayleyDiagram ) {
      // console.log( 'Received:', json );
      // no check for has own property, because we want to erase it
      // if it isn't included in the diagram
      cayleyDiagram.diagram_name = json._diagram_name;
      if ( json.hasOwnProperty( 'highlights' ) )
         cayleyDiagram.highlights = json.highlights;
      if ( json.hasOwnProperty( 'elements' ) )
         cayleyDiagram.elements = json.elements;
      if ( json.hasOwnProperty( 'zoomLevel' ) )
         cayleyDiagram.zoomLevel = json.zoomLevel;
      if ( json.hasOwnProperty( 'lineWidth' ) )
         cayleyDiagram.lineWidth = json.lineWidth;
      if ( json.hasOwnProperty( 'nodeScale' ) )
         cayleyDiagram.nodeScale = json.nodeScale;
      if ( json.hasOwnProperty( 'fogLevel' ) )
         cayleyDiagram.fogLevel = json.fogLevel;
      if ( json.hasOwnProperty( 'labelSize' ) )
         cayleyDiagram.labelSize = json.labelSize;
      if ( json.hasOwnProperty( 'arrowColors' ) )
         cayleyDiagram.arrowColors = json.arrowColors;
      if ( json.hasOwnProperty( 'arrowheadPlacement' ) )
         cayleyDiagram.arrowheadPlacement = json.arrowheadPlacement;
      if ( json.hasOwnProperty( 'strategies' ) )
         cayleyDiagram.setStrategies( json.strategies );
      if ( json.hasOwnProperty( 'arrows' ) ) {
         cayleyDiagram.removeLines();
         json.arrows.map( x => cayleyDiagram.addLines( x ) );
         cayleyDiagram.setLineColors();
      }
      if ( json.hasOwnProperty( '_camera' ) ) {
         this.camera.matrix.fromArray( json._camera );
         this.camera.matrix.decompose(
            this.camera.position,
            this.camera.quaternion,
            this.camera.scale
         );
      }
      if ( json.highlights && json.highlights.background )
         json.highlights.background.map( ( color, index ) => {
            cayleyDiagram.nodes[index].colorHighlight = color;
         } );
      if ( json.highlights && json.highlights.ring )
         json.highlights.ring.map( ( color, index ) => {
            cayleyDiagram.nodes[index].ringHighlight = color;
         } );
      if ( json.highlights && json.highlights.square )
         json.highlights.square.map( ( color, index ) => {
            cayleyDiagram.nodes[index].squareHighlight = color;
         } );
      if ( json.nodePositions )
         json.nodePositions.map( ( position, index ) => {
            cayleyDiagram.nodes[index].point.x = position.x;
            cayleyDiagram.nodes[index].point.y = position.y;
            cayleyDiagram.nodes[index].point.z = position.z;
         } );
      if ( json.nodeRadii )
         json.nodeRadii.map( ( radius, index ) =>
            cayleyDiagram.nodes[index].radius = radius );
      if ( json.hasOwnProperty( 'chunkIndex' ) )
         cayleyDiagram.chunk = json.chunkIndex;
      if ( json.arrowsData )
         json.arrowsData.map( ( arrow, index ) => {
            cayleyDiagram.lines[index].style = arrow.style;
            cayleyDiagram.lines[index].offset = arrow.offset;
         } );
   }
}
