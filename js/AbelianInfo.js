// @flow

import Log from './Log.js';
import MathML from './MathML.js';
import setUpGAPCells from './ShowGAPCode.js';
import Template from './Template.js';
import XMLGroup from './XMLGroup.js';

export {summary, display};

// Load templates
const ABELIAN_INFO_URL = './html/AbelianInfo.html';
const Load_Promise =
      new Promise( (resolve, reject) => {
          $.ajax( { url: ABELIAN_INFO_URL,
                    success: (data /*: html */) => {
                        resolve(data);
                    },
                    error: (_jqXHR, _status, err) => {
                        reject(`Error loading ${ABELIAN_INFO_URL} ${err === undefined ? '' : ': ' + err}`)
                    }
                  } );
      } );

function summary (Group /*: XMLGroup */) /*: string */ {
    return Group.isAbelian ? 'yes' : 'no';
}

function display (Group /*: XMLGroup */, $wrapper /*: JQuery */) {
    Load_Promise
        .then( (templates) => {
            if ($('template[id|="abelian"]').length == 0) {
                $('body').append(templates);
            }

            $wrapper.html(formatAbelianInfo(Group));

            MathJax.Hub.Queue(['Typeset', MathJax.Hub, $wrapper[0]]);
            setUpGAPCells(Group, $wrapper);
        } )
        .catch (Log.err)
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
    $frag.append(eval(Template.HTML('abelian-gapcell-template')));

    return (($frag[0] /*: any */) /*: DocumentFragment */);
}
