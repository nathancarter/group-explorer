// @flow

import XMLGroup from '../js/XMLGroup.js';

import Arrow from './Arrow.js';
import Chunking from './Chunking.js';
import DiagramChoice from './DiagramChoice.js';
import {clickHandler} from './EventHandler.js';
import Generator from './Generator.js';

export {default as Arrow} from './Arrow.js';
export {default as Chunking} from './Chunking.js';
export {default as DiagramChoice} from './DiagramChoice.js';
export {default as Generator} from './Generator.js';

export {load, update, clickHandler};

const DIAGRAM_PANEL_URL /*: string */ = './diagramController/diagram.html';

/* Load, initialize diagram control */
function load($diagramWrapper /*: JQuery */) /*: Promise<void> */ {
   return new Promise( (resolve, reject) => {
      $.ajax( { url: DIAGRAM_PANEL_URL,
                success: (data /*: string */) => {
                   $diagramWrapper.html(data);
                   setupDiagramPage();
                   resolve();
                },
                error: (_jqXHR, _status, err) => {
                   reject(`Error loading ${DIAGRAM_PANEL_URL} ${err === undefined ? '' : ': ' + err}`);
                }
              } )
   } )
}

function setupDiagramPage() {
   DiagramChoice.setupDiagramSelect();
   Generator.init();

   $('#diagram-select')[0].addEventListener('click', clickHandler);

   $('#generation-control')[0].addEventListener('click', clickHandler);
   $('#generation-table')[0].addEventListener('dragstart', Generator.dragStart);
   $('#generation-table')[0].addEventListener('drop', Generator.drop);
   $('#generation-table')[0].addEventListener('dragover', Generator.dragOver);

   $('#arrow-control')[0].addEventListener('click', clickHandler);

   $('#chunk-select')[0].addEventListener('click', clickHandler);
}

function update() {
   Generator.draw();
   Arrow.updateArrows();
   Chunking.updateChunkingSelect();
}
