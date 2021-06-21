// @flow

/* global $ */

import { createUnlabelledCayleyDiagramView } from './js/CayleyDiagramView.js';
import { createUnlabelledCycleGraphView } from './js/CycleGraphView.js';
import * as Library from './js/Library.js';
import { createMinimalMulttableView } from './js/MulttableView.js';
import * as SheetModel from './js/SheetModel.js';
import * as ShowGAPCode from './js/ShowGAPCode.js'
import { createStaticSymmetryObjectView } from './js/SymmetryObjectView.js';
import Template from './js/Template.js';

/*::
  import {CayleyDiagramView} from './js/CayleyDiagramView.js';
  import {CycleGraphView} from './js/CycleGraphView.js';
  import {MulttableView} from './js/MulttableView.js';
  import {SymmetryObjectView} from './js/SymmetryObjectView.js';
  import XMLGroup from './js/XMLGroup.js';
*/

import * as AbelianInfo from './js/AbelianInfo.js';
import * as ClassEquationInfo from './js/ClassEquationInfo.js';
import * as CyclicInfo from './js/CyclicInfo.js';
import * as OrderClassesInfo from './js/OrderClassesInfo.js';
import * as SolvableInfo from './js/SolvableInfo.js';
import * as SubgroupInfo from './js/SubgroupInfo.js';
import * as ZmnInfo from './js/ZmnInfo.js';

export {load, actionClickHandler};

// Global variables
let Group			/*: XMLGroup */;		// group this page displays information about
let Cayley_Diagram_View		/*: CayleyDiagramView */;
let Symmetry_Object_View	/*: SymmetryObjectView */;
let Cycle_Graph_View		/*: CycleGraphView */;
let Multtable_View		/*: MulttableView */;

// Static event managers (setup after document is available)
$(function() {
   $('body')[0].addEventListener('click', actionClickHandler);
});

// read in library, group from invocation
async function load () {
  Group = await Library.loadFromURL()
  displayStatic()
  displayDynamic()
}

// displays group information that is independent of the representation
function displayStatic () {
    const thumbnail_size = {height: 100, width: 100};
    Cayley_Diagram_View = createUnlabelledCayleyDiagramView(thumbnail_size);
    Cycle_Graph_View = createUnlabelledCycleGraphView(thumbnail_size);
    Symmetry_Object_View = createStaticSymmetryObjectView(thumbnail_size);
    Multtable_View = createMinimalMulttableView(thumbnail_size);

    // Header
    $('#heading').html(`${Group.name + ((Group.phrase == "") ? '' : (' - ' + Group.phrase))}`)

    displayBasicFacts();
    displayViews();
    displayFileData();
    displayNotes();
}

// (Re-)paints group information that depends on the representation (which may change)
function displayDynamic () {
    displayComputedProperties();
    displayGenerators();
    displayNamingSchemes();
}

function displayBasicFacts () {
    const basic_fact_info = [
        {name: 'Order',      value: Group.order },
        {name: 'GAP name',   value: Group.gapname },
        {name: 'GAP ID',     value: Group.gapid },
        {name: 'Other names',value: Group.other_names == undefined ? '' : Group.other_names.join(', ') },
        {name: 'Definition', value: Group.definition },
        {name: 'Notes',      value: Group.notes },
        {name: 'More info',  value: Group.links == undefined ? '' : Group.links.map( (link) => `<a href="${link}">${link}</a>` ).join(', ') },
    ];
    const $frag = basic_fact_info.reduce( ($frag, basic_fact) => {
        if (basic_fact.value != undefined && basic_fact.value !== '') {
            $frag.append(eval(Template.HTML('basic-fact-template')));
        }
        return $frag;
    }, $(document.createDocumentFragment()) );
    $('#basic-facts > .name-value-content').prepend($frag);
}

