declare module "https://cdn.jsdelivr.net/npm/three@0.113.0/build/three.module.js" {
    declare var DoubleSide: number;
    declare var FrontSide: number;

    declare class ArrowHelper extends Object3D {
        constructor(dir: Vector3,
                    origin?: Vector3,
                    length?: number,
                    color?: Color | string | number,
                    headLength?: number,
                    headWidth?: number): void;
        line: Line;
        cone: Mesh;
    }

    declare class BoxGeometry extends Geometry {
        constructor(width: number, height: number, depth: number): void;
    }

    declare class BufferGeometry {
        isBufferGeometry: boolean;
        userData: {[key: string]: any};
        dispose(): void;
    }

    declare class Camera extends Object3D {
    }

    declare class CanvasTexture extends Texture {
    }

    declare class Color {
        constructor(color: Color | string | number): void;
        equals(color: Color): boolean;
        getHex(): number;
        getHexString(): string;
        getHSL(Obj): {h: number, s: number, l: number};
        set(value: Color | string | number): Color;
    }

    declare class Curve {
        getLength(): number;
        getPointAt(u: number): Vector3;
        getPoints(divisions: number): Array<Vector3>;
    }

    declare class DirectionalLight extends Object3D {
    }

    declare class Fog {
        constructor(color?: Color | string | number): void;
        color: Color;
        far: number;
        near: number;
    }

    declare class Geometry {
        isGeometry: boolean;
        parameters: {radius: float} & any;  /* is really subclass property -- SphereGeometry */
        uvsNeedUpdate: boolean;
        vertices: Array<Vector3>;
        verticesNeedUpdate: boolean;
        dispose(): void;
    }

    declare class Group extends Object3D {
        constructor(): void;
        isGroup: boolean;
    }

    declare class Line extends Object3D {
        constructor(geometry: Geometry, material: LineBasicMaterial): void;
        geometry: Geometry;
        isLine: boolean;
        material: LineBasicMaterial;
    }

    declare class Line3 {
        constructor(start: Vector3, end: Vector3): void;
        closestPointToPoint(point: Vector3, clampToLine: boolean, target: Vector3): Vector3;
        closestPointToPointParameter(point: Vector3, clampToLine: boolean): float;
        distance(): float;
        distanceSq(): float;
    }

    declare class LineBasicMaterial extends Material {
        constructor({color?: Color | string | number, linewidth?: number}): void;
        color: Color;
        linewidth: number;
    }

    declare class LineCurve3 extends Curve {
        constructor(v1: Vector3, v2: Vector3): void;
    }

    declare type MaterialParameters = {
        depthTest?: boolean;
        depthWrite?: boolean;
        opacity?: number;
        side?: typeof FrontSide;
        transparent?: boolean;
    }

    declare class Material {
        depthTest: boolean;
        depthWrite: boolean;
        isLineBasicMaterial: boolean | void;
        opacity: number;
        side: typeof FrontSide;
        transparent: boolean;
        userData: any;
        visible: boolean;
        color: Color;  /* really only subclass property -- LineBasicMaterial */
        dispose(): void;
    }

    declare class Matrix3 {
        elements: Array<number>;
        getInverse(m: Matrix3): Matrix3;
        set(n11: number, n12: number, n13: number,
            n21: number, n22: number, n23: number,
            n31: number, n32: number, n33: number): Matrix3;
        transpose(): Matrix3;
    }

