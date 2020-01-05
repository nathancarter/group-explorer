declare class THREE {
   static ArrowHelper: typeof THREE_ArrowHelper;
   static BoxGeometry: typeof THREE_BoxGeometry;
   static BufferGeometry: typeof THREE_BufferGeometry;
   static Camera: typeof THREE_Camera;
   static Color: typeof THREE_Color;
   static DirectionalLight: typeof THREE_DirectionalLight;
   static DoubleSide: number;
   static Fog: typeof THREE_Fog;
   static FrontSide: number;
   static Geometry: typeof THREE_Geometry;
   static Group: typeof THREE_Group;
   static Line: typeof THREE_Line;
   static Line3: typeof THREE_Line3;
   static LineBasicMaterial: typeof THREE_LineBasicMaterial;
   static Material: typeof THREE_Material;
   static Matrix3: typeof THREE_Matrix3;
   static Matrix4: typeof THREE_Matrix4;
   static Mesh: typeof THREE_Mesh;
   static MeshBasicMaterial: typeof THREE_MeshBasicMaterial;
   static MeshPhongMaterial: typeof THREE_MeshPhongMaterial;
   static Object3D: typeof THREE_Object3D;
   static PerspectiveCamera: typeof THREE_PerspectiveCamera;
   static Plane: typeof THREE_Plane;
   static QuadraticBezierCurve3: typeof THREE_QuadraticBezierCurve3;
   static Quaternion: typeof THREE_Quaternion;
   static Ray: typeof THREE_Ray;
   static Raycaster: typeof THREE_Raycaster;
   static Scene: typeof THREE_Scene;
   static SphereGeometry: typeof THREE_SphereGeometry;
   static Sprite: typeof THREE_Sprite;
   static SpriteMaterial: typeof THREE_SpriteMaterial;
   static Texture: typeof THREE_Texture;
   static TrackballControls: typeof THREE_TrackballControls;
   static Vector2: typeof THREE_Vector2;
   static Vector3: typeof THREE_Vector3;
   static WebGLRenderer: typeof THREE_WebGLRenderer;
}

declare class THREE_ArrowHelper extends THREE.Object3D {
   constructor(dir: THREE.Vector3, origin?: THREE.Vector3, length?: number, color?: number, headLength?: number, headWidth?: number): void;
}

declare class THREE_BoxGeometry extends THREE.Geometry {
   constructor(width: number, height: number, depth: number): void;
}

declare class THREE_BufferGeometry {
   isBufferGeometry: boolean;
   userData: {[key: string]: any};
   dispose(): void;
}

declare class THREE_Camera extends THREE.Object3D {
}

declare class THREE_Color {
   constructor(color: THREE.Color | string | number): void;
   equals(color: THREE.Color): boolean;
   getHex(): number;
   getHexString(): string;
   set(value: THREE.Color | string | number): THREE.Color;
};

declare class THREE_DirectionalLight extends THREE.Object3D {
}

declare class THREE_Fog {
   constructor(color: THREE.Color | string | number): void;
   color: THREE.Color;
   far: number;
   near: number;
}

declare class THREE_Geometry {
   isGeometry: boolean;
   parameters: {radius: float} & any;  /* is really subclass property -- THREE.SphereGeometry */
   uvsNeedUpdate: boolean;
   vertices: Array<THREE.Vector3>;
   verticesNeedUpdate: boolean;
   dispose(): void;
}

declare class THREE_Group extends THREE.Object3D {
   constructor(): void;
   isGroup: boolean;
}

declare class THREE_Line extends THREE.Object3D {
   constructor(geometry: THREE.Geometry, material: THREE.Material): void;
   geometry: THREE.Geometry;
   isLine: boolean;
   material: THREE.Material;
}

declare class THREE_Line3 {
   constructor(start: THREE.Vector3, end: THREE.Vector3): void;
   closestPointToPoint(point: THREE.Vector3, clampToLine: boolean, target: THREE.Vector3): THREE.Vector3;
   closestPointToPointParameter(point: THREE.Vector3, clampToLine: boolean): float;
   distance(): float;
   distanceSq(): float;
}

