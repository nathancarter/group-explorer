declare class THREE {
   static PerspectiveCamera : typeof THREE_PerspectiveCamera;
   static FrontSide : number;
   static DoubleSide : number;
   static Matrix4 : typeof THREE_Matrix4;
   static Matrix3 : typeof THREE_Matrix3;
   static Vector3 : typeof THREE_Vector3;
   static Vector2 : typeof THREE_Vector2;
   static Color : typeof THREE_Color;
   static Object3D : typeof THREE_Object3D;
   static Scene : typeof THREE_Scene;
   static WebGLRenderer : typeof THREE_WebGLRenderer;
   static TrackballControls : typeof THREE_TrackballControls;
   static Group : typeof THREE_Group;
   static Fog : typeof THREE_Fog;
   static DirectionalLight : typeof THREE_DirectionalLight;
   static MeshPhongMaterial : typeof THREE_MeshPhongMaterial;
   static SphereGeometry : typeof THREE_SphereGeometry;
   static Mesh : typeof THREE_Mesh;
   static Texture : typeof THREE_Texture;
   static SpriteMaterial : typeof THREE_SpriteMaterial;
   static Sprite : typeof THREE_Sprite;
   static LineBasicMaterial : typeof THREE_LineBasicMaterial;
   static Geometry : typeof THREE_Geometry;
   static Line : typeof THREE_Line;
   static Material : typeof THREE_Material;
   static QuadraticBezierCurve3 : typeof THREE_QuadraticBezierCurve3;
   static ArrowHelper : typeof THREE_ArrowHelper;
   static BoxGeometry : typeof THREE_BoxGeometry;
   static MeshBasicMaterial : typeof THREE_MeshBasicMaterial;
   static Quaternion : typeof THREE_Quaternion;
   static Raycaster : typeof THREE_Raycaster;
   static Points : typeof THREE_Points;
   static PointsMaterial : typeof THREE_PointsMaterial;
   static Plane : typeof THREE_Plane;
   static Line3 : typeof THREE_Line3;
}


declare class THREE_Matrix4 {
   set(number, number, number, number,
       number, number, number, number,
       number, number, number, number,
       number, number, number, number) : void;
   getInverse(THREE.Matrix4) : THREE.Matrix4;
   makeTranslation(number, number, number) : THREE.Matrix4;
   makeScale(number, number, number) : THREE.Matrix4;
   multiply(THREE.Matrix4) : THREE.Matrix4;
   makeRotationX(number) : THREE.Matrix4;
   makeRotationY(number) : THREE.Matrix4;
   makeRotationZ(number) : THREE.Matrix4;
   clone() : THREE.Matrix4;
   setPosition(THREE.Vector3) : THREE.Matrix4;
   decompose(position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3) : void;
   fromArray(array: Array<number>) : THREE.Matrix4;
   toArray() : Array<number>;
   makeBasis(xAxis: THREE.Vector3, yAxis: THREE.Vector3, zAxis: THREE.Vector3) : THREE.Matrix4;
}

declare class THREE_Matrix3 {
   set(number, number, number,
       number, number, number,
       number, number, number) : THREE.Matrix3;
   elements: Array<number>;
   getInverse(THREE.Matrix3) : THREE.Matrix3;
   transpose() : THREE.Matrix3;
}

declare class THREE_Vector3 {
   constructor(x?: number, y?: number, z?: number) : void;
   x : number;
   y : number;
   z : number;
   multiplyScalar(n : number) : THREE.Vector3;
   applyMatrix4(THREE.Matrix4) : THREE.Vector3;
   add(THREE.Vector3) : THREE.Vector3;
   addScaledVector(THREE.Vector3, float) : THREE.Vector3;
   projectOnVector(THREE.Vector3) : THREE.Vector3;
   sub(THREE.Vector3) : THREE.Vector3;
   addVectors(THREE.Vector3, THREE.Vector3) : THREE.Vector3;
   dot(THREE.Vector3) : number;
   normalize() : THREE.Vector3;
   toArray() : Array<number>;
   distanceTo(THREE.Vector3) : number;
   distanceToSquared(THREE.Vector3) : number;
   clone() : THREE.Vector3;
   getComponent(number) : number;
   crossVectors(THREE.Vector3, THREE.Vector3) : THREE.Vector3;
   length() : number;
   lengthSq() : number;
   set(x: number, y: number, z: number) : THREE.Vector3;
   cross(THREE.Vector3) : THREE.Vector3;
   project(camera: THREE.PerspectiveCamera) : THREE.Vector3;
   applyMatrix3(THREE.Matrix3) : THREE.Vector3;
}

declare class THREE_Vector2 {
   constructor(x?: number, y?: number) : THREE.Vector2;
   x : number;
   width : number;
   y : number;
   height : number;
   applyMatrix3(THREE.Matrix3) : THREE.Vector2;
   set(x: number, y: number) : THREE.Vector2;
}


