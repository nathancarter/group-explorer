// @flow
/*::
import CayleyDiagram from './js/CayleyDiagram.js';
import CycleGraph from './js/CycleGraph.js';
import DisplayCycleGraph from './js/DisplayCycleGraph.js';
import DisplayDiagram from './js/DisplayDiagram.js';
import DisplayMulttable from './js/DisplayMulttable.js';
import GroupURLs from './GroupURLs.js';
import Library from './js/Library.js';
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

// Static event managers (setup after document is available)
$(function() {
   $('#GroupTableHeaders th:nth-child(1)').on('click', () => columnSort(0));
   $('#GroupTableHeaders th:nth-child(2)').on('click', () => columnSort(1));
   $('#GroupTable tbody').on('click', HoverHelp.eventHandler)
                         .on('mousemove', HoverHelp.eventHandler)
                         .on('mouseleave', HoverHelp.eventHandler);
});
$(window).on('load', readLibrary);	// like onload handler in body


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
   const urlsToDisplay = (urlDebug == undefined) ?
                         Array.from(new Set(resolvedURLs.concat(Library.getAllLocalURLs()))) :
                         resolvedURLs.slice(0, (parseInt(urlDebug) || 10));

   // display locally stored group defintions
   for (const url of urlsToDisplay) {
      const g = Library.getLocalGroup(url);
      if (g != undefined && g.CayleyThumbnail != undefined && g.rowHTML != undefined) {
         const $img = $('<img>').attr('src', g.CayleyThumbnail).attr('height', 32).attr('width', 32);
         const $row = $(g.rowHTML);
         $row.find('td.cayleyDiagram').append($img);
         $('#GroupTable tbody').append($row);
      }
   }

   finish(urlsToDisplay);
}

function finish(urlsToDisplay) {
   const exit = () => {
      $( '#loadingMessage' ).hide();
      columnSort( 1, true );

      // store stylesheet in localStorage
      const mathjaxStylesheet = $('style').toArray().filter( (s) => s.textContent.trim().startsWith('.mjx-chtml') )[0];
      if (mathjaxStylesheet != undefined) {
         localStorage.setItem('mathjax_stylesheet',mathjaxStylesheet.outerHTML);
      }
   };

   columnSort(1, true);
   $( '#loadingMessage' ).show();

   // check that the locally stored definitions currently displayed are the latest; refresh if not
   const loadNextURL = (urlIndex) => {
      const url = urlsToDisplay[urlIndex++];
      const localGroup = ((Library.getLocalGroup(url) /*: any */) /*: XMLGroup */);
      Library.getLatestGroup(url)
             .then( (group) => {
                // if we already have the latest group in the Library, just check to see if we're done
                if (localGroup == group && localGroup.CayleyThumbnail != undefined && localGroup.rowHTML != undefined) {
                   if ( urlIndex == urlsToDisplay.length ) {
                      exit();
                   } else {
                      loadNextURL(urlIndex);
                   }
                } else {
                   // format new group
                   const row = displayGroup(group)[0];
                   $('#ScratchTable').append(row);

                   // typeset this row
                   MathJax.Hub.Queue(
                      ['Typeset', MathJax.Hub, 'ScratchTable', () => {
                         // remove un-needed spans from mathjax output
                         $(row).find('span.MathJax_Preview, span.MJX_Assistive_MathML, script[type="math/mml"]').remove();
                         const $cayleyDiagram = $(row).find('td.cayleyDiagram img').detach();
                         group.rowHTML = row.outerHTML;
                         $(row).find('td.cayleyDiagram').append($cayleyDiagram);
                         $(row).detach().appendTo('#GroupTable tbody');
                         Library.saveGroup(group);
                         if ( urlIndex == urlsToDisplay.length ) {
                            exit();
                         } else {
                            const pct = ( urlIndex * 100 / urlsToDisplay.length ) | 0;
                            $( '#loadingMessage i' ).html( `Loading groups (${pct}%)...` );
                            loadNextURL(urlIndex);
                         }
                      }] );
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
      $row.find("td.cayleyDiagram").empty().append(img);
   }

   // draw Multtable
   {
      const graphicData = new Multtable(group);
      const img = multtableContext.getImage(graphicData);
      $row.find("td.multiplicationTable").empty().append(img);
   }

   // draw Symmetry Object
   if (symmetryTitle != undefined) {
      const graphicData = SymmetryObject.generate(group, symmetryTitle);
      const img = graphicContext.getImage(graphicData);
      img.height = img.width = 32;
      $row.find("td.symmetryObject").empty().append(img);
   }

   // draw Cycle Graph
   {
      const graphicData = new CycleGraph( group );
      const img = cycleGraphContext.getImage( graphicData );
      $row.find("td.cycleGraph").empty().append(img);
   }

   return $row;
}

// callback to sort table on column value, invoked by clicking on column head
function columnSort(columnIndex, makeSortUp = ! $($('th')[columnIndex]).hasClass('sort-up')) {
   for (let i = 0; i < 2; i++) {
      $($('th')[i]).removeClass('sort-down')
                   .removeClass('sort-up')
                   .addClass('sort-none');
   }
   $($('th')[columnIndex]).removeClass('sort-none')
                          .addClass(makeSortUp ? 'sort-up' : 'sort-down');

   const getCellValue = (tr, idx) => tr.children[idx].textContent;

   const compareFunction =
      (idx, asc) =>
         (a, b) =>
            ((v1, v2) => v1 !== '' &&
                       v2 !== '' &&
                       !isNaN(v1) &&
                       !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
            )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

   $('#GroupTable tbody').find('tr:nth-child(n+1)')
                         .sort(compareFunction(columnIndex, makeSortUp))
                         .each((_,tr) => $('#GroupTable tbody').append(tr))
}

class HoverHelp {
/*::
   static pollerID : IntervalID;
   static mouse_event : void | (JQueryMouseEventObject & {tooltip_shown: boolean, timeStamp: number});
   static data : Array<{klass: string, pageURL: string, background: string, tooltip: string}>;
 */
   // pollerID = id of polling routine from window.setInterval call
   // mouse_event = event from last 'mousemove' event (event contains timestamp) (undefined => no mousemove event to be handled)

   static eventHandler(_event /*: JQueryEventObject */) {
      const event = ((_event /*: any */) /*: JQueryMouseEventObject & {tooltip_shown: boolean, timeStamp: number} */);

      if (event.ctrlKey || event.shiftKey || event.altKey) {
         return;
      }

      if (event.type == 'click') {
         // clear background, mouse_event, tooltip
         if (HoverHelp.mouse_event != undefined) {
            $(HoverHelp.mouse_event.target).closest('td')
                                           .css('background-color', '#FFFFFF')
                                           .css('cursor', 'default');
         }
         HoverHelp.mouse_event = undefined;
         $('#tooltip').remove();

         // get td, class
         const $td = $(event.target).closest('td');
         if ($td.text() != 'none') {
            for (const {klass, pageURL} of HoverHelp.data) {
               if ($td.hasClass(klass)) {
                  const groupURL = $td.parent().attr('group');
                  const group = ((Library.map.get(groupURL) /*: any */) /*: XMLGroup */);
                  const options = (group.cayleyDiagrams.length != 0) ?
                        {diagram:group.cayleyDiagrams[0].name} : {};
                  Library.openWithGroupURL(pageURL, groupURL, options);
                  break;
               }
            }
         }
      } else if (event.type == 'mousemove') {
         const mouse_event = HoverHelp.mouse_event;
         const $old_td = (mouse_event == undefined) ? undefined : $(mouse_event.target).closest('td');
         const $new_td = $(event.target).closest('td');
         if ($old_td === undefined || $old_td[0] != $new_td[0]) {
            if ($old_td !== undefined) {
               $old_td.css('background-color', '#FFFFFF')
                      .css('cursor', 'default');
            }
            for (const {klass, background} of HoverHelp.data) {
               if ($new_td.hasClass(klass) && $new_td.text() != 'none') {
                  $new_td.css('background-color', background)
                         .css('cursor', 'pointer');
                  break;
               }
            }
            event.tooltip_shown = false;
            $('#tooltip').remove();
         } else {
            event.tooltip_shown = (HoverHelp.mouse_event === undefined) ? false : HoverHelp.mouse_event.tooltip_shown;
         }
         if ($new_td.text() != 'none') {
            HoverHelp.mouse_event = event;
         }
      } else if (event.type = 'mouseleave') {
         // clear background
         if (HoverHelp.mouse_event != undefined) {
            $(HoverHelp.mouse_event.target).closest('td')
                                           .css('background-color', '#FFFFFF')
                                           .css('cursor', 'default');
         }
         // clear mouse_event, tooltip
         HoverHelp.mouse_event = undefined;
         $('#tooltip').remove();
      }
   }

   static poller() {
      const mouse_event = HoverHelp.mouse_event;
      if (   mouse_event !== undefined
          && !mouse_event.tooltip_shown
          && $(mouse_event.target).closest('td') !== undefined
          && performance.now() - mouse_event.timeStamp > 500) {
         const $td = $(mouse_event.target).closest('td');
         for (const {klass, tooltip} of HoverHelp.data) {
            if ($td.hasClass(klass)) {
               const $tooltip = $('<div id="tooltip" class="menu">')
                  .attr('timestamp', performance.now())
                  .text(tooltip)
                  .appendTo($td);
               Menu.setMenuLocations(mouse_event, $tooltip);
               mouse_event.tooltip_shown = true;
               break;
            }
         }
      }

      // if tooltip is more than 10 sec old, clear it
      if ($('#tooltip')[0] !== undefined && performance.now() - parseInt($('#tooltip').attr('timestamp')) > 10000) {
         $('#tooltip').remove()
      }
   }
}

HoverHelp.data = [
   {klass: 'groupName', pageURL: 'GroupInfo.html', background: '#F2F2F2', tooltip: 'Open Group Info page'},
   {klass: 'definition', pageURL: 'GroupInfo.html', background: '#F2F2F2', tooltip: 'Open Group Info page'},
   {klass: 'cayleyDiagram', pageURL: 'CayleyDiagram.html', background: '#F7EDED', tooltip: 'Open Cayley Diagram visualizer'},
   {klass: 'multiplicationTable', pageURL: 'Multtable.html', background: '#F2FFD6', tooltip: 'Open Multiplication Table visualizer'},
   {klass: 'symmetryObject', pageURL: 'SymmetryObject.html', background: '#EDF7ED', tooltip: 'Open Symmetry Object visualizer'},
   {klass: 'cycleGraph', pageURL: 'CycleDiagram.html', background: '#EDEDF7', tooltip: 'Open Cycle Graph Visualizer'},
]
HoverHelp.pollerID = setInterval(HoverHelp.poller, 500);
