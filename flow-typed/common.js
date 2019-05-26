
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

declare type Tree<T> = Array<any>;  // punting -- should be something like Array<T> | Array<Tree<T>>;

