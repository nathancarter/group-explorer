//@flow

import GroupURLs from './GroupURLs.js';
import Log from './js/Log.js';

import * as SM from './js/SheetModel.js';
import * as VC from './visualizerFramework/visualizer.js';

export {load, loadChosen, saveAs, addRectangle, addText, addVisualizer, copySelected, pasteItem, deleteSelected, undo, redo,
        morphismSelected, connectSelected, moveSelectedUp, moveSelectedDown, moveSelectedToTop, moveSelectedToBottom,
        loadSheetFromJSON};

/*::
import type {
   SheetElementJSON,
   MSG_loadFromJSON,
   JSONType,
} from './js/SheetModel.js';
import type {JQueryDnD} from './js/DragResizeExtension.js';
*/

/*::
// from Sheet.html
var filenameInput: HTMLInputElement;
var loadButton: HTMLButtonElement;
var pasteButton: HTMLButtonElement;
var undoButton: HTMLButtonElement;
var redoButton: HTMLButtonElement;
var visualizerList: HTMLSelectElement;
var groupList: HTMLSelectElement;
var savedSheetsList: HTMLSelectElement;
*/

/* Global variables */
const panelNames /*: Array<string> */ = ['#sheet-control'];
const HELP_PAGE /*: string */ = 'help/rf-um-sheetwindow/index.html';

var $sheet /*: JQuery */;
var Model /*: SM.SheetModel */;

/*
 * Register static event managers -- called after document is assembled
 *    (The .off(--).on(--) sequence is used to avoid accumulating event handlers after a reset.)
 */
function registerEventHandlers() {
   $('#sheet-button').on('click', () => show('#sheet-control') );
   $(window).off('resize', resizeBody).on('resize', resizeBody);
}

/* Load the static components of the page */
function load() {
   // Document is assembled, register event handlers
   registerEventHandlers();
   const $container = $( '#graphic' );
   const W = 4096, H = 4096; // down from 10000x7500 to accomodate mobile limitations
   $container[0].style.overflowX = 'scroll';
   $container[0].style.overflowY = 'scroll';
   $container.html( `<div style="min-width: ${W}; min-height: ${H};"></div>` );
   $sheet = $( $container[0].childNodes[0] );
   Model = new SM.SheetModel( ($sheet[0] /*: HTMLElement */) );


   // Create header from group name and queue MathJax to typeset it
   $( '#header' ).html( 'Group Explorer Sheet' );
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'header']);
   // Register the splitter with jquery-resizable, so you can resize the graphic horizontally
   // by grabbing the border between the graphic and the subset control and dragging it
   (($( '#vert-container' ) /*: any */) /*: JQuery & {resizable: Function} */).resizable( {
      handleSelector: '#splitter',
      resizeHeight: false,
      resizeWidthFrom: 'left'
   } );

   $sheet.css( { backgroundColor:'#f8f8f8' } )
      .append( '<canvas id="overlay"></canvas>' );
   $( '#overlay' ).offset( {
      left : $sheet.offset().left,
      top : $sheet.offset().top
   } );

   const canvas /*: HTMLCanvasElement */ = (($( '#overlay' )[0] /*: any */ ) /*: HTMLCanvasElement */);
   canvas.width = $sheet.width();
   canvas.height = $sheet.height();
   show( '#sheet-control' );
   resizeBody();

   if ( !localStorage.getItem( 'sheets' ) ) localStorage.setItem( 'sheets', '{}' );
   updateLoadList();
   var sheets /*: {[key: string]: Array<SheetElementJSON>} */ =
       JSON.parse( ((localStorage.getItem( 'sheets' ) /*: any */) /*: string */) );

   var i = 1;
   while ( sheets.hasOwnProperty( `My Sheet ${i}` ) ) i++;
   $( filenameInput ).val( `My Sheet ${i}` );
   $( pasteButton ).prop( 'disabled', true );

   $sheet[0].addEventListener( 'selected', handleSelectionChanged );
   $sheet[0].addEventListener( 'deselected', handleSelectionChanged );
   handleSelectionChanged();

   function handleMoveAndResize () { Model.sync(); }
   $sheet[0].addEventListener( 'moved', handleMoveAndResize );
   $sheet[0].addEventListener( 'resized', handleMoveAndResize );

   function updateUndoRedoButtons () {
      $( undoButton ).prop( 'disabled', !Model.canUndo() );
      $( redoButton ).prop( 'disabled', !Model.canRedo() );
   }
   $sheet[0].addEventListener( 'synced', updateUndoRedoButtons );
   updateUndoRedoButtons();

   GroupURLs.urls.map( function ( url ) {
      var name = url;
      if ( /\.group$/.test( name ) ) name = name.substring( 0, name.length - 6 );
      var lastSlash = name.lastIndexOf( '/' );
      if ( lastSlash > -1 ) name = name.substring( lastSlash + 1, name.length );
      $( groupList ).append( $(
         `<option value="${url}">${name}</option>`
      ) );
   } );

   $sheet.on( 'click', function ( event /*: JQueryEventObject */ ) {
      if ( event.target != $sheet[0] ) return;
      const selected = Model.selected();
      if ( selected && selected.htmlViewElement() )
         (( $( selected.htmlViewElement().parentElement ) /*: any */) /*: JQueryDnD */).removeDragAndSizeSelection();
   } );

   window.addEventListener( 'message', function ( event /*: MessageEvent */ ) {
      const event_data /*: MSG_loadFromJSON */ = (event.data /*: any */);
      if (typeof event_data == 'undefined' || event_data.type != 'load from json') {
         Log.warn('unknown message received in Sheet.js:');
         Log.warn(event_data);
         return;
      }
      loadSheetFromJSON( event_data.json );
   }, false );

   // Load icon strip in upper right-hand corner
   VC.load(null, HELP_PAGE)
}

