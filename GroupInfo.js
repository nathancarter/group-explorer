// @flow

import {DEFAULT_SPHERE_COLOR} from './js/AbstractDiagramDisplay.js';
import BasicGroup from './js/BasicGroup.js';
import BitSet from './js/BitSet.js';
import {CayleyDiagramView, createUnlabelledCayleyDiagramView} from './js/CayleyDiagramView.js';
import {CycleGraphView, createUnlabelledCycleGraphView} from './js/CycleGraphView.js';
import GEUtils from './js/GEUtils.js';
import IsomorphicGroups from './js/IsomorphicGroups.js';
import * as Library from './js/Library.js';
import Log from './js/Log.js';
import MathUtils from './js/MathUtils.js';
import Menu from './js/Menu.js';
import {MulttableView, createMinimalMulttableView} from './js/MulttableView.js';
import * as SheetModel from './js/SheetModel.js';
import setUpGAPCells from './js/ShowGAPCode.js';
import {SymmetryObjectView, createStaticSymmetryObjectView} from './js/SymmetryObjectView.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

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

    jQuery.noConflict(true);  // restore jQuery version loaded with app, overwriting version used in sagecell
    setUpGAPCells(Group, $('#basic-facts'));
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
        const $frag = $(document.createDocumentFragment());
        $frag.append(Group.elements.map((el) => Group.representation[el]).join(', '))
        if (Group.representationIsUserDefined) {
            $frag.append('<br>This representation is user-defined; see below.');
        } else {
            $frag.append('<br>This representation was loaded from the group file.');
        }
        $('#default-names > .content').html( (($frag[0] /*: any */) /*: DocumentFragment */) );
    }

    const rowList = (representation) => {
      return Group.elements.map((el) => `${Group.representation[el]} = ${representation[el]} <br>`).join('')
    }

    // Loaded element names
    $('#loaded-names > .content').empty();
    if (Group.representations.length > 1 || Group.representationIsUserDefined) {
        const $frag = Group
              .representations
              .reduce( ($frag, representation, index) => {
                  if (Group.representations[index] != Group.representation) {
                    const scheme = rowList(representation)
                    $frag.append(eval(Template.HTML('loadedSchemeChoice-template')));
                  }
                  return $frag;
              }, $('<ol>') );
        $('#loaded-names > .content').append($frag);
    }

    // User-defined naming schemes
    {
        const $frag = $(document.createDocumentFragment());

        if (Group.userRepresentations.length == 0) {
            $frag.append(eval(Template.HTML('user-names-no-user-defined-names-template')));
        } else {
            $frag.append(
                Group
                    .userRepresentations
                    .reduce( ($frag, representation, index) => {
                        if (Group.userRepresentations[index] == Group.representation) {
                            $frag.append(eval(Template.HTML('user-names-scheme-in-use-template')));
                        } else {
                          const scheme = rowList(representation)
                          $frag.append(eval(Template.HTML('user-names-choice-template')));
                        }
                        return $frag;
                    }, $('<ol>') ) );
        }
        $frag.append(eval(Template.HTML('user-names-trailer-template')));
        $('#user-names > .content').empty().append($frag);
    }

    // Hide naming schemes the first time the page is displayed,
    //   but not when it is re-displayed after, e.g., changing the default naming scheme
    if (first_time_through) {
        $('#naming-schemes > .content').hide();
    }
}

function displayNotes () {
    const first_time_through = ($('#notes > .content').text().length == 0);
    Notes.show();
    // Hide notes the first time the page is displayed,
    //   but not after re-displaying the page after, e.g., editing the notes
    if (first_time_through) {
        $('#notes > .toggled').hide();
    }
}

// find the nearest ancestor with an 'action' attribute and execute (eval) the action (if it exists)
//   note that this requires that any function name referenced in the action be available to this routine
//   many have to be exported/imported from the XXXInfo.js modules where they are defined
function actionClickHandler(event /*: MouseEvent */) {
    const $action = $(event.target).closest('[action]');
    if ($action.length != 0) {
        event.preventDefault();
        event.stopPropagation();
        eval($action.attr('action'));
    }
}

function setRep(index /*: number */) {
    Group.representation = Group.representations[index];
    Library.saveGroup(Group);
    displayDynamic();
}

// User-defined representation editor
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

    static _showEditor(representation /*: Array<html> */) {
        const editor = $(eval(Template.HTML('udr-editor-template')));
        const tableBody = editor.find('tbody');
        representation.forEach( (rep, inx) => tableBody.append(eval(Template.HTML('udr-edit-item-template'))) );
        $('body').append(editor).find('#udr-editor').show();
    }

    static closeEdit() {
        UDR.current_index = undefined;
        $('#udr-editor').remove();
    }

    static saveEdit() {
        Group.userRepresentations[((UDR.current_index /*: any */) /*: number */)] =
            $('#udr-edit-table tbody textarea').map((_, el) => ((el /*: any */) /*: HTMLTextAreaElement */).value).toArray();
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
        const $frag = $(document.createDocumentFragment());
        if (Group.userNotes.length == 0) {
            $frag.append(eval(Template.HTML('notes-no-notes-template')));
        } else {
            $frag.append($('<div>').text(Group.userNotes));
        }
        $frag.append(eval(Template.HTML('notes-trailer-template')));
        $('#notes > .content').empty().append($frag);
    }

    static edit() {
        const editor = $(eval(Template.HTML('notes-editor-template')));
        $('body').append(editor).find('#notes-editor').show();
    }

    static clear() {
        (($('#notes-textarea')[0] /*: any */) /*: HTMLTextAreaElement */).value = '';
    }

    static close() {
        $('#notes-editor').remove();
        Notes.show();
    }

    static save() {
        Group.userNotes = (($('#notes-textarea')[0] /*: any */) /*: HTMLTextAreaElement */).value;
        Library.saveGroup(Group);
        Notes.close();
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
