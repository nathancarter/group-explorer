
// un-analyzed 3rd party library
declare var MathJax : any

// Generic object
type Obj = {[key: string]: any}

// types that indicate the use of the string/number
declare type integer = number
declare type float = number
declare type html = string
declare type mathml = string
declare type groupElement = number
declare type color = string
declare type css_color = string
declare type eventLocation = {clientX: number, clientY: number}

// Window, as used in GE3
declare class Window extends EventTarget {
  parent: Window;
  location: Location;
  innerHeight: number;
  innerWidth: number;
  document: Document;
  navigator: {userAgent: string};
  open(url: string): Window;
  requestAnimationFrame(callback: (timestamp: number) => void): void;
  postMessage(message: any, targetOrigin: string): void;
  setInterval(fn: () => void, interval: number): number;
  clearInterval(number): void;
  setTimeout(fn: (arg: ?any) => void, delay: number, arg: ?any): number;
  clearTimeout(number): void;
  getSelection(): Selection;
  ontouchstart?: Function;
  onresize?: Function;
  VC?: Module;
  sagecell: any;
  $: jQuery;
  isEditor: boolean;
  performance: { now: () => number };
  indexedDB: IDBFactory;
  alert(string): void;
  confirm(string): boolean;
}
declare var window: Window
