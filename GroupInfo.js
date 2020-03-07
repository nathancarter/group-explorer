// @flow

import {CayleyDiagramView, createUnlabelledCayleyDiagramView} from './js/CayleyDiagramView.js';
import {CycleGraphView, createUnlabelledCycleGraphView} from './js/CycleGraphView.js';
import Library from './js/Library.js';
import Log from './js/Log.js';
import MathML from './js/MathML.js';
import MathUtils from './js/MathUtils.js';
import Menu from './js/Menu.js';
import {MulttableView, createMinimalMulttableView} from './js/MulttableView.js';
import {CreateNewSheet} from './js/SheetModel.js';
import setUpGAPCells from './js/ShowGAPCode.js';
import {SymmetryObjectView, createStaticSymmetryObjectView} from './js/SymmetryObjectView.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

export {loadGroup as load};

// Global variables
let Group			/*: XMLGroup */;		// group this page displays information about
let Cayley_Diagram_View		/*: CayleyDiagramView */;
let Symmetry_Object_View	/*: SymmetryObjectView */;
let Cycle_Graph_View		/*: CycleGraphView */;
let Multtable_View		/*: MulttableView */;

// Static event managers (setup after document is available)
$(function() {
   $('#Computed_properties + div').on('click', (ev /*: JQueryEventObject */) =>
      ($(ev.target).attr('page') === undefined) ? undefined : Library.openWithGroupURL($(ev.target).attr('page'), Group.URL));
   $('body')[0].addEventListener('click', actionClickHandler);
});

// read in library, group from invocation
function loadGroup() {
   Library
      .loadFromURL()
      .then( (_group) => {
         Group = _group;
         displayStatic();
         displayDynamic();
      } )
      .catch( Log.err );
}

// displays group information that is independent of the representation
function displayStatic() {
   Cayley_Diagram_View = createUnlabelledCayleyDiagramView({height: 100, width: 100});
   Cycle_Graph_View = createUnlabelledCycleGraphView({height: 100, width: 100});
   Symmetry_Object_View = createStaticSymmetryObjectView({height: 100, width: 100});
   Multtable_View = createMinimalMulttableView({height: 100, width: 100});

   // Header
   $('#heading').html(eval(Template.HTML('heading_template')));

   // Basic facts
   const basicFacts = [
      {groupField: 'order',      displayName: 'Order',      formattedValue: Group.order },
      {groupField: 'gapname',    displayName: 'GAP name',   formattedValue: Group.gapname },
      {groupField: 'gapid',      displayName: 'GAP ID',     formattedValue: Group.gapid },
      {groupField: 'other_names',displayName: 'Other names',
       formattedValue: Group.other_names == undefined ? '' : Group.other_names.map( (name) => MathML.sans(name) ).join(', ') },
      {groupField: 'definition', displayName: 'Definition', formattedValue: MathML.sans(Group.definition) },
      {groupField: 'links',      displayName: 'More info',
       formattedValue: Group.links == undefined ? '' : Group.links.map( (link) => `<a href="${link}">${link}</a>` ).join(', ') },
   ];
   for (const basicFact of basicFacts) {
      if ((Group /*: {[key: string]: mixed} */)[basicFact.groupField] != undefined) {
         $('#basic-fact-table').append(eval(Template.HTML('basicFact-template')));
      }
   }

   setUpGAPCells(Group);

   // Views --
   //   Add rows to ViewTable until there are no more Cayley Diagrams (including
   //   the generated one) && no more Symmetry Objects
   for (let inx = 0;
        inx < Group.cayleyDiagrams.length + 1 || inx < Group.symmetryObjects.length;
        inx++) {
      const $row = $('#ViewTable').append(eval(Template.HTML('view_row_template')))
                                  .children()
                                  .last();

      if (inx < Group.cayleyDiagrams.length + 1) {
         const cayley_diagram_name = (inx == Group.cayleyDiagrams.length)
                           ? undefined
                           : Group.cayleyDiagrams[inx].name;
         Cayley_Diagram_View.setDiagram(Group, cayley_diagram_name);
         const img = Cayley_Diagram_View.getImage();
         $(img).attr('title', `${cayley_diagram_name == undefined ? 'Generated' : cayley_diagram_name} Cayley diagram visualizer link`);
         $row.children(':nth-child(1)')
             .addClass('programLink')
             .text(cayley_diagram_name === undefined ? '' : cayley_diagram_name)
             .on('click', () => {
                const options = (cayley_diagram_name === undefined) ? {} : {diagram: cayley_diagram_name};
                Library.openWithGroupURL('CayleyDiagram.html', Group.URL, options);
             })
             .prepend(img);
      }

      if (inx == 0) {
         Cycle_Graph_View.group = Group;
         const img = Cycle_Graph_View.getImage();
         $(img).attr('title', 'Cycle graph visualizer link');
         $row.children(':nth-child(2)')
             .addClass('programLink')
             .text('')
             .on('click', () => Library.openWithGroupURL('CycleGraph.html', Group.URL))
             .prepend(img);
      }

      if (inx == 0) {
         Multtable_View.group = Group;
         const img = Multtable_View.getImage();
         $(img).attr('title', 'Multiplication table visualizer link');
         $row.children(':nth-child(3)')
             .addClass('programLink')
             .text('')
             .on('click', () => Library.openWithGroupURL('Multtable.html', Group.URL))
             .prepend(img);
      }

      if (inx < Group.symmetryObjects.length) {
         const img = Symmetry_Object_View.setObject(Group.symmetryObjects[inx]).getImage();
         const symmetry_object_name  = Group.symmetryObjects[inx].name;
         $(img).attr('title', `${symmetry_object_name} symmetry object visualizer link`);
         $row.children(':nth-child(4)')
             .addClass('programLink')
             .text(symmetry_object_name)
             .on('click', () =>
                Library.openWithGroupURL('SymmetryObject.html', Group.URL, {diagram: symmetry_object_name}))
             .prepend(img);
      }
   }

   // Description
   if (Group.notes != '') {
      $('#description').html(Group.notes);
   }

   // Computed properties:
   $('#computed-properties').prepend(eval(Template.HTML('computedProperties_template')));
   if (Group.isCyclic) {
      const [m, n, _] = MathUtils.getFactors(Group.order)
                                 .reduce( ([fac1, fac2, prev], el) => {
                                    if (el >= prev) {
                                       fac1 *= el;
                                       prev = el;
                                    } else {
                                       fac2 *= el;
                                    }
                                    return [fac1, fac2, prev];
                                 }, [1, 1, 0] );
      const template_name = (n == 1) ? 'not-Z_mn-row-template' : 'Z_mn-row-template';
      $('#computed-properties tbody').append(eval(Template.HTML(template_name)));
   }

   // File data
   $('#file-data').html(eval(Template.HTML('fileData_template')));
}

