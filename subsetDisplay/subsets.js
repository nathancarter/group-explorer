// @flow

import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import AbstractPartition from './AbstractPartition.js';
import AbstractSubset from './AbstractSubset.js';
import ConjugacyClasses from './ConjugacyClasses.js';
import Cosets from './Cosets.js';
import OrderClasses from './OrderClasses.js';
import PartitionSubset from './PartitionSubset.js';
import Subgroup from './Subgroup.js';
import SubsetEditor from './SubsetEditor.js';
import Subset from './Subset.js';
import {initSubsetMenu, showingOrderClasses, showingConjugacyClasses, showingLeftCosets, showingRightCosets, makeLongList, showHeaderMenu, showMenu} from './SubsetMenu.js';

export {default as AbstractPartition} from './AbstractPartition.js';
export {default as AbstractSubset} from './AbstractSubset.js';
export {default as ConjugacyClasses} from './ConjugacyClasses.js';
export {default as Cosets} from './Cosets.js';
export {default as OrderClasses} from './OrderClasses.js';
export {default as PartitionSubset} from './PartitionSubset.js';
export {default as Subgroup} from './Subgroup.js';
export {default as SubsetEditor} from './SubsetEditor.js';
export {default as Subset} from './Subset.js';
export {showingOrderClasses, showingConjugacyClasses, showingLeftCosets, showingRightCosets, makeLongList, showHeaderMenu, showMenu} from './SubsetMenu.js';

export {load, getNextId, getNextSubsetIndex};

/*::
type highlighterRoutines = Array<{handler: (Array<Array<groupElement>>) => void, label: string}>;
*/

const SUBSET_DISPLAY_URL /*: string */ = './subsetDisplay/subsets.html';

let group /*: XMLGroup */ = new XMLGroup();
let nextSubsetIndex /*: number*/ = 0;
let nextId /*: number */ = 0;
let displayList /*: Array<AbstractSubset> */ = [];
let highlighters /*: highlighterRoutines */ = [];
let clearHighlights /*: () => void */ = () => void(0);
export {group, nextSubsetIndex, nextId, displayList, highlighters, clearHighlights};


/* Load, initialize subset display */
function load($subsetWrapper /*: JQuery */,
              _highlighters /*: highlighterRoutines*/,
              _clearHighlights /*: () => void */,
              _group /*: XMLGroup */) /*: Promise<void> */
{
   group = _group;
   highlighters = _highlighters;
   clearHighlights = _clearHighlights;              
   nextSubsetIndex = 0;
   nextId = 0;
   displayList = [];
   return new Promise( (resolve, reject) => {
      $.ajax( { url: SUBSET_DISPLAY_URL,
                success: (data /*: string */) => {
                   $subsetWrapper.html(data);
                   setupSubsetPage();
                   resolve();
                },
                error: (_jqXHR, _status, err) => {
                   reject(`Error loading ${SUBSET_DISPLAY_URL} ${err === undefined ? '' : ': ' + err}`);
                }
              } )
   } )
}

function setupSubsetPage() {
   // clear out displayed lists; show '(None)' placeholders
   $('ul.subset_page_content li').remove();
   $('p.placeholder').show();

   // Display all subgroups
   Subgroup.displayAll();

   // set up event listeners for menus
   initSubsetMenu();
}

function getNextId() /*: number */ {
   return nextId++;
}

function getNextSubsetIndex() /*: number */ {
   return nextSubsetIndex++;
}
