
import Diagram3D from '../js/Diagram3D.js';

// un-analyed global functions
declare var CreateNewSheet : Function;
declare var setUpGAPCells : Function;
declare var emitStateChange : Function;

declare var MathJax : any;

// types that indicate the use of the string/number
declare type float = number;
declare type html = string;
declare type mathml = string;
declare type groupElement = number;
declare type color = string;

// Tree structures (should be generic)
declare type Elem = groupElement | Array<Elem>;
declare type ElementTree = Array<Elem>;
declare type Nd = Diagram3D.Node | Array<Nd>;
declare type NodeTree = Array<Nd>;
declare type Msh = THREE.Mesh | Array<Msh>;
declare type MeshTree = Array<Msh>;
