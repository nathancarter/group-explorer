declare class THREE {
   static ArrowHelper: typeof THREE_ArrowHelper;
   static BoxGeometry: typeof THREE_BoxGeometry;
   static BufferGeometry: typeof THREE_BufferGeometry;
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
   static Points: typeof THREE_Points;
   static PointsMaterial: typeof THREE_PointsMaterial;
   static QuadraticBezierCurve3: typeof THREE_QuadraticBezierCurve3;
   static Quaternion: typeof THREE_Quaternion;
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

interface THREE_Raycastable {
   raycast(raycaster: THREE.Raycaster, intersects: Array<THREE_Intersection>): void;
}

declare class THREE_ArrowHelper extends THREE.Object3D {
   constructor(dir: THREE.Vector3, origin: THREE.Vector3, length: number, color: number, headLength: number, headWidth: number): void;
}

declare class THREE_BoxGeometry extends THREE.Geometry {
   constructor(width: number, height: number, depth: number): void;
}

declare class THREE_BufferGeometry {
   isBufferGeometry: boolean;
   userData?: any;
   dispose(): void;
}

declare class THREE_Color {
   constructor(color: number | string): void;
   equals(color: THREE.Color): boolean;
   getHex(): number;
   getHexString(): string;
   set(value: THREE.Color | number | color): THREE.Color;
};

declare class THREE_DirectionalLight extends THREE.Object3D {
}

declare class THREE_Fog {
   constructor(color: number | string): void;
   color: THREE.Color;
   far: number;
   near: number;
}

declare class THREE_Geometry {
   isGeometry: boolean;
   parameters: {radius: float};
   uvsNeedUpdate: boolean;
   vertices: Array<THREE.Vector3>;
   verticesNeedUpdate: boolean;
   dispose(): void;
}

declare class THREE_Group extends THREE.Object3D {
   constructor(): void;
   add(THREE.Object3D): THREE.Object3D;
   children: Array<THREE.Object3D>;
   name: string;
   remove(THREE.Object3D): THREE.Object3D;
}

declare class THREE_Line extends THREE.Object3D implements THREE_Raycastable {
   constructor(geometry: THREE.Geometry, material: THREE.Material): void;
   geometry: THREE.Geometry;
   isLine: boolean;
   material: THREE.Material;
   raycast(raycaster: THREE.Raycaster, intersects: Array<THREE_Intersection>): void;
}

declare class THREE_Line3 {
   constructor(start: THREE.Vector3, end: THREE.Vector3): void;
   closestPointToPoint(point: THREE.Vector3, clampToLine: boolean, target: THREE.Vector3): THREE.Vector3;
   closestPointToPointParameter(point: THREE.Vector3, clampToLine: boolean): float;
   distance(): float;
   distanceSq(): float;
}

declare class THREE_LineBasicMaterial extends THREE.Material {
   constructor({color: number | string}): void;
}

declare class THREE_Material {
   color: THREE.Color;
   userData?: any;
}

declare class THREE_Matrix3 {
   set(number, number, number,
       number, number, number,
       number, number, number): THREE.Matrix3;
   elements: Array<number>;
   getInverse(THREE.Matrix3): THREE.Matrix3;
   transpose(): THREE.Matrix3;
}

declare class THREE_Matrix4 {
   clone(): THREE.Matrix4;
   decompose(position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3): void;
   fromArray(array: Array<number>): THREE.Matrix4;
   getInverse(THREE.Matrix4): THREE.Matrix4;
   makeBasis(xAxis: THREE.Vector3, yAxis: THREE.Vector3, zAxis: THREE.Vector3): THREE.Matrix4;
   makeRotationX(number): THREE.Matrix4;
   makeRotationY(number): THREE.Matrix4;
   makeRotationZ(number): THREE.Matrix4;
   makeScale(number, number, number): THREE.Matrix4;
   makeTranslation(number, number, number): THREE.Matrix4;
   multiply(THREE.Matrix4): THREE.Matrix4;
   set(number, number, number, number,
       number, number, number, number,
       number, number, number, number,
       number, number, number, number): void;
   setPosition(THREE.Vector3): THREE.Matrix4;
   toArray(): Array<number>;
}

declare class THREE_Mesh extends THREE.Object3D implements THREE_Raycastable {
   constructor(geometry: THREE.Geometry | THREE.BufferGeometry, material: THREE.Material): void;
   geometry: THREE.Geometry | THREE.BufferGeometry;
   isMesh: boolean;
   material: THREE.Material;
   name: string;
   raycast(raycaster: THREE.Raycaster, intersects: Array<THREE_Intersection>): void;
}

declare class THREE_MeshBasicMaterial extends THREE.Material {
   constructor({[key: string]: any}): void;
}

declare class THREE_MeshPhongMaterial extends THREE.Material {
   constructor({color: number | string}): void;
}

declare class THREE_Object3D {
   id: number;
   matrix: THREE.Matrix4;
   name: string;
   parent: THREE.Object3D;
   position: THREE.Vector3;
   quaternion: THREE.Quaternion;
   scale: THREE.Vector3;
   type: 'Line' | 'Mesh';
   up: THREE.Vector3;
   userData: any;
   uuid: string;
   rotateOnAxis(axis: THREE.Vector3, angle: number): THREE.Object3D;
}

declare class THREE_PerspectiveCamera extends THREE.Object3D {
   constructor(fov: number, aspect: number, near: number, far: number): void;
   aspect: number;
   zoom: number;
   lookAt(THREE.Vector3): void;
   updateProjectionMatrix(): void;
}

declare class THREE_Plane {
   constructor(): void;
   normal: THREE.Vector3;
   intersectLine(line: THREE.Line3, target: THREE.Vector3): THREE.Vector3;
   setFromCoplanarPoints(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Plane;
   setFromNormalAndCoplanarPoint(normal: THREE.Vector3, point: THREE.Vector3): THREE.Plane;
}

declare class THREE_Points extends THREE.Object3D {
   constructor(geometry: THREE.Geometry, material: THREE.Material): void;
}

declare class THREE_PointsMaterial extends THREE.Material {
   constructor(parameters: {color: number | string, size: number, sizeAttenuation: boolean}): void;
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

declare class THREE_Raycaster {
   linePrecision: number;
   ray: {origin: THREE.Vector3, direction: THREE.Vector3};
   intersectObjects(objects: Array<THREE_Raycastable>, recursive: boolean): Array<THREE_Intersection>;
   setFromCamera(coords: THREE.Vector2, camera: THREE.PerspectiveCamera): void;
}

type THREE_Intersection = {distance: float, object: THREE.Object3D};

declare class THREE_Scene extends THREE.Group {
   constructor(): void;
   fog: THREE.Fog;
}

declare class THREE_SphereGeometry extends THREE.Geometry {
   constructor(radius: number, widthSegments: number, heightSegments: number): void;
}

declare class THREE_Sprite extends THREE.Object3D {
   constructor(material: ?THREE.SpriteMaterial): void;
   center: THREE.Vector2;   
}

declare class THREE_SpriteMaterial extends THREE.Material {
   constructor({map: THREE.Texture}): void;
}

declare class THREE_Texture {
   constructor(domElement: HTMLCanvasElement): void;
   needsUpdate: boolean;
}

declare class THREE_TrackballControls {
   constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement): void;
   update(): void;
}

declare class THREE_Vector2 {
   constructor(x?: number, y?: number): void;
   height: number;
   width: number;
   x: number;
   y: number;
   applyMatrix3(THREE.Matrix3): THREE.Vector2;
   set(x: number, y: number): THREE.Vector2;
}

declare class THREE_Vector3 {
   constructor(x?: number, y?: number, z?: number): void;
   x: number;
   y: number;
   z: number;
   add(THREE.Vector3): THREE.Vector3;
   addScaledVector(THREE.Vector3, float): THREE.Vector3;
   addVectors(THREE.Vector3, THREE.Vector3): THREE.Vector3;
   applyMatrix3(THREE.Matrix3): THREE.Vector3;
   applyMatrix4(THREE.Matrix4): THREE.Vector3;
   clone(): THREE.Vector3;
   cross(THREE.Vector3): THREE.Vector3;
   crossVectors(THREE.Vector3, THREE.Vector3): THREE.Vector3;
   distanceTo(THREE.Vector3): number;
   distanceToSquared(THREE.Vector3): number;
   dot(THREE.Vector3): number;
   getComponent(number): number;
   length(): number;
   lengthSq(): number;
   multiplyScalar(n: number): THREE.Vector3;
   normalize(): THREE.Vector3;
   project(camera: THREE.PerspectiveCamera): THREE.Vector3;
   projectOnVector(THREE.Vector3): THREE.Vector3;
   set(x: number, y: number, z: number): THREE.Vector3;
   sub(THREE.Vector3): THREE.Vector3;
   toArray(): Array<number>;
}

declare class THREE_WebGLRenderer {
   constructor({preserveDrawingBuffer: boolean, antialias: boolean}): void;
   domElement: HTMLCanvasElement;
   getSize(): THREE.Vector2;
   render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void;
   setClearColor(color: string | number, alpha: number): void;
   setSize(w: number, h: number): void;
}
