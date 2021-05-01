// @flow

import GEUtils from './GEUtils.js'
import Log from './Log.js';
import setUpGAPCells from './ShowGAPCode.js';
import Template from './Template.js';

export {summary, display};

/*::
import XMLGroup from './XMLGroup.js';
*/

// Load templates
const CYCLIC_INFO_URL = './html/CyclicInfo.html'
const LoadPromise = GEUtils.ajaxLoad(CYCLIC_INFO_URL)

let group /*: XMLGroup */;

function summary (Group /*: XMLGroup */) /*: string */ {
    return Group.isCyclic ? 'yes' : 'no';
}

async function display (Group /*: XMLGroup */, $wrapper /*: JQuery */) {
  const templates = await LoadPromise

  if ($('template[id|="cyclic"]').length == 0) {
    $('body').append(templates);
  }

  $wrapper.html(formatCyclicInfo(Group));

  setUpGAPCells(Group, $wrapper);
}

function formatCyclicInfo (Group /*: XMLGroup */) /*: DocumentFragment */ {
    const $frag = $(document.createDocumentFragment());
    if (Group.isCyclic) {
        const generator = Group.generators[0][0];
        $frag.append(eval(Template.HTML('cyclic-isCyclic-template')));
    } else {
        $frag.append(eval(Template.HTML('cyclic-nonCyclic-template')));
    }
    $frag.append(eval(Template.HTML('cyclic-trailer-template')));

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}
