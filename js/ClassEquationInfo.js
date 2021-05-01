// @flow

import GEUtils from './GEUtils.js';
import Log from './Log.js';
import * as SheetModel from './SheetModel.js';
import setUpGAPCells from './ShowGAPCode.js';
import Template from './Template.js';

export {summary, display};

/*::
import XMLGroup from './XMLGroup.js'

import type {
    JSONType,
    SheetElementJSON,
    RectangleElementJSON,
    TextElementJSON,
    VisualizerType,
    VisualizerElementJSON,
    ConnectingElementJSON,
    MorphismElementJSON
} from './SheetModel.js';
*/

// Load templates
const CLASS_EQUATION_INFO_URL = './html/ClassEquationInfo.html'
const LoadPromise = GEUtils.ajaxLoad(CLASS_EQUATION_INFO_URL)

let Group /*: XMLGroup */;

function summary (group /*: XMLGroup */) /*: string */ {
    Group = group;
    return displayClassEquation();
}

async function display (group /*: XMLGroup */, $wrapper /*: JQuery */) {
  const templates = await LoadPromise

  if ($('template[id|="class-equation"]').length == 0) {
    $('body').append(templates);
  }

  $wrapper.html(formatClassEquation(group));

  $('.show-class-equation-sheet').on('click', (event /*: JQueryEventObject */) => {
    event.preventDefault();
    const target = ((event.target /*: any */) /*: HTMLElement */);
    const type = target.getAttribute( 'data-type' );
    showAsSheet( ((type /*: any */) /*: VisualizerType */) );
  } );

  setUpGAPCells(group, $wrapper);
}

function formatClassEquation (group /*: XMLGroup */) /*: DocumentFragment */ {
    Group = group;
    const $frag = $(document.createDocumentFragment());

    $frag.append(eval(Template.HTML('class-equation-header-template')));

    if (Group.isAbelian) {
        $frag.append(eval(Template.HTML('class-equation-isAbelian-template')));
    } else {
        $frag.append(eval(Template.HTML('class-equation-isNonAbelian-template')));
        for (const conjugacyClass of Group.conjugacyClasses) {
          $('<li>').html(conjugacyClass.toArray().map((el) => Group.representation[el]).join(', '))
            .appendTo($frag.find('#conjugacy_list'));
        }
    }

    $frag.append(eval(Template.HTML('class-equation-trailer-template')));

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}

function displayClassEquation () {
    if (Group.order > 5 && Group.conjugacyClasses.every( (el) => el.popcount() == 1 )) {
        return `1 + 1 + ... (${Group.order} times) ... + 1 = ${Group.order}`;
    } else {
        return Group.conjugacyClasses
            .map( (el) => el.popcount() )
            .join(' + ') +
            ` = ${Group.order}`;
    }
}

function addHighlights ( i /*: number */, array /*: ?Array<null | void | color> */ ) /*: Array<null | void | color> */ {
    if ( !array ) array = (Array( Group.order ).fill('') /*: Array<null | void | string> */);
    return array.map( ( e, j ) => Group.conjugacyClasses[i].isSet( j ) ? GEUtils.fromRainbow( i / Group.conjugacyClasses.length ) : e );
}

function showAsSheet ( type /*: VisualizerType*/ ) {
    const n = Group.conjugacyClasses.length;
    // If the group is abelian, it may have an equation like
    // 1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1=17, which we want to abbreviate
    // as 1+1+1+...+1=17, so we have "fake" values of n and i:
    const fakeN = ( Group.isAbelian && Group.order > 5 ) ? 5 : n;
    // Add title at top of sheet
    var sheetElementsAsJSON = [
        {
            className : 'TextElement',
            x : 50, y : 50, w : 150*fakeN+100, h : 50,
            text : `Class Equation for the Group ${Group.name}`,
            fontSize : '20pt', alignment : 'center'
        }
    ];
    for ( var i = 0 ; i < fakeN ; i++ ) {
        const fakeIndex = ( fakeN == n ) ? i :
              ( i < 3 ) ? i : ( i == 3 ) ? -1 : n - 1;
        if ( fakeIndex == -1 ) { // draw the ellipses
            sheetElementsAsJSON.push( {
                className : 'TextElement',
                x : 50 + 150*i, y : 100, w : 100, h : 50,
                text : '...', alignment : 'center'
            } );
            sheetElementsAsJSON.push( {
                className : 'TextElement',
                x : 50 + 150*i, y : 187, w : 100, h : 50,
                text : '...', alignment : 'center'
            } );
        } else { // draw the acutal CC order and visualizer
            // Add each conjugacy class in two parts:
            // First, its order as an integer:
            sheetElementsAsJSON.push( {
                className : 'TextElement',
                x : 50 + 150*i, y : 100, w : 100, h : 50,
                text : `${Group.conjugacyClasses[fakeIndex].popcount()}`,
                alignment : 'center'
            } );
            // Second, its visualization as highlighted elements in a visualizer:
            sheetElementsAsJSON.push( {
                className : type, groupURL : Group.URL,
                x : 50 + 150*i, y : 150, w : 100, h : 100,
                highlights : { background : addHighlights( fakeIndex ) }
            } );
        }
        // Then add a "+" or an "=" in each of those two rows
        // (always a "+" until the last step, which should be an "="):
        sheetElementsAsJSON.push( {
            className : 'TextElement',
            x : 150 + 150*i, y : 100, w : 50, h : 50,
            text : ( fakeIndex < n - 1 ) ? '+' : '=', alignment : 'center'
        } );
        sheetElementsAsJSON.push( {
            className : 'TextElement',
            x : 150 + 150*i, y : 187, w : 50, h : 50,
            text : ( fakeIndex < n - 1 ) ? '+' : '=', alignment : 'center'
        } );
    }
    // Add the group order in the top row:
    sheetElementsAsJSON.push( {
        className : 'TextElement',
        x : 50 + 150*fakeN, y : 100, w : 100, h : 50,
        text : `${Group.order}`,
        alignment : 'center'
    } );
    // And the entire group, with rainbow highlighting by conjugacy classes,
    // in the bottom row:
    var highlights = null;
    for ( var i = 0 ; i < n ; i++ ) highlights = addHighlights( i, highlights );
    sheetElementsAsJSON.push( {
        className : type, groupURL : Group.URL,
        x : 50 + 150*fakeN, y : 150, w : 100, h : 100,
        highlights : { background : ((highlights /*: any */) /*: Array<null | void | color> */) }
    } );
    // Show it:
    CreateNewSheet( sheetElementsAsJSON );
}

function CreateNewSheet (oldJSONArray /*: Array<Obj> */) {
    const newJSONArray = SheetModel.convertFromOldJSON(oldJSONArray)
    SheetModel.createNewSheet(newJSONArray)
}
