// @flow
/*::
import CayleyDiagram from './js/CayleyDiagram.js';
import CycleGraph from './js/CycleGraph.js';
import DisplayCycleGraph from './js/DisplayCycleGraph.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import DisplayMulttable from './js/DisplayMulttable.js';
import GroupURLs from './GroupURLs.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import Menu from './js/Menu.js';
import Multtable from './js/Multtable.js';
import SymmetryObject from './js/SymmetryObject.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';
 */

// Global variables
var graphicContext /*: DisplayDiagram */;	// hidden scratchpad, re-used to reduce WebGL contexts
var multtableContext /*: DisplayMulttable */;
var cycleGraphContext /*: DisplayCycleGraph */;

$(window).on('load', readLibrary);

// Static event managers (setup after document is available)
function registerEventHandlers() {
   $('#GroupTableHeaders th:nth-child(1)').on('click', columnSort);
   $('#GroupTableHeaders th:nth-child(2)').on('click', columnSort);
   HoverHelp.init();
};

// Load group library from urls
function readLibrary() {
   graphicContext = new DisplayDiagram({width: 50, height: 50, fog: false});
   multtableContext = new DisplayMulttable({height: 32, width: 32});
   cycleGraphContext = new DisplayCycleGraph({height: 32, width: 32});

   // create mathjax style element from localStorage (needed to display locally stored definitions)
   const styleHTML = localStorage.getItem('mathjax_stylesheet');
   if (styleHTML != undefined) {
      $('head').append(styleHTML);
   }

   // only read in a few groups if URL specifies 'debug' (for impatient programmers)
   const urlDebug = new URL(window.location.href).searchParams.get('debug');
   const resolvedURLs = GroupURLs.urls.map( (url) => Library.resolveURL(url) );
   const urlsToDisplay /*: Array<string> */ =
         (urlDebug == undefined) ? Array.from(new Set(resolvedURLs.concat(Library.getAllLocalURLs())))
                                 : resolvedURLs.slice(0, (parseInt(urlDebug) || 10));

   // display locally stored group defintions
   for (const url of urlsToDisplay) {
      const g = Library.getLocalGroup(url);
      if (g != undefined && g.CayleyThumbnail != undefined && g.rowHTML != undefined) {
         const $img = $('<img>').attr('src', g.CayleyThumbnail).attr('height', 32).attr('width', 32);
         const $row = $(g.rowHTML);
         $row.find('td.cayleyDiagram a').empty().append($img);
         $('#GroupTable tbody').append($row);
      }
   }

   finish(urlsToDisplay);
}

function finish(urlsToDisplay) {
   const exit = () => {
      registerEventHandlers();   
      $( '#loadingMessage' ).hide();
      $('#GroupTableHeaders th:nth-child(2)').triggerHandler('click');

      // store stylesheet in localStorage
      const mathjaxStylesheet = ($('style').toArray() /*: Array<HTMLStyleElement> */).filter( (s) => s.textContent.trim().startsWith('.mjx-chtml') )[0];
      if (mathjaxStylesheet != undefined) {
         localStorage.setItem('mathjax_stylesheet', mathjaxStylesheet.outerHTML);
      }
   };

   $( '#loadingMessage' ).show();

   // check that the locally stored definitions currently displayed are the latest; refresh if not
   const loadNextURL = (urlIndex) => {
      const url = urlsToDisplay[urlIndex++];
      const localGroup = Library.getLocalGroup(url);
      Library.getLatestGroup(url)
             .then( (group) => {
                // if we already have the latest group in the Library, just check to see if we're done
                if (localGroup && localGroup == group && localGroup.CayleyThumbnail != undefined && localGroup.rowHTML != undefined) {
                   if ( urlIndex == urlsToDisplay.length ) {
                      exit();
                   } else {
                      loadNextURL(urlIndex);
                   }
                } else {
                   // format new group
                   const row = displayGroup(group)[0];
                   $('#ScratchTable').append(row);

                   const afterTypesetting = () => {
                      // remove un-needed spans from mathjax output
                      $(row).find('span.MathJax_Preview, span.MJX_Assistive_MathML, script[type="math/mml"]').remove();
                      const $cayleyDiagram = $(row).find('td.cayleyDiagram img').detach();
                      group.rowHTML = row.outerHTML;
                      $(row).find('td.cayleyDiagram a div').empty().append($cayleyDiagram);
                      $(row).detach().appendTo('#GroupTable tbody');
                      Library.saveGroup(group);
                      if ( urlIndex == urlsToDisplay.length ) {
                         exit();
                      } else {
                         const pct = ( urlIndex * 100 / urlsToDisplay.length ) | 0;
                         $( '#loadingMessage i' ).html( `Loading groups (${pct}%)...` );
                         loadNextURL(urlIndex);
                      }
                   };
                   // typeset this row
                   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'ScratchTable'],
                                     afterTypesetting);
                } } )
             .catch( console.error );
   }
   loadNextURL(0);
}

