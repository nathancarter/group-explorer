
declare class MeshLine implements THREE_Raycastable {
  +geometry: THREE.BufferGeometry;
   setGeometry(geometry: THREE.Geometry) : void;
   raycast(raycaster: THREE.Raycaster, intersects: Array<THREE_Intersection>) : void;
}

declare class MeshLineMaterial extends THREE.Material {
   constructor(parameters: {color?: THREE.Color, lineWidth?: number, sizeAttenuation?: boolean, side?: number, resolution?: THREE.Vector2, fog?: boolean}) : void;
}
