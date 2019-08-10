
// un-analyzed 3rd party library
declare var MathJax : any;

// Generic object
type Obj = {[key: string]: any};

// types that indicate the use of the string/number
declare type float = number;
declare type html = string;
declare type mathml = string;
declare type groupElement = number;
declare type color = string;
declare type eventLocation = {clientX: number, clientY: number};

// Window, as used in GE3
declare class Window {
    parent: Window;
    location: Location;
    innerHeight: number;
    innerWidth: number;
    document: Document;
    navigator: {userAgent: string};
    open(url: string): Window;
    addEventListener(type: MouseEventTypes, listener: MouseEventHandler, useCapture: ?boolean): void;
    addEventListener(type: WheelEventTypes, listener: WheelEventHandler, useCapture: ?boolean): void;
    addEventListener(type: MessageEventTypes, listener: MessageEventHandler, useCapture: ?boolean): void;
    addEventListener(type: ProgressEventTypes, listener: ProgressEventHandler, useCapture: ?boolean): void;
    requestAnimationFrame(callback: (timestamp: number) => void): void;
    postMessage(message: any, targetOrigin: string): void;
    setInterval(fn: () => void, interval: number): number;
    clearInterval(number): void;
    setTimeout(fn: () => void, delay: number): number;
    clearInterval(number): void;
    getSelection(): Selection;
    ontouchstart?: Function;
}
declare var window: Window;
