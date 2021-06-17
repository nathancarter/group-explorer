// @flow

import GEUtils from './GEUtils.js'
import Log from './Log.js';
import Template from './Template.js';

export {summary, display};

/*::
import XMLGroup from './XMLGroup.js'
*/

// Load templates
const ABELIAN_INFO_URL = './html/AbelianInfo.html'
const LoadPromise = GEUtils.ajaxLoad(ABELIAN_INFO_URL)

function summary (Group /*: XMLGroup */) /*: string */ {
    return Group.isAbelian ? 'yes' : 'no';
}

async function display (Group /*: XMLGroup */, $wrapper /*: JQuery */) {
  const templates = await LoadPromise

  if ($('template[id|="abelian"]').length == 0) {
    $('body').append(templates);
  }

  $wrapper.html(formatAbelianInfo(Group));
}

function formatAbelianInfo (Group /*: XMLGroup */) /*: DocumentFragment */ {
    const $frag = $(document.createDocumentFragment());

    if (Group.isAbelian) {
        $frag.append(eval(Template.HTML('abelian-isAbelian-template')));
    } else {
        // $FlowFixMe -- flow doesn't understand deconstruction
        const [i,j] = Group.nonAbelianExample;
        $frag.append(eval(Template.HTML('abelian-isNonAbelian-template')));
    }
    $frag.append(eval(Template.HTML('abelian-gap-compute-template')));

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}