// add row to table that displays this name, order, etc. of group
function displayGroup(group) {
   const cayleyTitle = (group.cayleyDiagrams.length == 0) ?
                       undefined :
                       group.cayleyDiagrams[0].name;
   const symmetryTitle = (group.symmetryObjects.length == 0) ?
                         undefined :
                         group.symmetryObjects[0].name;

   $(`tr[group="${group.URL}"]`).remove();
   let $row = $(eval(Template.HTML('row_template')));

   // draw Cayley diagram
   {
      const graphicData = new CayleyDiagram(group, cayleyTitle);
      const img = graphicContext.getImage(graphicData);
      group.CayleyThumbnail = img.src;
      img.height = img.width = 32;
      $row.find("td.cayleyDiagram a div").html(img.outerHTML);
   }

   // draw Multtable
   {
      const graphicData = new Multtable(group);
      const img = multtableContext.getImage(graphicData);
      $row.find("td.multiplicationTable a div").html(img.outerHTML);
   }

   // draw Symmetry Object
   if (symmetryTitle == undefined) {
      $row.find("td.symmetryObject").html('none').removeClass('symmetryObject').addClass('noDiagram').removeAttr('title');
   } else {
      const graphicData = SymmetryObject.generate(group, symmetryTitle);
      const img = graphicContext.getImage(graphicData);
      img.height = img.width = 32;
      $row.find("td.symmetryObject a div").html(img.outerHTML);
   }

   // draw Cycle Graph
   {
      const graphicData = new CycleGraph( group );
      const img = cycleGraphContext.getImage( graphicData );
      $row.find("td.cycleGraph a div").html(img.outerHTML);
   }

   return $row;
}

// callback to sort table on column value, invoked by clicking on column head
function columnSort(click /*: JQueryEventObject */) {
   const SORTABLE_COLUMNS = [0, 1];
   const columnIndex = 
         $(click.currentTarget).parent().children().toArray().findIndex( (child) => child == click.currentTarget );
   if (SORTABLE_COLUMNS.findIndex( (sortable) => sortable == columnIndex ) == -1) return;
   const makeSortUp = !$($('th')[columnIndex]).hasClass('sort-up');

   for (let i of SORTABLE_COLUMNS) {
      $($('th')[i]).removeClass('sort-down')
                   .removeClass('sort-up')
                   .addClass('sort-none');
   }
   $($('th')[columnIndex]).removeClass('sort-none')
                          .addClass(makeSortUp ? 'sort-up' : 'sort-down');

   const getCellValue = (tr, idx) /*: string */ => tr.children[idx].textContent;

   const compareFunction =
      (idx, asc) =>
         (a /*: HTMLTableCellElement */, b /*: HTMLTableCellElement */) =>
         ((v1, v2) => (!isNaN(v1) && !isNaN(v2)) ? Number(v1) - Number(v2) : v1.toString().localeCompare(v2))(
            getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx)
         );

   $('#GroupTable tbody').find('tr:nth-child(n+1)')
                         .sort(compareFunction(columnIndex, makeSortUp))
                         .each((_,tr) => $('#GroupTable tbody').append(tr))
}



class HoverHelp {
   static init() {
      if (window.hasOwnProperty('ontouchstart')) {
         $('#GroupTable tbody').on('touchstart touchmove touchend', HoverHelp.tapHandler);
      } else {
         $('#GroupTable tbody').on('mousemove mouseleave', HoverHelp.mouseHandler);
      }
   }

   static mouseHandler(event /*: JQueryEventObject */) {
      const mouseEvent /*: MouseEvent */ = (event /*: any */);

      if (mouseEvent.ctrlKey || mouseEvent.shiftKey || mouseEvent.altKey) {
         return;
      }

      const cell /*: HTMLElement */ = ($(document.elementFromPoint(mouseEvent.pageX, mouseEvent.pageY)).closest('td')[0] /*: any */);
      const highlighted /*: ?HTMLElement */ = ($('.highlighted')[0] /*: any */);

      switch (mouseEvent.type) {
      case 'mousemove':
         if (highlighted != cell) {
            $('.highlighted').removeClass('highlighted');
            if ($(cell).find('a[title]').length == 1) {
               $(cell).addClass('highlighted');
            }
         }
         break;

      case 'mouseleave':
         $('.highlighted').removeClass('highlighted');
         break;
      }
   }

   static tapHandler(event /*: JQueryEventObject */) {
      const touchEvent /*: TouchEvent */ = (event.originalEvent /*: any */);

      // skip keyed events
      if (touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey) {
         return;
      }

      // skip multi-touches
      if (touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
         return;
      }

      const touch /*: Touch */ = (touchEvent.changedTouches.item(0) /*: any */);
      const cell /*: HTMLElement */ = ($(document.elementFromPoint(touch.pageX, touch.pageY)).closest('td')[0] /*: any */);
      const highlighted /*: ?HTMLElement */ = ($('.highlighted')[0] /*: any */);
      
      switch (event.type) {
      case 'touchstart':
      case 'touchmove':
         if (highlighted != cell) {
            $('.highlighted').removeClass('highlighted');
            if ($(cell).find('a[title]').length == 1) {
               $(cell).addClass('highlighted');
            }
         }
         break;

      case 'touchend':
         $('.highlighted').removeClass('highlighted');
         break;
      }
   }
}