    declare class Matrix4 {
        clone(): Matrix4;
        decompose(position: Vector3, quaternion: Quaternion, scale: Vector3): void;  /* ?? */
        fromArray(array: Array<number>): Matrix4;
        getInverse(m: Matrix4): Matrix4;
        makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): Matrix4;
        makeRotationX(theta: number): Matrix4;
        makeRotationY(theta: number): Matrix4;
        makeRotationZ(theta: number): Matrix4;
        makeScale(x: number, y: number, z: number): Matrix4;
        makeTranslation(x: number, y: number, z: number): Matrix4;
        multiply(m: Matrix4): Matrix4;
        set(n11: number, n12: number, n13: number, n14: number,
            n21: number, n22: number, n23: number, n24: number,
            n31: number, n32: number, n33: number, n34: number,
            n41: number, n42: number, n43: number, n44: number): Matrix4;
        setPosition(v: Vector3): Matrix4;
        toArray(): Array<number>;
    }

    declare class Mesh extends Object3D {
        constructor(geometry: Geometry | BufferGeometry, material: Material): void;
        geometry: Geometry | BufferGeometry;
        isMesh: boolean;
        material: Material;
    }

    declare type MeshBasicMaterialParameters = MaterialParameters & { color?: Color | string | number; }

    declare class MeshBasicMaterial extends Material {
        constructor(parameters?: MeshBasicMaterialParameters): void;
        color: Color;
    }

    declare type MeshPhongMaterialParameters = MaterialParameters & { color?: Color | string | number; }

    declare class MeshPhongMaterial extends Material {
        constructor(parameters?: MeshPhongMaterialParameters): void;
    }

    declare class Object3D {
        static DefaultUp: Vector3;
        id: number;
        children: Array<Object3D>;
        matrix: Matrix4;
        name: string;
        parent: Object3D;
        position: Vector3;
        quaternion: Quaternion;
        scale: Vector3;
        type: string;
        up: Vector3;
        userData: { [key: string]: any };
        uuid: string;
        add(...Array<Object3D>): Object3D;
        applyMatrix4(matrix: Matrix4): void;
        lookAt(vector: Vector3): void;
        remove(...Array<Object3D>): Object3D;
        rotateOnAxis(axis: Vector3, angle: number): Object3D;
    }

    declare class PerspectiveCamera extends Camera {
        constructor(fov?: number, aspect?: number, near?: number, far?: number): void;
        aspect: number;
        zoom: number;
        updateProjectionMatrix(): void;
    }

    declare class Plane {
        constructor(): void;
        normal: Vector3;
        intersectLine(line: Line3, target: Vector3): Vector3;
        setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): Plane;
        setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): Plane;
    }

    declare class QuadraticBezierCurve3 extends Curve {
        constructor(v0: Vector3, v1: Vector3, v2: Vector3): void;
    }

    declare class Quaternion {
        constructor(x: number, y: number, z: number, w: number): void;
    }

    declare class Ray {
        origin: Vector3;
        direction: Vector3;
    }

    declare class Raycaster {
        linePrecision: number;
        ray: Ray;
        intersectObjects(objects: Array<Object3D>, recursive: boolean): Array<Intersection>;
        setFromCamera(coords: Vector2, camera: Camera): void;
    }

    declare type Intersection = {distance: float, object: Object3D};

    declare class Scene extends Object3D {
        constructor(): void;
        background: Color;
        fog: Fog;
    }

    declare class SphereGeometry extends Geometry {
        constructor(radius: number, widthSegments: number, heightSegments: number): void;
        parameters: {
            radius: float;
            widthSegments: number;
            heightSegments: number;
        };
    }

    declare class Sprite extends Object3D {
        constructor(material?: SpriteMaterial): void;
        center: Vector2;
        geometry: Geometry | BufferGeometry;
        material: SpriteMaterial;
    }

    declare class SpriteMaterial extends Material {
        constructor({map: Texture}): void;
        map: Texture;
    }

    declare class Texture {
        constructor(image: HTMLCanvasElement): void;
        needsUpdate: boolean;
        dispose(): void;
    }

    declare class TrackballControls {
        constructor(camera: Camera, domElement: HTMLElement): void;
        dynamicDampingFactor: float;    
        update(): void;
    }

    declare class Vector2 {
        constructor(x?: number, y?: number): void;
        height: number;
        width: number;
        x: number;
        y: number;
        applyMatrix3(m: Matrix3): Vector2;
        set(x: number, y: number): Vector2;
    }

    declare class Vector3 {
        constructor(x?: float, y?: float, z?: float): void;
        x: float;
        y: float;
        z: float;
        add(v: Vector3): Vector3;
        addScaledVector(v: Vector3, s: float): Vector3;
        addVectors(a: Vector3, b: Vector3): Vector3;
        applyMatrix3(m: Matrix3): Vector3;
        applyMatrix4(m: Matrix4): Vector3;
        clone(): Vector3;
        copy(v: Vector3): Vector3;
        cross(v: Vector3): Vector3;
        crossVectors(a: Vector3, b: Vector3): Vector3;
        distanceTo(v: Vector3): float;
        distanceToSquared(v: Vector3): float;
        dot(v: Vector3): float;
        getComponent(index: number): float;
        length(): float;
        lengthSq(): float;
        multiplyScalar(s: float): Vector3;
        normalize(): Vector3;
        project(camera: Camera): Vector3;
        projectOnVector(v: Vector3): Vector3;
        set(x: float, y: float, z: float): Vector3;
        sub(v: Vector3): Vector3;
        toArray(): Array<float>;
    }

    declare class WebGLRenderer {
        constructor({
            preserveDrawingBuffer?: boolean,
            antialias?: boolean,
            canvas?: HTMLCanvasElement,
        }): void;
        domElement: HTMLCanvasElement;
        getClearColor(): Color;
        getContext(): WebGLRenderingContext;
        getSize(target: Vector2): Vector2;
        render(scene: Scene, camera: Camera): void;
        setClearColor(color: Color | string | number, alpha: float): void;
        setSize(width: float, height: float): void;
    }
}


declare module "https://cdn.jsdelivr.net/npm/three@0.113.0/examples/jsm/controls/TrackballControls.js" {
    declare class TrackballControls {
        constructor(Camera, HTMLElement): void;
        dynamicDampingFactor: float;
        update() : void;
    }
}

declare module 'https://cdn.jsdelivr.net/npm/three@0.113.0/examples/jsm/lines/Line2.js' {
    declare class Line2 extends Mesh {
        constructor(geometry: LineGeometry, material: LineMaterial): void;
        material: LineMaterial;
    }
}

declare module 'https://cdn.jsdelivr.net/npm/three@0.113.0/examples/jsm/lines/LineMaterial.js' {
    declare class LineMaterial extends Material {
        constructor(parameters: ?LineMaterialParameters): void;
        color: Color | string | number;
        linewidth: float;
    }

    declare type LineMaterialParameters = {
        color?: Color | string | number;
        linewidth?: float;
        resolution?: Vector2;
    }
}

declare module 'https://cdn.jsdelivr.net/npm/three@0.113.0/examples/jsm/lines/LineGeometry.js' {
    declare class LineGeometry extends InstancedBufferGeometry {
        setPositions(Array<float>): this;
    }
}

