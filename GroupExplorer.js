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
   $('#GroupTableHeaders th.sortable').on('click', columnSort);
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
         $row.find('td.cayleyDiagram a div').empty().append($img);
         $('#GroupTable tbody').append($row);
      }
   }

   finish(urlsToDisplay);
}

function finish(urlsToDisplay) {
   const exit = () => {
      registerEventHandlers();   
      $( '#loadingMessage' ).hide();
      $('#GroupTableHeaders th.sort-down').triggerHandler('click');

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
             .catch( Log.err );
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
      $row.find("td.symmetryObject").html('none').addClass('noDiagram').removeAttr('title');
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
function columnSort(event /*: JQueryEventObject */) {
   const column = event.currentTarget;
   const columnIndex = $('#GroupTableHeaders th.sortable').toArray().findIndex( (th) => th == column );
   if (columnIndex == -1) {
      Log.err(`unknown event in columnSort`);
      return;
   }
   const makeSortUp = !$(column).hasClass('sort-up');
   $('th.sortable').removeClass('sort-down')
                   .removeClass('sort-up')
                   .addClass('sort-none');
   $(column).removeClass('sort-none')
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
/*::
   static lastEntry: ?{cell: HTMLElement, timeStamp: number}
 */
   static init() {
      const tbody = $('#GroupTable tbody')[0];
      if (window.hasOwnProperty('ontouchstart')) {
         $('#GroupTable')[0].addEventListener('click', HoverHelp.clickHandler);  // tap anywhere in table to clear tooltip

         // set up touch event listeners
         ['touchstart', 'touchmove', 'touchend'].forEach( (event) => tbody.addEventListener(event, HoverHelp.highlightHandler) );
         ['touchstart', 'touchmove', 'touchend'].forEach( (event) => tbody.addEventListener(event, HoverHelp.tipHandler) );
      } else {
         tbody.addEventListener('mousemove', HoverHelp.highlightHandler);
         tbody.addEventListener('mouseleave', HoverHelp.clearHighlighting);
      }         
   }

   static clickHandler(clickEvent /*: MouseEvent */) {
      // skip modified events
      if (clickEvent.altKey || clickEvent.ctrlKey || clickEvent.metaKey || clickEvent.shiftKey) {
         return;
      }

      const $tooltip = $('#tooltip');
      const $clickedElement = $(document.elementFromPoint(clickEvent.clientX, clickEvent.clientY));
      if ($tooltip.length > 0) {
         $tooltip.remove();
      } else {
         const $link = $clickedElement.closest('td').find('a[title]');
         if ($link.length != 0) {
            window.open($link.attr('href'));
         }
      }

      if ($clickedElement.closest('div.top-right-menu').length == 0) {
         clickEvent.preventDefault();      // let click event propagate to the top-right-menu
      }
      HoverHelp.lastEntry = null;
   }

   static tipHandler(touchEvent /*: TouchEvent */) {
      // skip modified events, multi-touches
      if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
          || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
         return;
      }

      const lastEntry = HoverHelp.lastEntry;
      const touch /*: Touch */ = (touchEvent.changedTouches[0] /*: any */);
      const $cell /*: JQuery */ = $(document.elementFromPoint(touch.clientX, touch.clientY)).closest('td');
      const $tooltip = $('#tooltip');
      
      switch (touchEvent.type) {
      case 'touchstart':
         if ($tooltip.length != 0) {
            $tooltip.remove();
            HoverHelp.clearHighlighting();
            touchEvent.preventDefault();
         }
         HoverHelp.lastEntry = {cell: $cell[0], timeStamp: touchEvent.timeStamp};
         break;

      case 'touchmove':
         if (lastEntry == undefined) {
            HoverHelp.lastEntry = {cell: $cell[0], timeStamp: touchEvent.timeStamp};            
         } else if (lastEntry.cell != $cell[0]) {
            $tooltip.remove();
            HoverHelp.lastEntry = {cell: $cell[0], timeStamp: touchEvent.timeStamp};
         } else if (   $cell.find('#tooltip').length == 0
                    && !$cell.hasClass('noDiagram')
                    && touchEvent.timeStamp - lastEntry.timeStamp > 350) {
            $tooltip.remove();
            const $newTip = HoverHelp.getTooltip($cell);
            if ($newTip) {
               Menu.setMenuLocations(touch, $newTip);
            }
         }
         touchEvent.preventDefault();  // prevents scrolling while user moves around display showing highlighting, tooltips
         break;

         case 'touchend':
         if (lastEntry != undefined) {
            if (lastEntry.cell != $cell[0]) {
               $tooltip.remove();
            } else if (   $cell.find('#tooltip').length == 0
                       && !$cell.hasClass('noDiagram')
                       && touchEvent.timeStamp - lastEntry.timeStamp > 350) {
               $tooltip.remove();
               const $newTip = HoverHelp.getTooltip($cell);
               if ($newTip) {
                  Menu.setMenuLocations(touch, $newTip);
               }
            }
         }
         HoverHelp.lastEntry = null;
         break;
      }
   }

   static getTooltip($cell /*: JQuery */) /*: ?JQuery */ {
      const $anchor = $cell.find('a[title]');
      if ($anchor.length == 0) {
         Log.err("tooltip can't find anchor in td");
         return null;
      }
      const tooltipText = $anchor.attr('title');
      const $newTip = $('<div id="tooltip" class="menu">')
            .text(tooltipText)
            .appendTo($cell);
      return $newTip;
   }

   static highlightHandler(event /*: MouseEvent | TouchEvent */) {
      // skip modified events, multi-touches
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
         return;
      }
      if (event.type.startsWith('touch')) {
         const touchEvent /*: TouchEvent */ = (event /*: any */);
         if (touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
            return;
         }
      }

      switch (event.type) {
      case 'touchstart':
      case 'touchmove':
      case 'mousemove': {
         const xy /*: {clientX: number, clientY: number} */ =
               event.type.startsWith('touch')
               ? ((event /*: any */) /*: TouchEvent */).touches[0]
               : ((event /*: any */) /*: MouseEvent */);
         const $cell = $(document.elementFromPoint(xy.clientX, xy.clientY)).closest('td');
         if (!$cell.hasClass('emphasized')) {
            HoverHelp.clearHighlighting();
            $cell.closest('tr').addClass('highlighted');  // set this element's row's class to 'highlighted'
            $cell.addClass('emphasized');  // set this element's class to 'emphasized'
         } }
         break;

      case 'touchend':
         HoverHelp.clearHighlighting();
         break;
      }
   }

   static clearHighlighting() {
      $('#GroupTable > tbody > tr.highlighted').removeClass('highlighted');
      $('#GroupTable > tbody td.emphasized').removeClass('emphasized');
   }
}