declare class THREE_Object3D {
   name: string;
   type: 'Line' | 'Mesh';
   userData: any;
   position: THREE.Vector3;
   up: THREE.Vector3;
   scale: THREE.Vector3;
   quaternion: THREE.Quaternion;
   rotateOnAxis(axis: THREE.Vector3, angle: number) : THREE.Object3D;
   matrix: THREE.Matrix4;
   uuid: string;
   id: number;
}

declare class THREE_Scene extends THREE.Group {
   constructor() : void;
   fog: THREE.Fog;
}

declare class THREE_PerspectiveCamera extends THREE.Object3D {
   constructor(fov: number, aspect: number, near: number, far: number) : void;
   lookAt(THREE.Vector3) : void;
   zoom: number;
   aspect: number;
   updateProjectionMatrix() : void;
}

declare class THREE_Color {
   constructor(color: number | string) : THREE.Color;
   equals(color: THREE.Color): boolean;
   getHexString() : string;
   getHex() : number;
};

declare class THREE_WebGLRenderer {
   constructor({preserveDrawingBuffer: boolean, antialias: boolean}) : void;
   getSize() : THREE.Vector2;
   setSize(w: number, h: number) : void;
   setClearColor(color: string | number, alpha: number) : void;
   domElement : HTMLCanvasElement;
   render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) : void;
}

declare class THREE_TrackballControls {
   constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) : void;
   update() : void;
}

declare class THREE_Group extends THREE.Object3D {
   constructor() : void;
   name: string;
   children: Array<THREE.Object3D>;
   add(THREE.Object3D): THREE.Object3D;
   remove(THREE.Object3D): THREE.Object3D;
}

declare class THREE_Fog {
   constructor(color: number | string) : void;
   color: THREE.Color;
   near: number;
   far: number;
}

declare class THREE_DirectionalLight extends THREE.Object3D {
}

declare class THREE_MeshPhongMaterial extends THREE.Material {
   constructor({color: number | string}) : void;
}

declare class THREE_SphereGeometry extends THREE.Geometry {
   constructor(radius: number, widthSegments: number, heightSegments: number) : void;
}

declare class THREE_Mesh extends THREE.Object3D {
   constructor(geometry: THREE.Geometry, material: THREE.Material) : void;
   name: string;
   material: THREE.Material;
   geometry: THREE.Geometry;
}

declare class THREE_Texture {
   constructor(domElement: HTMLCanvasElement) : void;
   needsUpdate: boolean;
}

declare class THREE_SpriteMaterial extends THREE.Material {
   constructor({map: THREE.Texture}) : void;
}

declare class THREE_Sprite extends THREE.Object3D {
   constructor(material: ?THREE.SpriteMaterial) : void;
   center: THREE.Vector2;   
}

declare class THREE_LineBasicMaterial extends THREE.Material {
   constructor({color: number | string}) : void;
}

declare class THREE_Geometry {
   uvsNeedUpdate: boolean;
   parameters: {radius: float};
   vertices: Array<THREE.Vector3>;
}

declare class THREE_Line extends THREE.Object3D {
   constructor(geometry: THREE.Geometry, material: THREE.Material) : void;
}

declare class THREE_Material {
   color: THREE.Color;
   userData: ?any;
}

declare class THREE_QuadraticBezierCurve3 {
   constructor(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3) : void;
   getPoints(divisions: number) : Array<THREE.Vector3>;
   getLength() : number;
   getPointAt(u: number) : THREE.Vector3;
}

declare class THREE_ArrowHelper extends THREE.Object3D {
   constructor(dir: THREE.Vector3, origin: THREE.Vector3, length: number, color: color, headLength: number, headWidth: number) : void;
}

declare class THREE_BoxGeometry extends THREE.Geometry {
   constructor(width: number, height: number, depth: number) : void;
}

declare class THREE_MeshBasicMaterial extends THREE.Material {
   constructor({[key: string] : any}) : void;
}

declare class THREE_Quaternion {
   constructor(x: number, y: number, z: number, w: number) : void;
}

declare class THREE_Raycaster {
   linePrecision : number;
   ray : {origin: THREE.Vector3, direction: THREE.Vector3};
   setFromCamera(coords: THREE.Vector2, camera: THREE.PerspectiveCamera) : void;
   intersectObjects(object: THREE.Object3D, recursive: boolean) : Array<{object: THREE.Object3D}>;
}

declare class THREE_Points extends THREE.Object3D {
   constructor(geometry: THREE.Geometry, material: THREE.Material) : void;
}

declare class THREE_PointsMaterial extends THREE.Material {
   constructor(parameters: {color: number | string, size: number, sizeAttenuation: boolean}) : void;
}

declare class THREE_Plane {
   normal: THREE.Vector3;
   constructor(): void;
   intersectLine(line: THREE.Line3, target: THREE.Vector3): THREE.Vector3;
   setFromCoplanarPoints(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): THREE.Plane;
}

declare class THREE_Line3 {
   constructor(start: THREE.Vector3, end: THREE.Vector3) : void;
   closestPointToPoint(point: THREE.Vector3, clampToLine: boolean, target: THREE.Vector3): THREE.Vector3;
   closestPointToPointParameter(point: THREE.Vector3, clampToLine: boolean): float;
}