declare class THREE_LineBasicMaterial extends THREE.Material {
   constructor({color: THREE.Color | string | number}): void;
   color: THREE.Color;
}

type THREE_MaterialParameters = {
   depthTest?: boolean;
   depthWrite?: boolean;
   opacity?: number;
   side?: typeof THREE.FrontSide;
   transparent?: boolean;
}

declare class THREE_Material {
   depthTest: boolean;
   depthWrite: boolean;
   opacity: number;
   side: typeof THREE.FrontSide;
   transparent: boolean;
   userData: any;
   color: THREE.Color;  /* really only subclass property -- THREE.LineBasicMaterial */
   dispose(): void;
}

declare class THREE_Matrix3 {
   elements: Array<number>;
   getInverse(m: THREE.Matrix3): THREE.Matrix3;
   set(n11: number, n12: number, n13: number,
       n21: number, n22: number, n23: number,
       n31: number, n32: number, n33: number): THREE.Matrix3;
   transpose(): THREE.Matrix3;
}

declare class THREE_Matrix4 {
   clone(): THREE.Matrix4;
   decompose(position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3): void;  /* ?? */
   fromArray(array: Array<number>): THREE.Matrix4;
    getInverse(m: THREE.Matrix4): THREE.Matrix4;
   makeBasis(xAxis: THREE.Vector3, yAxis: THREE.Vector3, zAxis: THREE.Vector3): THREE.Matrix4;
   makeRotationX(theta: number): THREE.Matrix4;
   makeRotationY(theta: number): THREE.Matrix4;
   makeRotationZ(theta: number): THREE.Matrix4;
   makeScale(x: number, y: number, z: number): THREE.Matrix4;
   makeTranslation(x: number, y: number, z: number): THREE.Matrix4;
   multiply(m: THREE.Matrix4): THREE.Matrix4;
   set(n11: number, n12: number, n13: number, n14: number,
       n21: number, n22: number, n23: number, n24: number,
       n31: number, n32: number, n33: number, n34: number,
       n41: number, n42: number, n43: number, n44: number): THREE.Matrix4;
   setPosition(v: THREE.Vector3): THREE.Matrix4;
   toArray(): Array<number>;
}

declare class THREE_Mesh extends THREE.Object3D {
   constructor(geometry: THREE.Geometry | THREE.BufferGeometry, material: THREE.Material): void;
   geometry: THREE.Geometry | THREE.BufferGeometry;
   isMesh: boolean;
   material: THREE.Material;
}

type THREE_MeshBasicMaterialParameters = THREE_MaterialParameters & { color?: THREE.Color | string | number; }

declare class THREE_MeshBasicMaterial extends THREE.Material {
   constructor(parameters?: THREE_MeshBasicMaterialParameters): void;
   color: THREE.Color;
}

type THREE_MeshPhongMaterialParameters = THREE_MaterialParameters & { color?: THREE.Color | string | number; }

declare class THREE_MeshPhongMaterial extends THREE.Material {
   constructor(parameters?: THREE_MeshPhongMaterialParameters): void;
}

declare class THREE_Object3D {
   static DefaultUp: THREE.Vector3;
   id: number;
   children: Array<THREE.Object3D>;
   matrix: THREE.Matrix4;
   name: string;
   parent: THREE.Object3D;
   position: THREE.Vector3;
   quaternion: THREE.Quaternion;
   scale: THREE.Vector3;
   type: string;
   up: THREE.Vector3;
   userData: { [key: string]: any };
   uuid: string;
   add(...Array<THREE.Object3D>): THREE.Object3D;
   lookAt(vector: THREE.Vector3): void;
   remove(...Array<THREE.Object3D>): THREE.Object3D;
   rotateOnAxis(axis: THREE.Vector3, angle: number): THREE.Object3D;
}

declare class THREE_PerspectiveCamera extends THREE.Camera {
   constructor(fov: number, aspect: number, near?: number, far?: number): void;
   aspect: number;
   zoom: number;
   updateProjectionMatrix(): void;
}