function scrollToTopLeft () {
    (($sheet.parent()[0] /*: any */) /*: {scrollTo: (x: number, y: number) => void} */).scrollTo( 0, 0 );
}
function scrollToShow ( sheetElement ) {
    (($sheet.parent()[0] /*: any */) /*: {scrollTo: (x: number, y: number) => void} */).scrollTo(
      Math.max( 0, sheetElement.viewElement.offsetLeft - 50 ),
      Math.max( 0, sheetElement.viewElement.offsetTop - 50 ) );
}

function handleSelectionChanged () {
   const sel = Model.selected();
   // Enable buttons about the selected element iff there is a selected element.
   $( '.for-selected-element' ).prop( 'disabled', !sel );
   // Enable connection button iff there are things to connect it to,
   // and populate that drop-down list in any case.
   var $clist = $( '#connectToList' ),
       $mlist = $( '#morphismToList' );
   $clist.children().remove();
   $mlist.children().remove();
   if ( sel && !( sel instanceof SM.ConnectingElement ) )
      Model.elements.map( function ( element, index ) {
         const item = `<option value="${index}">${element.toString()}</option>`;
         if ( ( element instanceof SM.ConnectingElement ) || ( element == sel ) ) return;
         $clist.append( $( item ) );
         if ( ( sel instanceof SM.VisualizerElement ) && ( element instanceof SM.VisualizerElement )
              && !SM.MorphismElement.existsMorphismBetween( sel, element )
              && !SM.MorphismElement.existsMorphismBetween( element, sel ) )
            $mlist.append( $( item ) );
      } );
   $( '#connectButton,#connectToList' ).prop( 'disabled', !$clist.children().length );
   if ( !$clist.children().length ) $clist.append( $( '<option value="-">--</option>' ) );
   $( '#morphismButton,#morphismToList' ).prop( 'disabled', !$mlist.children().length );
   if ( !$mlist.children().length ) $mlist.append( $( '<option value="-">--</option>' ) );
}

function updateLoadList () {
   const sheets /*: {[key: string]: Array<SheetElementJSON>} */ =
      JSON.parse( ((localStorage.getItem( 'sheets' ) /*: any */) /*: string */) );
   while ( savedSheetsList.childNodes[0] )
      savedSheetsList.removeChild( savedSheetsList.childNodes[0] );
   for ( const key in sheets ) {
      if ( sheets.hasOwnProperty( key ) ) {
         var loadOption = $( `<option>${key}</option>` );
         loadOption[0].setAttribute( 'value', key );
         $( savedSheetsList ).append( loadOption );
      }
   }
   if ( savedSheetsList.childNodes.length == 0 ) {
      $( loadButton ).prop( 'disabled', true );
      $( savedSheetsList ).append( $( '<option>(no saved sheets yet)</option>' ) );
      $( savedSheetsList ).prop( 'disabled', true );
   } else {
      $( loadButton ).prop( 'disabled', false );
      $( savedSheetsList ).prop( 'disabled', false );
   }
}

/*
 * Resize the body, accounting for the body margins
 *    (Note that this routine would have to resize the graphic, too, if needed.)
 */
function resizeBody() {
   $('body').height(window.innerHeight);
   $('body').width(window.innerWidth);
}

/* Show the desired panel, hide the rest */
function show(panel_name) {
   for (const name of panelNames) {
      if (name == panel_name) {
         $(name).show();
      } else {
         $(name).hide();
      }
   }
}