// Display rows of visualizer thumbnails, hiding all but the first row until toggled
function displayViews () {
    // add enough rows to content to display all the Cayley diagram and symmetry objects
    const num_rows = Math.max(Group.cayleyDiagrams.length + 1, Group.symmetryObjects.length);
    Array(num_rows).fill('').reduce( ($frag, _, index) => {
        return $frag.append(eval(Template.HTML('view-row-template')))
    }, $(document.createDocumentFragment()) )
        .insertAfter($(`#views > .content > .heading-row`));

    // remove the ...more/...less toggle if we only have 1 row
    if (num_rows == 1) {
        $('#views > .content .comment.toggle').remove();
    }
    $('#views > .content .data-row.toggled').hide();

    // add Cayley diagrams thumbnails, ending with the generated diagram
    for (let index = 0; index < Group.cayleyDiagrams.length + 1; index++) {
        const cayley_diagram_name = (index == Group.cayleyDiagrams.length)
              ? undefined
              : Group.cayleyDiagrams[index].name;
        Cayley_Diagram_View.setDiagram(Group, cayley_diagram_name);
        const img = Cayley_Diagram_View.getImage();
        $(img).attr('title', `${cayley_diagram_name == undefined ? 'Generated' : cayley_diagram_name} Cayley diagram visualizer link`);
        $(`#views > .content > .data-row[index=${index}] > .CD`)
            .addClass('programLink')
            .html(`<div class="caption">${cayley_diagram_name == undefined ? '&nbsp;' : cayley_diagram_name}</div>`)
            .on('click', () => {
                const options = (cayley_diagram_name === undefined) ? {} : {diagram: cayley_diagram_name};
                Library.openWithGroupURL('CayleyDiagram.html', Group.URL, options);
            })
            .prepend(img);
    }

    // add Cycle graph thumbnail
    {
        Cycle_Graph_View.group = Group;
        const img = Cycle_Graph_View.getImage();
        $(img).attr('title', 'Cycle graph visualizer link');
        $('#views > .content > .data-row[index=0] > .CG')
            .addClass('programLink')
            .on('click', () => Library.openWithGroupURL('CycleGraph.html', Group.URL))
            .prepend(img);
    }

    // add Multtable thumbnail
    {
        Multtable_View.group = Group;
        const img = Multtable_View.getImage();
        $(img).attr('title', 'Multiplication table visualizer link');
        $('#views > .content > .data-row[index=0] > .MT')
            .addClass('programLink')
            .on('click', () => Library.openWithGroupURL('Multtable.html', Group.URL))
            .prepend(img);
    }

    // add Symmetry object thumbnails, if needed
    for (let index = 0; index < Group.symmetryObjects.length; index++) {
        const img = Symmetry_Object_View.setObject(Group.symmetryObjects[index]).getImage();
        const symmetry_object_name  = Group.symmetryObjects[index].name;
        $(img).attr('title', `${symmetry_object_name} symmetry object visualizer link`);
        $(`#views > .content > .data-row[index=${index}] > .OS`)
            .addClass('programLink')
            .html(`<div class="caption">${symmetry_object_name}</div>`)
            .on('click', () =>
                Library.openWithGroupURL('SymmetryObject.html', Group.URL, {diagram: symmetry_object_name}))
            .prepend(img);
    }

    $('#views .content .data-row[index=0] .thumbnail img')
        .toArray()
        .forEach( (img) => $('#view-minis').append($(`<img src="${img.src}" height="32" width="32" style="margin-left: 20px">`)) );
}

// Computed property displays are created in js/XXXInfo.js modules,
//   using templates defined in html/XXXInfo.html and appended to the end of the <body> element
function displayComputedProperties () {
    $('#abelian > .summary').text(AbelianInfo.summary(Group));
    AbelianInfo.display(Group, $('#abelian > .content'));

    $('#class-equation > .summary').text(ClassEquationInfo.summary(Group));
    ClassEquationInfo.display(Group, $('#class-equation > .content'));

    $('#cyclic-group > .summary').text(CyclicInfo.summary(Group));
    CyclicInfo.display(Group, $('#cyclic-group > .content'));

    $('#subgroups > .summary').text(SubgroupInfo.summary(Group));
    SubgroupInfo.display(Group, $('#subgroups > .content'));

    $('#order-classes > .summary').text(OrderClassesInfo.summary(Group));
    OrderClassesInfo.display(Group, $('#order-classes > .content'));

    $('#solvable > .summary').text(SolvableInfo.summary(Group));
    SolvableInfo.display(Group, $('#solvable > .content'));

    if (Group.isCyclic) {
        $('#zmn > .summary').text(ZmnInfo.summary(Group));
        ZmnInfo.display(Group, $('#zmn > .content'));
    } else {
        $('#zmn').remove();  // Don't show ZmnInfo if group isn't cyclic
    }
}