declare class THREE_Plane {
   constructor(): void;
   normal: THREE.Vector3;
   intersectLine(line: THREE.Line3, target: THREE.Vector3): THREE.Vector3;
   setFromCoplanarPoints(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Plane;
   setFromNormalAndCoplanarPoint(normal: THREE.Vector3, point: THREE.Vector3): THREE.Plane;
}

declare class THREE_QuadraticBezierCurve3 {
   constructor(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): void;
   getLength(): number;
   getPointAt(u: number): THREE.Vector3;
   getPoints(divisions: number): Array<THREE.Vector3>;
}

declare class THREE_Quaternion {
   constructor(x: number, y: number, z: number, w: number): void;
}

declare class THREE_Ray {
   origin: THREE.Vector3;
   direction: THREE.Vector3;
}

declare class THREE_Raycaster {
   linePrecision: number;
   ray: THREE.Ray;
   intersectObjects(objects: Array<THREE.Object3D>, recursive: boolean): Array<THREE_Intersection>;
   setFromCamera(coords: THREE.Vector2, camera: THREE.Camera): void;
}

type THREE_Intersection = {distance: float, object: THREE.Object3D};

declare class THREE_Scene extends THREE.Object3D {
   constructor(): void;
   background: THREE.Color;
   fog: THREE.Fog;
}

declare class THREE_SphereGeometry extends THREE.Geometry {
   constructor(radius: number, widthSegments: number, heightSegments: number): void;
   parameters: {
      radius: float;
      widthSegments: number;
      heightSegments: number;
   };
}

declare class THREE_Sprite extends THREE.Object3D {
   constructor(material?: THREE.SpriteMaterial): void;
   center: THREE.Vector2;   
}

declare class THREE_SpriteMaterial extends THREE.Material {
   constructor({map: THREE.Texture}): void;
}

declare class THREE_Texture {
   constructor(image: HTMLCanvasElement): void;
   needsUpdate: boolean;
}

declare class THREE_TrackballControls {
   constructor(camera: THREE.Camera, domElement: HTMLElement): void;
   update(): void;
}

declare class THREE_Vector2 {
   constructor(x?: number, y?: number): void;
   height: number;
   width: number;
   x: number;
   y: number;
   applyMatrix3(m: THREE.Matrix3): THREE.Vector2;
   set(x: number, y: number): THREE.Vector2;
}

declare class THREE_Vector3 {
   constructor(x?: float, y?: float, z?: float): void;
   x: float;
   y: float;
   z: float;
   add(v: THREE.Vector3): THREE.Vector3;
   addScaledVector(v: THREE.Vector3, s: float): THREE.Vector3;
   addVectors(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3;
   applyMatrix3(m: THREE.Matrix3): THREE.Vector3;
   applyMatrix4(m: THREE.Matrix4): THREE.Vector3;
   clone(): THREE.Vector3;
   copy(v: THREE.Vector3): THREE.Vector3;
   cross(v: THREE.Vector3): THREE.Vector3;
   crossVectors(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3;
   distanceTo(v: THREE.Vector3): float;
   distanceToSquared(v: THREE.Vector3): float;
   dot(v: THREE.Vector3): float;
   getComponent(index: number): float;
   length(): float;
   lengthSq(): float;
   multiplyScalar(s: float): THREE.Vector3;
   normalize(): THREE.Vector3;
   project(camera: THREE.Camera): THREE.Vector3;
   projectOnVector(v: THREE.Vector3): THREE.Vector3;
   set(x: float, y: float, z: float): THREE.Vector3;
   sub(v: THREE.Vector3): THREE.Vector3;
   toArray(): Array<float>;
}

declare class THREE_WebGLRenderer {
   constructor({
      preserveDrawingBuffer?: boolean,
      antialias?: boolean,
      canvas?: HTMLCanvasElement,
   }): void;
   domElement: HTMLCanvasElement;
   getClearColor(): THREE.Color;
   getContext(): WebGLRenderingContext;
   getSize(target: THREE.Vector2): THREE.Vector2;
   render(scene: THREE.Scene, camera: THREE.Camera): void;
   setClearColor(color: THREE.Color | string | number, alpha: float): void;
   setSize(width: float, height: float): void;
}