function addRectangle () {
   new SM.RectangleElement( Model );
   scrollToTopLeft();
}
function addText () {
   new SM.TextElement( Model );
   scrollToTopLeft();
}
function connectSelected () {
   new SM.ConnectingElement( Model, ((Model.selected() /*: any */) /*: SM.SheetElement */),
                             Model.elements[parseInt($( '#connectToList' ).val())] );
}
function morphismSelected () {
   new SM.MorphismElement( Model, ((Model.selected() /*: any */) /*: SM.VisualizerElement<any, any> */),
                          ((Model.elements[parseInt($( '#morphismToList' ).val())] /*: any */) /*: SM.VisualizerElement<any, any> */) );
   handleSelectionChanged();
}
function deleteSelected () {
   const selected = Model.selected();
   if ( selected ) selected.remove();
}
function saveAs () {
   const sheets /*: {[key: string]: Array<SheetElementJSON>} */ =
       JSON.parse( ((localStorage.getItem( 'sheets' ) /*: any */) /*: string */) );
   sheets[filenameInput.value] = Model.toJSON();
   localStorage.setItem( 'sheets', JSON.stringify( sheets ) );
   updateLoadList();
   alert( `Saved sheet as "${filenameInput.value}"` );
}
function loadChosen () {
   const sheets /*: {[key: string]: Array<SheetElementJSON>} */ =
      JSON.parse( ((localStorage.getItem( 'sheets' ) /*: any */) /*: string */) );
   Model.fromJSON( sheets[savedSheetsList.value] );
   setTimeout( function () {
      alert( `Loaded sheet named "${savedSheetsList.value}"` );
   }, 10 );
}
var copiedItem = null;
function copySelected () {
   var selected = Model.selected();
   if ( selected ) {
      copiedItem = selected.toJSON();
      $( pasteButton ).prop( 'disabled', false );
   }
}
function pasteItem () {
   if ( copiedItem ) {
      var element = Model.sheetElementFromJSON( copiedItem );
      var wrapper = element.htmlViewElement().parentNode;
      (( $( wrapper ) /*: any */) /*: JQueryDnD */).addDragAndSizeSelection();
      scrollToShow( element );
   }
}
function moveSelectedUp () {
   var selected = Model.selected();
   if ( selected ) {
      Model.adjustZUp( selected );
      scrollToShow( selected );
   }
}
function moveSelectedDown () {
   var selected = Model.selected();
   if ( selected ) {
      Model.adjustZDown( selected );
      scrollToShow( selected );
   }
}
function moveSelectedToTop () {
   var selected = Model.selected();
   if ( selected ) {
      const highestElt = Model.elements
          .reduce( (highest /*: SM.SheetElement */, curr /*: SM.SheetElement */ ) =>
                      (curr.zIndex > highest.zIndex) ? curr : highest,
                   Model.elements[0]
                 )
      // const highestZ = Math.max( ...Model.elements.map( ( e ) => e.zIndex ) );
      // const thatElt = ((Model.elements.find( ( e ) => e.zIndex == highestZ ) /*: any */) /*: SM.SheetElement */);
      Model.adjustZ( selected, highestElt );
      scrollToShow( selected );
   }
}
function moveSelectedToBottom () {
   var selected = Model.selected();
   if ( selected ) {
      const lowestElt = Model.elements
          .reduce( (lowest /*: SM.SheetElement */, curr /*: SM.SheetElement */ ) =>
                      (curr.zIndex < lowest.zIndex) ? curr : lowest,
                   Model.elements[0]
                 )
      // const lowestZ = Math.min( ...Model.elements.map( ( e ) => e.zIndex ) );
      // const thatElt = ((Model.elements.find( ( e ) => e.zIndex == lowestZ ) /*: any */) /*: SM.SheetElement */);
      Model.adjustZ( selected, lowestElt );
      scrollToShow( selected );
   }
}
function undo () { Model.undo(); }
function redo () { Model.redo(); }
function addVisualizer () {
   var vizType = visualizerList.value;
   var groupURL = groupList.value;
   if ( visualizerList.value == 'MT' ) {
      new SM.MTElement( Model, groupURL );
      scrollToTopLeft();
   } else if ( visualizerList.value == 'CD' ) {
      new SM.CDElement( Model, groupURL );
      scrollToTopLeft();
   } else if ( visualizerList.value == 'CG' ) {
      new SM.CGElement( Model, groupURL );
      scrollToTopLeft();
   }
}

// The following functions let a parent page that programmatically opened this page
// construct sheet content programmatically as well.
function loadSheetFromJSON ( json /*: Array<JSONType> */ ) {
   json.map( adjustSheetElementPosition );
   Model.fromJSON( json );
   scrollToTopLeft();
}
function addSheetElementFromJSON( json /*: SheetElementJSON */ ) {
   adjustSheetElementPosition( json );
   var element = Model.sheetElementFromJSON( json );
   scrollToShow( element );
}
// Adjusts y coordinate to take header into account.
function adjustSheetElementPosition ( elementJSON /*: JSONType */ ) {
   if ( elementJSON.hasOwnProperty( 'y' ) )
      elementJSON.y += $('#graphic').offset().top;
}