// (Re-)paints group information that depends on the representation (which may change)
function displayDynamic() {
   // Generators
   if (Group.generators.length != 0) {
      $('#generators').html(displayGenerators());
   }

   // Default element names
   if (Group.representation.length != 0) {
      $('#default-element-names').html(MathML.csList(Group.elements.map( (el) => Group.representation[el] )));
      if (Group.representationIsUserDefined) {
         $('#default-element-names').append('<br>This representation is user-defined; see below.');
      } else {
         $('#default-element-names').append('<br>This representation was loaded from the group file.');
      }
   }

   // Loaded element names
   $('#loaded-naming-schemes').html('');
   if (Group.representations.length > 1 || Group.representationIsUserDefined) {
      const fragment = Group
         .representations
         .reduce( (frag, rep, index) => {
            if (Group.representations[index] != Group.representation) {
               const scheme = MathML.rowList(Group.elements.map( (el) => Group.representation[el] + '<mo>=</mo>' + rep[el] ));
               frag.append(eval(Template.HTML('loadedSchemeChoice-template')));
            }
            return frag;
         }, $('<ol>') );
      $('#loaded-naming-schemes').empty().append(fragment);
   }

   // User-defined naming schemes
   if (Group.userRepresentations.length == 0) {
      $('#no-user-defined-naming-schemes').show();
      $('#user-defined-naming-schemes').hide();
   } else {
      $('#no-user-defined-naming-schemes').hide();
      const fragment = Group
         .userRepresentations
         .reduce( (frag, rep, index) => {
            if (Group.userRepresentations[index] == Group.representation) {
               frag.append(eval(Template.HTML('inUseScheme-template')));
            } else {
               const scheme = MathML.rowList(Group.elements.map( (el) => Group.representation[el] + '<mo>=</mo>' + rep[el] ));
               frag.append(eval(Template.HTML('userSchemeChoice-template')));
            }
            return frag;
         }, $('<ol>') );
      $('#user-defined-naming-schemes').empty().append(fragment).show();
   }

   // notes
   Notes.show();

   MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
}

function actionClickHandler(event /*: MouseEvent */) {
   const action = $(event.target).attr('action');
   if (action != undefined) {
      event.preventDefault();
      event.stopPropagation();
      eval(action);
   }
}

function displayClassEquation() {
   if (   Group.order > 5
       && Group.conjugacyClasses.every( (el) => el.popcount() == 1 )) {
      return `1 + 1 + ... (${Group.order} times) ... + 1 = ${Group.order}`;
   } else {
      return Group.conjugacyClasses
                  .map( (el) => el.popcount() )
                  .join(' + ') +
             ` = ${Group.order}`;
   }
}

