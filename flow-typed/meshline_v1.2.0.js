
declare class MeshLine {
  +geometry: THREE.Geometry;
   setGeometry(geometry: THREE.Geometry) : void;
}

declare class MeshLineMaterial extends THREE.Material {
   constructor(parameters: {color?: THREE.Color, lineWidth?: number, sizeAttenuation?: boolean, side?: number, resolution?: THREE.Vector2, fog?: boolean}) : void;
}
