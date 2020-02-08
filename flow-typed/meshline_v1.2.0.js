
declare class MeshLine {
  +geometry: THREE.BufferGeometry;
   setGeometry(geometry: THREE.Geometry) : void;
}

declare class MeshLineMaterial extends THREE.Material {
   constructor(parameters: {color?: THREE.Color, lineWidth?: number, sizeAttenuation?: boolean, side?: number, resolution?: THREE.Vector2, fog?: boolean}) : void;
   color: THREE.Color;
   lineWidth: number;
}