function displayOrderClasses() {
   return `${(new Set(Group.elementOrders)).size} order
                  class${(Group.order != 1) ? 'es' : ''}`;
}

function displayGenerators() {
   return Group.generators.map(
      (gen) => gen.reduce(
         (acc, el, inx) => {
            const rep = MathML.sans(Group.representation[el]);
            if (gen.length == 1) {
               return `The element ${rep} generates the group.`;
            } else if (inx == 0) {
               return `The elements ${rep}`;
            } else if (inx == gen.length-1) {
               return acc + ` and ${rep} generate the group.`;
            } else {
               return acc + `, ${rep}`;
            }
         },
         '')
   ).join('<br>');
}

function setRep(index /*: number */) {
   Group.representation = Group.representations[index];
   Library.saveGroup(Group);
   displayDynamic();
}

class UDR {
/*::
   static current_index : ?number;
 */
   static setRep(index /*: number */) {
      Group.representation = Group.userRepresentations[index];
      Library.saveGroup(Group);
      displayDynamic();
   }

   static create() {
      UDR.current_index = Group.userRepresentations.length;
      UDR._showEditor(Array(Group.order).fill(''));
   }

   static edit(index /*: number */) {
      UDR.current_index = index;
      UDR._showEditor(Group.userRepresentations[index]);
   }

   static _showEditor(representation /*: Array<mathml> */) {
      const editor = $(eval(Template.HTML('namingEditor-template')));
      const tableBody = editor.find('tbody');
      representation.forEach( (rep, inx) => tableBody.append(eval(Template.HTML('udr-edit-template'))) );
      $('body').append(editor).find('#naming-editor').show();
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'naming-editor']);
   }

   static closeEdit() {
      UDR.current_index = undefined;
      $('#naming-editor').remove();
   }

   static saveEdit() {
      Group.userRepresentations[((UDR.current_index /*: any */) /*: number */)] =
         $('#udr-edit-table tbody textarea').map( (_, el) => '<mtext>' + ((el /*: any */) /*: HTMLTextAreaElement */).value + '</mtext>' ).toArray();
      Library.saveGroup(Group);
      UDR.closeEdit();
      displayDynamic();
   }

   static remove(index /*: number */) {
      Group.deleteUserRepresentation(index);
      Library.saveGroup(Group);
      displayDynamic();
   }
}

class Notes {
   static show() {
      if (Group.userNotes == '') {
         $('#notes-content').html('<i>none</i>');
      } else {
         $('#notes-content').text(Group.userNotes);
      }
      $('#notes-show').show();
      $('#notes-edit').hide();
   }

   static edit() {
      $('#notes-text').text( (Group.userNotes == undefined) ? '' : Group.userNotes );
      $('#notes-show').hide();
      $('#notes-edit').show();
   }

   static clear() {
      (($('#notes-text')[0] /*: any */) /*: HTMLTextAreaElement */).value = '';
   }

   static save() {
      Group.userNotes = (($('#notes-text')[0] /*: any */) /*: HTMLTextAreaElement */).value;
      Library.saveGroup(Group);
      Notes.show();
   }
}

function showAllVisualizersSheet () {
   const iso = Group.generators[0].map( g => [ g, g ] );
   CreateNewSheet( [
      {
         className : 'TextElement',
         x : 50, y : 50, w : 800, h : 50,
         text : `All Visualizers for the Group ${MathML.toUnicode(Group.name)}`,
         fontSize : '20pt', alignment : 'center'
      },
      {
         className : 'TextElement',
         x : 50, y : 100, w : 200, h : 50,
         text : `Cayley Diagram`, alignment : 'center'
      },
      {
         className : 'TextElement',
         x : 350, y : 100, w : 200, h : 50,
         text : `Multiplication Table`, alignment : 'center'
      },
      {
         className : 'TextElement',
         x : 650, y : 100, w : 200, h : 50,
         text : `Cycle Graph`, alignment : 'center'
      },
      {
         className : `CDElement`,
         groupURL : Group.URL,
         x : 50, y : 150, w : 200, h : 200
      },
      {
         className : `MTElement`,
         groupURL : Group.URL,
         x : 350, y : 150, w : 200, h : 200
      },
      {
         className : `CGElement`,
         groupURL : Group.URL,
         x : 650, y : 150, w : 200, h : 200
      },
      {
         className : `MorphismElement`,
         fromIndex : 4, toIndex : 5,
         name : MathML.toUnicode( '<msub><mi>id</mi><mn>1</mn></msub>' ),
         showInjSurj : true, showManyArrows : true, definingPairs : iso
      },
      {
         className : `MorphismElement`,
         fromIndex : 5, toIndex : 6,
         name : MathML.toUnicode( '<msub><mi>id</mi><mn>2</mn></msub>' ),
         showInjSurj : true, showManyArrows : true, definingPairs : iso
      }
   ] );
}
