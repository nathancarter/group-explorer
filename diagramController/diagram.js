// @flow
/*::
import Arrow from './Arrow.js';
import ArrowMult from './ArrowMult.js';
import Chunking from './Chunking.js';
import DiagramChoice from './DiagramChoice.js';
import Generator from './Generator.js';
import Menu from '../js/Menu.md';

export default
 */
class DC {
/*::
   static DIAGRAM_PANEL_URL: string;
   static Arrow: Class<Arrow>;
   static ArrowMult: Class<ArrowMult>;
   static Chunking: Class<Chunking>;
   static DiagramChoice: Class<DiagramChoice>;
   static Generator: Class<Generator>;
 */
   /* Load, initialize diagram control */
   static load($diagramWrapper /*: JQuery */) /*: Promise<void> */ {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: DC.DIAGRAM_PANEL_URL,
                   success: (data /*: string */) => {
                      $diagramWrapper.html(data);
                      DC.setupDiagramPage();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${DC.DIAGRAM_PANEL_URL} ${err === undefined ? '' : ': ' + err}`);
                   }
         } )
      } )
   }

   static setupDiagramPage() {
      DC.DiagramChoice.setupDiagramSelect();
      DC.Generator.init();

      $('#diagram-select')[0].addEventListener('click', Menu.actionClickHandler);

      $('#generation-control')[0].addEventListener('click', Menu.actionClickHandler);
      $('#generation-table')[0].addEventListener('dragstart', DC.Generator.dragStart);
      $('#generation-table')[0].addEventListener('drop', DC.Generator.drop);
      $('#generation-table')[0].addEventListener('dragover', DC.Generator.dragOver);

      $('#arrow-control')[0].addEventListener('click', Menu.actionClickHandler);

      $('#chunk-select')[0].addEventListener('click', Menu.actionClickHandler);
   }

   static update() {
      DC.Generator.draw();
      DC.Arrow.updateArrows();
      DC.Chunking.updateChunkingSelect();
   }
}

DC.DIAGRAM_PANEL_URL = 'diagramController/diagram.html';