function displayFileData () {
    const file_data_info = [
        {name: 'Author',	value: Group.author },
        {name: 'URL',		value: Group.URL },
        {name: 'Last modified',	value: Group.lastModifiedOnServer },
    ];
    const $frag = file_data_info.reduce( ($frag, file_datum) => {
        if (file_datum.value != undefined) {
            $frag.append(eval(Template.HTML('file-data-template')));
        }
        return $frag;
    }, $(document.createDocumentFragment()) );
    $('#file-data > .name-value-content').append($frag).hide();
}

function displayGenerators () {
    if (Group.generators.length != 0) {
        const generator_display = Group.generators.map(
            (gen) => gen.reduce(
                (acc, el, inx) => {
                    const rep = Group.representation[el];
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
        $('#generators > .content').html(generator_display).hide();
    }
}

function displayNamingSchemes () {
    const first_time_through = ($('#default-names > .content').text().length == 0);

    // Default element names
    if (Group.representation.length != 0) {
        const representations = Group.elements.map((el, inx) => eval(Template.HTML('default-name-template')))
        const representationSource = eval(Template.HTML('default-name-source-template'))
        const $frag = $(document.createDocumentFragment()).append(representations).append(representationSource)
        $('#default-names > .content').html( (($frag[0] /*: any */) /*: DocumentFragment */) );
    }

    const rowList = (representation) => {
      return Group.elements.map((el) => eval(Template.HTML('loaded-representation-template'))).join('')
    }

  // Loaded element names
    $('#loaded-names > .content').empty()
    if (Group.representations.length > 1 || Group.representationIsUserDefined) {
       const [_, $frag] = Group
              .representations
              .reduce(([label, $frag], representation, index) => {
                if (index != Group.representationIndex) {
                  const $scheme = $(eval(Template.HTML('loaded-scheme-template')))
                  $scheme.find('tbody').append(rowList(representation))
                  return [label + 1, $frag.append($scheme)]
                } else {
                  return [label, $frag]
                }
              }, [1, $(document.createDocumentFragment())])
       $('#loaded-schemes').html((($frag[0] /*: any */) /*: DocumentFragment */))
    }

    // User-defined naming schemes
  if (Group.userRepresentations.length == 0) {
    $('#user-naming-schemes').html(eval(Template.HTML('user-names-no-user-defined-names-template')))
  } else {
    const $frag = Group
        .userRepresentations
          .reduce( ($frag, representation, index) => {
            const $scheme = $(eval(Template.HTML('user-naming-scheme-template')))
            $scheme.find('tbody').append(rowList(representation))
            return $frag.append($scheme)
        }, $(document.createDocumentFragment()))
    $('#user-naming-schemes').html((($frag[0] /*: any */) /*: DocumentFragment */))
  }

    // Hide naming schemes the first time the page is displayed,
    //   but not when it is re-displayed after, e.g., changing the default naming scheme
    if (first_time_through) {
        $('#naming-schemes > .content').hide();
    }
}

function displayNotes () {
    const first_time_through = ($('#notes-display').text().length == 0);
    Notes.display(Group.userNotes);
    // Hide notes the first time the page is displayed,
    //   but not after re-displaying the page after, e.g., editing the notes
    if (first_time_through) {
        $('#notes > .toggled').hide();
    }
}

// find the nearest ancestor with an 'data-action' attribute and execute (eval) the action (if it exists)
//   note that this requires that any function name referenced in the action be available to this routine
//   many have to be exported/imported from the XXXInfo.js modules where they are defined
function actionClickHandler(event /*: MouseEvent */) {
    const $action = $(event.target).closest('[data-action]');
    if ($action.length != 0) {
        event.preventDefault();
        event.stopPropagation();
        eval($action.attr('data-action'));
    }
}

function setRepresentationIndex (index /*: number */) {
    Group.representation = Group.representations[index];
    Library.saveGroup(Group);
    displayDynamic();
}

// User-defined representation editor
class UDR {
  /*::
    static current_index : ?number;
  */
  static setRepresentationIndex (index /*: number */) {
    Group.representation = Group.userRepresentations[index];
    Library.saveGroup(Group);
    displayDynamic();
  }

  static create () {
    Group.userRepresentations.push(Array(Group.order).fill(''))
    Library.saveGroup(Group)
    displayDynamic()
  }

  static edit (index /*: number */) {
    const userRepresentation = Group.userRepresentations[index]
    const $scheme = $('#user-naming-schemes').children().eq(index)
    const rows = $scheme.find('tr').toArray()
    for (const [element, representation] of userRepresentation.entries()) {
      $(rows[element]).append(eval(Template.HTML('user-naming-editor-template')))
    }
    $scheme.find('.user-name-options').hide()
    $scheme.find('.user-name-editing-options').show()
  }

  static closeEdit (index) {
    const userRepresentation = Group.userRepresentations[index]
    const $scheme = $('#user-naming-schemes').children().eq(index)
    const rows = $scheme.find('tr').toArray()
    for (const [element, representation] of userRepresentation.entries()) {
      $(rows[element].children[2]).html(representation)
    }
    $scheme.find('td:has("textarea")').remove()
    $scheme.find('.user-name-options').show()
    $scheme.find('.user-name-editing-options').hide()
  }

  static saveEdit (index) {
    Group.userRepresentations[index] =
      $('#user-naming-schemes').eq(index).find('textarea').toArray().map((textarea) => textarea.value)
    Library.saveGroup(Group);
    UDR.closeEdit(index);
  }

  static showEdit (index) {
    const rows = $('#user-naming-schemes').children().eq(index).find('tr').toArray()
    for (const row of rows) {
      $(row.children[2]).html(row.children[3].children[0].value)
    }
  }

  static remove (index /*: number */) {
    Group.deleteUserRepresentation(index);
    Library.saveGroup(Group);
    displayDynamic();
  }
}

class Notes {
  static display (notes) {
    const notesHtml = (notes.length == 0) ? eval(Template.HTML('notes-no-notes-template')) : $('<div>').html(notes)
    $('#notes-display').html(((notesHtml /*: any */) /*: html */))
  }

  static edit () {
    $('#notes-trailer').hide();
    (($('#notes-textarea')[0] /*: any */) /*: HTMLTextAreaElement */).value = Group.userNotes
    $('#notes-editor').show()
  }

  static showEdit () {
    Notes.display((($('#notes-textarea')[0] /*: any */) /*: HTMLTextAreaElement */).value)
  }

  static closeEdit () {
    $('#notes-editor').hide()
    $('#notes-trailer').show()
    Notes.display(Group.userNotes);
  }

  static saveEdit () {
    Group.userNotes = (($('#notes-textarea')[0] /*: any */) /*: HTMLTextAreaElement */).value;
    Library.saveGroup(Group);
    Notes.closeEdit();
  }
}

function showAllVisualizersSheet () {
    const iso = Group.generators[0].map( g => [ g, g ] );
    CreateNewSheet( [
        {
            className : 'TextElement',
            x : 50, y : 50, w : 800, h : 50,
            text : `All Visualizers for the Group ${Group.name}`,
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
            name : '<i>id</i><sub>1</sub>',
            showInjSurj : true, showManyArrows : true, definingPairs : iso
        },
        {
            className : `MorphismElement`,
            fromIndex : 5, toIndex : 6,
            name : '<i>id</i><sub>2</sub>',
            showInjSurj : true, showManyArrows : true, definingPairs : iso
        }
    ] );
}

function CreateNewSheet (oldJSONArray /*: Array<Obj> */) {
    SheetModel.convertFromOldJSON(oldJSONArray)
    SheetModel.createNewSheet(oldJSONArray)
}
