// @flow

import GEUtils from './GEUtils.js'
import Log from './Log.js';
import Template from './Template.js';

export {summary, display};

/*::
import XMLGroup from './XMLGroup.js';
*/

// Load templates
const ORDER_CLASSES_INFO_URL = './html/OrderClassesInfo.html'
const LoadPromise = GEUtils.ajaxLoad(ORDER_CLASSES_INFO_URL)

function summary (Group /*: XMLGroup */) /*: string */ {
    const numOrderClasses = new Set(Group.elementOrders).size;
    return `${numOrderClasses} order class${(Group.order == 1) ? '' : 'es'}`;
}

async function  display (Group /*: XMLGroup */, $wrapper /*: JQuery */) {
  const templates = await LoadPromise

  if ($('template[id|="order-classes"]').length == 0) {
    $('body').append(templates);
  }

  $wrapper.html(formatOrderClasses(Group));
}

function formatOrderClasses (Group /*: XMLGroup */) /*: DocumentFragment */ {
    const $frag = $(document.createDocumentFragment());
    const numOrderClasses = new Set(Group.elementOrders).size;
    if (numOrderClasses == 1) {
        $frag.append(eval(Template.HTML('order-classes-single-template')));
    } else {
        $frag.append(eval(Template.HTML('order-classes-multiple-template')));
        Group.orderClasses.forEach( (members, order) => {
            if (members.popcount() != 0) {
                $frag.find('#order-classes-list')
                    .append($('<li>').html(`Elements of order ${order}: ` +
                       members.toArray().map((el) => Group.representation[el]).join(', ')
                    ))
            }
        } )
    };
    $frag.append(eval(Template.HTML('order-classes-trailer-template')));

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}
