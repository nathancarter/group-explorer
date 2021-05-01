// @flow

import Log from './Log.js';
import MathML from './MathML.js';
import setUpGAPCells from './ShowGAPCode.js';
import Template from './Template.js';
import XMLGroup from './XMLGroup.js';

export {summary, display};

// Load templates
const CYCLIC_INFO_URL = './html/CyclicInfo.html';
const Load_Promise =
      new Promise( (resolve, reject) => {
          $.ajax( { url: CYCLIC_INFO_URL,
                    success: (data /*: html */) => {
                        resolve(data);
                    },
                    error: (_jqXHR, _status, err) => {
                        reject(`Error loading ${CYCLIC_INFO_URL} ${err === undefined ? '' : ': ' + err}`)
                    }
                  } );
      } );

let group /*: XMLGroup */;

function summary (Group /*: XMLGroup */) /*: string */ {
    return Group.isCyclic ? 'yes' : 'no';
}

function display (Group /*: XMLGroup */, $wrapper /*: JQuery */) {
    Load_Promise
        .then( (templates) => {
            if ($('template[id|="cyclic"]').length == 0) {
                $('body').append(templates);
            }

            $wrapper.html(formatCyclicInfo(Group));

            MathJax.Hub.Queue(['Typeset', MathJax.Hub, $wrapper[0]]);
            setUpGAPCells(Group, $wrapper);
        } )
        .catch (Log.err)
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
