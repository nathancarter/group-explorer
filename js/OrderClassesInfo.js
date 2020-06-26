// @flow

import Log from './Log.js';
import MathML from './MathML.js';
import setUpGAPCells from './ShowGAPCode.js';
import Template from './Template.js';
import XMLGroup from './XMLGroup.js';

export {summary, display};

// Load templates
const ORDER_CLASSES_INFO_URL = './html/OrderClassesInfo.html';
const Load_Promise =
      new Promise( (resolve, reject) => {
          $.ajax( { url: ORDER_CLASSES_INFO_URL,
                    success: (data /*: html */) => {
                        resolve(data);
                    },
                    error: (_jqXHR, _status, err) => {
                        reject(`Error loading ${ORDER_CLASSES_INFO_URL} ${err === undefined ? '' : ': ' + err}`)
                    }
                  } );
      } );

function summary (Group /*: XMLGroup */) /*: string */ {
    const numOrderClasses = new Set(Group.elementOrders).size;
    return `${numOrderClasses} order class${(Group.order == 1) ? '' : 'es'}`;
}

function  display (Group /*: XMLGroup */, $wrapper /*: jQuery */) {
    Load_Promise
        .then( (templates) => {
            if ($('template[id|="order-classes"]').length == 0) {
                $('body').append(templates);
            }

            $wrapper.empty().append(formatOrderClasses(Group));

            MathJax.Hub.Queue(['Typeset', MathJax.Hub, $wrapper[0]]);
            setUpGAPCells(Group, $wrapper);
        } )
        .catch (Log.err)
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
                    .append($('<li>').html(
                        `Elements of order ${order}:&nbsp;` +
                            MathML.csList(members.toArray().map( (el) => Group.representation[el] ))
                    ))
            }
        } )
    };
    $frag.append(eval(Template.HTML('order-classes-trailer-template')));

    return $frag;
}
