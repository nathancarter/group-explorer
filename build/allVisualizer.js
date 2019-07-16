// @flow
/*::
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import AbstractSubset from './AbstractSubset.js';
import ConjugacyClasses from './ConjugacyClasses.js';
import Cosets from './Cosets.js';
import OrderClasses from './OrderClasses.js';
import AbstractPartition from './AbstractPartition.js';
import PartitionSubset from './PartitionSubset.js';
import Subgroup from './Subgroup.js';
import SubsetEditor from './SubsetEditor.js';
import Subset from './Subset.js';

var group: XMLGroup;

export default
 */
class SSD {
/*::
   static subsetsURL: string;
   static nextId: number;
   static nextSubsetIndex: number;
   static displayList: Array<AbstractSubset>;

   static AbstractSubset: Class<AbstractSubset>;
   static ConjugacyClasses: Class<ConjugacyClasses>;
   static Cosets: Class<Cosets>;
   static OrderClasses: Class<OrderClasses>;
   static AbstractPartition: Class<AbstractPartition>;
   static PartitionSubset: Class<PartitionSubset>;
   static Subgroup: Class<Subgroup>;
   static SubsetEditor: Class<SubsetEditor>;
   static Subset: Class<Subset>;
 */
   static _init() {
      SSD.subsetsURL = './subsetDisplay/subsets.html';
   }

   static clearMenus() {
      $('#subset_page .highlighted').removeClass('highlighted');
      $('#subset_page .menu:visible').remove();
      $('#subset_page .elements').remove();
   }

   /* Load, initialize subset display */
   static load($subsetWrapper /*: JQuery */) /*: Promise<void> */ {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: SSD.subsetsURL,
                   success: (data /*: string */) => {
                      $subsetWrapper.html(data);
                      SSD.setup_subset_page();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${SSD.subsetsURL} ${err === undefined ? '' : ': ' + err}`);
                   }
         } )
      } )
   }

   static setup_subset_page() {
      // Initialize list of all displayed subsets
      SSD.nextId = 0;
      SSD.nextSubsetIndex = 0;
      SSD.displayList = [];

      // clear displayed menus, highlighting
      SSD.clearMenus();

      // Register event handlers
      $(window).off('click', SSD.clearMenus).on('click', SSD.clearMenus)
               .off('contextmenu', SSD.clearMenus).on('contextmenu', SSD.clearMenus);
      $('#subset_page').off('contextmenu', SSD.contextMenuHandler).on('contextmenu', SSD.contextMenuHandler)
                       .off('dblclick', SSD.dblClickHandler).on('dblclick', SSD.dblClickHandler);

      // clear out displayed lists; show '(None)' placeholders
      $('ul.subset_page_content li').remove();
      $('p.placeholder').show();

      // Display all subgroups
      SSD.Subgroup.displayAll();
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'subset_page']);
   }

   /*
    * Double-click displays elements in subset
    */
   static dblClickHandler(_event /*: JQueryEventObject */ ) {
      const event = ((_event /*: any */) /*: JQueryMouseEventObject */);
      event.preventDefault();
      SSD.clearMenus();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[parseInt(id)];
         const subsetName = subset.name;
         const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
         const $menu = $(eval(Template.HTML('subsetElements_template')));
         $curr.addClass('highlighted').append($menu);
         event.stopPropagation();
         const follow = () => {
            const bounds /*: Array<ClientRect> */ =
                  $menu.find('span.mjx-chtml').map( (_, span) => span.getBoundingClientRect() ).toArray();
            const extrema /*: {leftmost: number, rightmost: number} */ =
                  bounds.reduce( (lr /*: {leftmost: number, rightmost: number} */, rect /*: ClientRect */) => {
                     return {leftmost: Math.min(lr.leftmost, rect.left), rightmost: Math.max(lr.rightmost, rect.right)}
                  }, {leftmost: Number.MAX_SAFE_INTEGER, rightmost: Number.MIN_SAFE_INTEGER} );
            $menu.css({'width': extrema.rightmost - extrema.leftmost, 'max-width': ''});
            Menu.setMenuLocations(event, $menu);
            $menu.css('visibility', 'visible');
         };
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, $menu[0]], follow);
      }
   }

   /*
    * Left-click executes "action" attribute in menu item
    */
   static menuClickHandler(event /*: JQueryEventObject */) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         eval($curr.attr('action'));
         SSD.clearMenus();
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'subset_page']);
      }
   }

   /*
    * Right-click displays context menu according to
    *   -- target class (subset_page_header or placeholder)
    *   -- li element id (<subset>.menu)
    */
   static contextMenuHandler(_event /*: JQueryEventObject */) {
      const event = ((_event /*: any */) /*: JQueryMouseEventObject */);

      event.preventDefault();
      const $curr = $(event.target).closest('p.subset_page_header, p.placeholder, li[id]');

      // unrecognized event
      if ($curr.length == 0) return;

      SSD.clearMenus();

      const isHeaderMenu = $curr[0].tagName == "P";
      const $menu = isHeaderMenu ?
                    $(eval(Template.HTML('headerMenu_template'))) :
                    SSD.displayList[parseInt($curr[0].id)].menu;
      $menu.on('click', SSD.menuClickHandler);
      $curr.addClass('highlighted').append($menu);
      $menu.css('visibility', 'hidden');
      event.stopPropagation();

      const follow = () => {
         if (!isHeaderMenu) {
            SSD._makeLongLists($curr[0].id, $menu);
         }
         Menu.setMenuLocations(event, $menu);
         $menu.css('visibility', 'visible');
      };
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, $menu[0]], follow);
   }

   static _makeLongLists(_id /*: string */, $menu /*: JQuery */) {
      const id = parseInt(_id);
      const classes = ['.intersection', '.union', '.elementwise-product'];
      const operations = ['intersection', 'union', 'elementwiseProduct'];
      const printOps = ['intersection', 'union', 'elementwise product'];
      const node = MathML.sans(SSD.displayList[id].name);
      for (let inx = 0; inx < classes.length; inx++) {
         const operation = operations[inx];
         const printOp = printOps[inx];
         let frag = '';
         for (let otherId = 0; otherId < group.subgroups.length; otherId++) {
            if (id != otherId) {
               frag +=
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `the ${printOp} of ${node} with ${MathML.sans(SSD.displayList[otherId].name)}</li>`;
            }
         }
         for (let otherId = group.subgroups.length; otherId < SSD.displayList.length; otherId++) {
            if (id != otherId && SSD.displayList[otherId] !== undefined) {
               const otherName = $(`#${otherId}`).children()[1].outerHTML;
               frag +=
                  `<li action="SSD.displayList[${id}].${operation}(SSD.displayList[${otherId}])">` +
                  `the ${printOp} of ${node} with ${otherName}</li>`;
            }
         }
         $menu.find(classes[inx]).html(frag);
      }
   }
}

SSD._init();
// @flow
/*
 * SSD.AbstractSubset --
 *   Direct superclass of SSD.Subgroup, SSD.Subset, and SSD.Partition
 *   Assigns an id to every element displayed in the subsetDisplay,
 *     and adds it to SSD.displayList
 *   Implements set operations unions, intersection, and elementwise product
 *
 *   Subclasses must implement name, elements, displayLine, and menu properties
 *     name - subset name for display (e.g., "H₂" or "S₃")
 *     elements - elements of subset (as bitset)
 *     displayLine - line for this subset in display (e.g., "H₁ = < f > is a subgroup of order 2.")
 *     menu - context menu brought up by this element in display
 *
 *   (AbstractSubset would be an abstract superclass in another language.)
 */
/*::
import BitSet from '../js/BitSet.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.AbstractSubset = class AbstractSubset {
/*::
   id: number;
   elements: BitSet;
  +name: string;	// implemented in subclass
  +menu: JQuery;	// implemented in subclass
  +displayLine: string; // implemented in subclass
 */  
   constructor() {
      this.id = SSD.nextId++;
      SSD.displayList[this.id] = this;
   }

   get closure() /*: SSD.Subset */ {
      return new SSD.Subset(group.closure(this.elements));
   }

   // delete is a javascript keyword...
   destroy() {
      delete(SSD.displayList[this.id]);
      $(`#${this.id}`).remove();
   }


   /*
    * Operations that create new SSD.Subsets by performing
    *   union, intersection, and elementwise product on this set
    */
   union(other /*: SSD.AbstractSubset */) /* SSD.Subset */ {
      return new SSD.Subset(BitSet.union(this.elements, other.elements));
   }

   intersection(other /*: SSD.AbstractSubset */) /*: SSD.Subset */ {
      return new SSD.Subset(BitSet.intersection(this.elements, other.elements));
   }

   elementwiseProduct(other /*: SSD.AbstractSubset */) /*: SSD.Subset */{
      const newElements = new BitSet(group.order);
      for (let i = 0; i < this.elements.len; i++) {
         if (this.elements.isSet(i)) {
            for (let j = 0; j < other.elements.len; j++) {
               if (other.elements.isSet(j)) {
                  newElements.set(group.multtable[i][j]);
               }
            }
         }
      }
      return new SSD.Subset(newElements);      
   }

   get elementString() /*: string */ {
      return '[' + this.elements.toString() + ']';
   }
}
// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import SubgroupFinder from '../js/SubgroupFinder.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.Subgroup = class Subgroup extends SSD.AbstractSubset {
/*::
   subgroupIndex: number;
  +normalizer: SSD.Subset;
  +leftCosets: SSD.Cosets;
  +rightCosets: SSD.Cosets;
 */
   constructor(subgroupIndex /*: number */) {
      super();

      this.subgroupIndex = subgroupIndex;
      this.elements = group.subgroups[subgroupIndex].members;
   }

   get name() {
      return MathML.sub('H', this.subgroupIndex);
   }

   get displayLine() {
      const generators = group.subgroups[this.subgroupIndex].generators.toArray()
                               .map( el => group.representation[el] );
      let templateName;
      switch (this.subgroupIndex) {
         case 0:
            templateName = 'firstSubgroup_template';	break;
         case group.subgroups.length - 1:
            templateName = 'lastSubgroup_template';	break;
         default:
            templateName = 'subgroup_template';	break;
      }
      return eval(Template.HTML(templateName));
   }

   get menu() {
      const $menu = $(eval(Template.HTML('subgroupMenu_template')));
      $('template.subgroup-extension').each( (_, template) => $menu.append(eval('`' + $(template).html() + '`')) );
      return $menu;
   }

   get normalizer() {
      return new SSD.Subset(
         new SubgroupFinder(group)
            .findNormalizer(group.subgroups[this.subgroupIndex]).members );
   }

   get leftCosets() {
      return new SSD.Cosets(this, 'left');
   }

   get rightCosets() {
      return new SSD.Cosets(this, 'right');
   }

   static displayAll() {
      $('#subgroups').html('').append(
         group.subgroups.reduce( (frag, _, inx) => frag.append(new SSD.Subgroup(inx).displayLine),
                                 $(document.createDocumentFragment()) ));
   }
}
// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.Subset = class Subset extends SSD.AbstractSubset {
/*::
   subsetIndex: number;
 */
   constructor(elements /*: void | Array<groupElement> | BitSet */) {
      super();

      if (elements === undefined) {
         this.elements = new BitSet(group.order);
      } else if (Array.isArray(elements)) {
         this.elements = new BitSet(group.order, elements);
      } else {
         this.elements = elements;
      }
      this.subsetIndex = SSD.nextSubsetIndex++;
      $('#subsets_placeholder').hide();
      $('#subsets').append(this.displayLine).show();
   }

   get name() /*: mathml */ {
      return MathML.sub('S', this.subsetIndex);
   }

   get displayLine() /*: html */ {
      const numElements = this.elements.popcount();
      let items = this.elements
                      .toArray()
                      .slice(0, 3)
                      .map( (el) => group.representation[el] );
       if (numElements > 3) {
         items.push('<mtext>...</mtext>');
      }
      return eval(Template.HTML('subset_template'));
   }

   get menu() {
      const $menu = $(eval(Template.HTML('subsetMenu_template')));
      $('template.subset-extension').each( (_, template) => $menu.append(eval('`' + $(template).html() + '`')) );
      return $menu;
   }

   destroy() {
      super.destroy();
      if ($('#subsets li').length == 0) {
         $('#subsets_placeholder').show();
      }
   }

   static nextName() /*: string */ {
      return MathML.sub('S', SSD.nextSubsetIndex);
   }
}
// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.SubsetEditor = class SubsetEditor {
   static open(displayId /*: number */) {
      const subset = displayId === undefined ? undefined : SSD.displayList[displayId];
      const elements = subset === undefined ? new BitSet(group.order) : subset.elements;
      const setName = subset === undefined ? SSD.Subset.nextName() : subset.name;
      const $subsetEditor = $('body').append(eval(Template.HTML('subsetEditor_template')))
                                     .find('#subset_editor').show();
      $subsetEditor.find('.ssedit_setName').html(setName);
      $subsetEditor.find('#ssedit_cancel_button').on('click', SSD.SubsetEditor.close);
      $subsetEditor.find('#ssedit_ok_button').on('click', SSD.SubsetEditor.accept);
      $subsetEditor.find('.ssedit_panel_container').on('dragover', (ev /*: JQueryEventObject */) => ev.preventDefault());
      $subsetEditor.find('#ssedit_elementsIn_container').on('drop', SSD.SubsetEditor.addElement);
      $subsetEditor.find('#ssedit_elementsNotIn_container').on('drop', SSD.SubsetEditor.removeElement);

      for (const el of group.elements) {
         const elementHTML =
            `<li element=${el} draggable="true">${MathML.sans(group.representation[el])}</li>`;
         const listName = elements.isSet(el) ? 'elementsIn' : 'elementsNotIn';
         $(elementHTML).appendTo($subsetEditor.find(`#${listName}`))
                       .on('dragstart', (event /*: JQueryEventObject */) => {
                          const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
                          if (dragEvent.dataTransfer != undefined) {
                             dragEvent.dataTransfer.setData("text", el.toString());
                          }
                       });
      }

      MathJax.Hub.Queue(['Typeset', MathJax.Hub, "subset_editor"]);
   }

   // Create new subset from elementsIn list, make sure it's formatted, and close editor
   static accept() {
      new SSD.Subset(
         $('#elementsIn > li')
            .map( (_, el) => parseInt($(el).attr('element')) )
            .toArray()
      );
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'subsets']);
      SubsetEditor.close()
   }

   static close() {
      $('#subset_editor').remove();
   }

   static addElement(event /*: JQueryEventObject */) {
      event.preventDefault();
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      if (dragEvent != undefined && dragEvent.dataTransfer != undefined) {
         const element = dragEvent.dataTransfer.getData("text");
         $(`#elementsNotIn li[element=${element}]`).detach().appendTo($(`#elementsIn`));
      }
   }

   static removeElement(event /*: JQueryEventObject */) {
      event.preventDefault();
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      if (dragEvent != undefined && dragEvent.dataTransfer != undefined) {
         const element = dragEvent.dataTransfer.getData("text");
         $(`#elementsIn li[element=${element}]`).detach().appendTo($(`#elementsNotIn`));
      }
   }
}
// @flow
/*::
import MathML from '../js/MathML.js';

import SSD from './subsets.js';

export default
 */
SSD.AbstractPartition = class AbstractPartition {
/*::
  +destroy: () => void;   
  +name: string;
   subsets: Array<SSD.PartitionSubset>;
  +allElementString: string;
 */   
   constructor() {
      this.subsets = [];
   }

   get name() {
      return MathML.setList([this.subsets[0].name, '<mtext>...</mtext>', this.subsets[this.subsets.length - 1].name]);
   }

   destroy() {
      this.subsets.forEach( (subset) => subset.destroy() );
      if ($('#partitions li').length == 0) {
         $('#partitions_placeholder').show();
      }
   }

   get allElementString() {
      return '[[' + this.subsets.map( (el) => el.elements.toString() ).join('],[') + ']]';
   }
}
// @flow
/*::
import BitSet from '../js/BitSet.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.PartitionSubset = class PartitionSubset extends SSD.AbstractSubset {
/*::
   parent: SSD.AbstractPartition;
   subIndex: number;
   elements: BitSet;
   name: string;
   partitionClass: string;
  +elementRepresentations: Array<string>;
 */
   constructor(parent /*: SSD.AbstractPartition */,
               subIndex /*: number */,
               elements /*: BitSet */,
               name /*: string */,
               partitionClass /*: string */) {
      super();

      this.parent = parent;
      this.subIndex = subIndex;
      this.elements = elements;
      this.name = name;
      this.partitionClass = partitionClass;
   }

   get elementRepresentations() {
      const result = [];
      for (let i = 0; i < this.elements.len && result.length < 3; i++) {
         if (this.elements.isSet(i)) {
            result.push(group.representation[i]);
         }
      }
      if (this.elements.popcount() > 3) {
         result.push('<mtext>...</mtext>');
      }
      return result;
   }

   get menu() {
      const $menu = $(eval(Template.HTML('partitionMenu_template')));
      $('template.partition-extension').each( (_, template) => $menu.append(eval('`' + $(template).html() + '`')) );
      return $menu;
   }

   get displayLine() /*: html */ {
      return eval(Template.HTML(this.partitionClass + '_template'));
   }
}
// @flow
/*::
import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.OrderClasses = class OrderClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = group
         .orderClasses
         .filter( (orderClass) => orderClass.popcount() != 0 )
         .map( (orderClass, inx) => 
            new SSD.PartitionSubset(this, inx, orderClass, MathML.sub('OC', inx), 'orderClass')
         );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $('#partitions li.orderClass').remove();
      super.destroy();
   }
}
// @flow
/*::
import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = group.conjugacyClasses.map( (conjugacyClass, inx) =>
         new SSD.PartitionSubset(this, inx, conjugacyClass, MathML.sub('CC', inx), 'conjugacyClass') );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $('#partitions li.conjugacyClass').remove();
      super.destroy();
   }
}
// @flow
/*::
import MathML from '../js/MathML.js';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.Cosets = class Cosets extends SSD.AbstractPartition {
/*::
  subgroup: SSD.Subgroup;
  isLeft: boolean;
  side: string;
 */
   constructor(subgroup /*: SSD.Subgroup */, side /*: string */) {
      super();

      this.subgroup = subgroup;
      this.isLeft = side == 'left';
      this.side = side;

      this.subsets = group
         .getCosets(this.subgroup.elements, this.isLeft)
         .map( (coset, inx) => {
            const rep = group.representation[((coset.first() /*: any */) /*: groupElement */)];
            const name = this.isLeft ?
                         MathML.sans(rep) + MathML.sans(this.subgroup.name) :
                         MathML.sans(this.subgroup.name) + MathML.sans(rep);
            return new SSD.PartitionSubset(this, inx, coset, name, 'cosetClass');
         } );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $(`#partitions li.${this.side}coset${this.subgroup.subgroupIndex}`).remove();
      super.destroy();
   }
}
// @flow
/*::
import Arrow from './Arrow.js';
import ArrowMult from './ArrowMult.js';
import Chunking from './Chunking.js';
import DiagramChoice from './DiagramChoice.js';
import Generator from './Generator.js';

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
   static clearMenus() {
      $('#diagram-page .highlighted').removeClass('highlighted');
      $('#diagram-page .menu:visible').remove();
      $('#remove-arrow-button').prop('disabled', true);
      $('#diagram-choices').hide();
      $('#chunk-choices').hide();
   }

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
      $(window).off('click', DC.clearMenus).on('click', DC.clearMenus)
               .off('contextmenu', DC.clearMenus).on('contextmenu', DC.clearMenus);

      DC.DiagramChoice.setupDiagramSelect();
      $('#diagram-select').off('click', DC.DiagramChoice.clickHandler).on('click', DC.DiagramChoice.clickHandler);

      $('#arrow-control').off('click', DC.Arrow.clickHandler).on('click', DC.Arrow.clickHandler);

      $('#generation-control').off('click', DC.Generator.clickHandler).on('click', DC.Generator.clickHandler);
      $('#generation-control').off('contextmenu', DC.Generator.clickHandler).on('contextmenu', DC.Generator.clickHandler);
      $('#generation-table').off('dragstart', DC.Generator.dragStart).on('dragstart', DC.Generator.dragStart);
      $('#generation-table').off('drop', DC.Generator.drop).on('drop', DC.Generator.drop);
      $('#generation-table').off('dragover', DC.Generator.dragOver).on('dragover', DC.Generator.dragOver);

      $('#chunk-select').off('click', DC.Chunking.clickHandler).on('click', DC.Chunking.clickHandler);
   }

   static update() {
      DC.Generator.draw();
      DC.Arrow.updateArrows();
      DC.Chunking.updateChunkingSelect();
   }
}

DC.DIAGRAM_PANEL_URL = 'diagramController/diagram.html';
// @flow
/*::
import BitSet from '../js/BitSet.js';
import CayleyDiagram from '../js/CayleyDiagram.js';
import type {layout, direction, StrategyArray} from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import DC from './diagram.js';

var emitStateChange: () => void;
var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;
var group: XMLGroup;

export default
 */
DC.Generator = class {
/*::
   static axis_label: Array<[string, string, string]>;
   static axis_image: Array<[string, string, string]>;
   static orders: Array<Array<string>>;
 */
   static clickHandler(event /*: JQueryEventObject */) {
      event.preventDefault();

      // check if disabled
      if (DC.Generator.isDisabled()) {
         return;
      }
      eval($($(event.target).closest('[action]')).attr('action'));
      event.stopPropagation();
   }

   static draw() {
      if (DC.Generator.isDisabled()) {
         return;
      }

      // clear table
      const $generation_table = $('#generation-table');
      $generation_table.children().remove();

      // add a row for each strategy in Cayley diagram
      const num_strategies = Cayley_diagram.strategies.length;
      if (num_strategies == 0) {
         $('#generation-table').html(
            '<tr style="height: 3em"><td></td><td style="width: 25%"></td><td style="width: 40%"></td><td></td></tr>');
      } else {
         Cayley_diagram.strategies.forEach( (strategy, inx) =>
            $generation_table.append($(eval(Template.HTML('generation-template')))) );
         MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'generation-table']);
      }
   }

   static showGeneratorMenu(event /*: JQueryEventObject */, strategy_index /*: number */) {
      DC.clearMenus();
      const $generator_menu = DC.Generator.getGenericMenu();

      // show only elements not generated by previously applied strategies
      const eligible = ( (strategy_index == 0) ?
                         new BitSet(group.order, [0]) :
                         Cayley_diagram.strategies[strategy_index-1].bitset.clone() )
         .complement().toArray();

      $generator_menu.prepend(
         ...eligible.map( (generator) =>
            $(eval(Template.HTML('generator-menu-item-template')))
               .html(MathML.sans(group.representation[generator])) )
      );

      $('#generation-table').append($generator_menu);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'generation-list']);
      DC.Generator._typesetMenu(event, $generator_menu);
   }

   static _typesetMenu(_event /*: JQueryEventObject */, $menu /*: JQuery */) {
      const event = ((_event /*: any */) /*: JQueryMouseEventObject */);
      $menu.css('visibility', 'hidden');
      const showMenu = () => { Menu.setMenuLocations(event, $menu);
                               $menu.css('visibility', 'visible');
                             };
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, $menu[0]], showMenu);
   }

   static showAxisMenu(event /*: JQueryEventObject */, strategy_index /*: number */) {
      DC.clearMenus();

      // previously generated subgroup must have > 2 cosets in this subgroup
      //   in order to show it in a curved (circular or rotated) layout
      const curvable =
         (Cayley_diagram.strategies[strategy_index].bitset.popcount()
            /  ((strategy_index == 0) ? 1 : Cayley_diagram.strategies[strategy_index - 1].bitset.popcount()))
      > 2;

      const $layout_menu = DC.Generator.getGenericMenu()
                             .prepend($(eval(Template.HTML('axis-menu-template'))));

      $('#generation-table').append($layout_menu);
      DC.Generator._typesetMenu(event, $layout_menu);
   }

   static showOrderMenu(event /*: JQueryEventObject */, strategy_index /*: number */) {
      DC.clearMenus();
      const $order_menu = DC.Generator.getGenericMenu();

      const num_strategies = Cayley_diagram.strategies.length;
      $order_menu.prepend(
         ...Array.from({length: Cayley_diagram.strategies.length},
                       (_,order) => $(eval(Template.HTML('order-menu-item-template')))));

      $('#generation-table').append($order_menu);
      DC.Generator._typesetMenu(event, $order_menu);
   }

   static getGenericMenu() {
      const $menu = $(eval(Template.HTML('generation-menu-template')));

      const $organize_by_menu = $menu.find('#generation-organize-menu');

      // for each non-trivial subgroup
      group.subgroups
           .forEach( (subgroup, inx) => {
              if (subgroup.order != 1 && subgroup.order != group.order) {
                 $organize_by_menu.append($(eval(Template.HTML('organize-menu-item-template'))));
              }
           } )

      return $menu;
   }

   static organizeBy(subgroup_index /*: number */) {
      // get subgroup generators
      const subgroup_generators = group.subgroups[subgroup_index].generators.toArray();

      // add subgroup generator(s) to start of strategies
      for (let g = 0; g < subgroup_generators.length; g++) {
         DC.Generator.updateGenerator(g, subgroup_generators[g]);
         DC.Generator.updateOrder(g, g);
      }
   }

   static updateGenerator(strategy_index /*: number */, generator /*: number */) {
      const strategies = Cayley_diagram.getStrategies();
      strategies[strategy_index][0] = generator;
      DC.Generator.updateStrategies(strategies);
   }

   static updateAxes(strategy_index /*: number */, layout /*: layout */, direction /*: direction */) {
      const strategies = Cayley_diagram.getStrategies();
      strategies[strategy_index][1] = layout;
      strategies[strategy_index][2] = direction;
      DC.Generator.updateStrategies(strategies);
   }

   static updateOrder(strategy_index /*: number */, order /*: number */) {
      const strategies = Cayley_diagram.getStrategies();
      const other_strategy = strategies.findIndex( (strategy) => strategy[3] == order );
      strategies[other_strategy][3] = strategies[strategy_index][3];
      strategies[strategy_index][3] = order;
      DC.Generator.updateStrategies(strategies);
   }

   // Remove redundant generators, check whether there are enough elements to use curved display
   static refineStrategies(strategies /*: StrategyArray */) {
      const generators_used = new BitSet(group.order);
      let elements_generated = new BitSet(group.order, [0]);
      strategies = strategies.reduce( (nonRedundantStrategies, strategy) => {
         if (!elements_generated.isSet(strategy[0])) {
            const old_size = elements_generated.popcount();
            generators_used.set(strategy[0]);
            elements_generated = group.closure(generators_used);
            const new_size = elements_generated.popcount();

            if (strategy[1] != 0 && new_size / old_size < 3) {
               strategy[1] = 0;
            }

            nonRedundantStrategies.push(strategy);
         }
         return nonRedundantStrategies;
      }, []);

      // fix nesting order
      strategies.slice().sort( (a,b) => a[3] - b[3] ).map( (el,inx) => (el[3] = inx, el) );

      // add elements to generate entire group; append to nesting
      if (elements_generated.popcount() != group.order) {
         // look for new element -- we know one exists
         const new_generator = ((elements_generated
            .complement()
            .toArray()
            .find( (el) => group.closure(generators_used.clone().set(el)).popcount() == group.order ) /*: any */) /*: groupElement */);
         // among linear layouts, try to find a direction that hasn't been used yet
         const unused_direction =
            strategies.reduce( (unused_directions, [_, layout, direction, __]) => {
               if (layout == 0) {
                  unused_directions.clear(direction);
               }
               return unused_directions;
            }, new BitSet(3).setAll() )
               .first();
         const new_direction = (unused_direction == undefined) ? 0 : unused_direction;
         strategies.push([new_generator, 0, ((new_direction /*: any */) /*: direction */), strategies.length]);
      }

      return strategies;
   }

   static updateStrategies(new_strategies /*: StrategyArray */) {
      const strategies = DC.Generator.refineStrategies(new_strategies);
      Cayley_diagram.setStrategies(strategies);
      Cayley_diagram.removeLines();
      DC.Arrow.getAllArrows().forEach( (arrow) => Cayley_diagram.addLines(arrow) );
      Cayley_diagram.setLineColors();
      DC.Generator.draw();
      DC.Chunking.updateChunkingSelect();
      Graphic_context.showGraphic(Cayley_diagram);
      emitStateChange();
   }

   // Drag-and-drop generation-table rows to re-order generators
   static dragStart(event /*: JQueryEventObject */) {
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      const target = ((event.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dragEvent.dataTransfer /*: any */) /*: DataTransfer */);
      dataTransfer.setData('text/plain', target.textContent);
   }

   static drop(event /*: JQueryEventObject */) {
      event.preventDefault();
      const dragEvent = ((event.originalEvent /*: any */) /*: DragEvent */);
      const target = ((event.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dragEvent.dataTransfer /*: any */) /*: DataTransfer */);
      const dest = parseInt(target.textContent);
      const src = parseInt(dataTransfer.getData('text/plain'));
      const strategies = Cayley_diagram.getStrategies()
      strategies.splice(dest-1, 0, strategies.splice(src-1, 1)[0]);
      DC.Generator.updateStrategies(strategies);
   }

   static dragOver(event /*: JQueryEventObject */) {
      event.preventDefault();
   }

   static enable() {
      $('#generation-fog').hide();
   }

   static disable() {
      const $generation_fog = $('#generation-fog');
      $generation_fog.css('height', '100%');
      $generation_fog.css('width', '100%');
      $('#generation-fog').show();
   }

   static isDisabled() {
      return $('#generation-fog').css('display') != 'none';  // fog is hidden
   }
}

// layout (linear/circular/rotated), direction (X/Y/Z)
DC.Generator.axis_label = [
   [MathML.sans('<mtext>Linear in&nbsp;</mtext><mi>x</mi>'),
    MathML.sans('<mtext>Linear in&nbsp;</mtext><mi>y</mi>'),
    MathML.sans('<mtext>Linear in&nbsp;</mtext><mi>z</mi>')],
   [MathML.sans('<mtext>Circular in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>'),
    MathML.sans('<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>'),
    MathML.sans('<mtext>Circular in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>')],
   [MathML.sans('<mtext>Rotated in&nbsp;</mtext><mi>y</mi><mo>,</mo><mi>z</mi>'),
    MathML.sans('<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>z</mi>'),
    MathML.sans('<mtext>Rotated in&nbsp;</mtext><mi>x</mi><mo>,</mo><mi>y</mi>')],
];

DC.Generator.axis_image = [
   ['axis-x.png', 'axis-y.png', 'axis-z.png'],
   ['axis-yz.png', 'axis-xz.png', 'axis-xy.png'],
   ['axis-ryz.png', 'axis-rxz.png', 'axis-rxy.png']
];

// wording for nesting order
DC.Generator.orders = [
   [],
   [MathML.sans('<mtext>N/A</mtext>')],
   [MathML.sans('<mtext>inside</mtext>'),
    MathML.sans('<mtext>outside</mtext>')],
   [MathML.sans('<mtext>innermost</mtext>'),
    MathML.sans('<mtext>middle</mtext>'),
    MathML.sans('<mtext>outermost</mtext>')],
   [MathML.sans('<mtext>innermost</mtext>'),
    MathML.sans('<mtext>second innermost</mtext>'),
    MathML.sans('<mtext>second outermost</mtext>'),
    MathML.sans('<mtext>outermost</mtext>')],
   [MathML.sans('<mtext>innermost</mtext>'),
    MathML.sans('<mtext>second innermost</mtext>'),
    MathML.sans('<mtext>middle</mtext>'),
    MathML.sans('<mtext>second outermost</mtext>'),
    MathML.sans('<mtext>outermost</mtext>')]
];
// @flow
/*::
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import DC from './diagram.js';

var displayGraphic: () => void;
var group: XMLGroup;
var Diagram_name: ?string;

export default
 */
DC.DiagramChoice = class {
   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      $('#diagram-choices').html(eval(Template.HTML('diagram-select-first-template'))).hide();
      group.cayleyDiagrams.forEach( (diagram, index) => {
         $('#diagram-choices').append(eval(Template.HTML('diagram-select-other-template'))).hide();
      } );
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'diagram-choices'], () => DC.DiagramChoice._showChoice());
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = group.cayleyDiagrams.findIndex( (cd) => cd.name == Diagram_name );
      $('#diagram-choice')
         .html($(`#diagram-choices > li:nth-of-type(${index+2})`).html())
         .show();
   }

   /* Display control routines */
   static clickHandler(event /*: JQueryEventObject */) {
      event.preventDefault();

      const $curr = $(event.target).closest('[action]');
      if ($curr != undefined) {
         eval($curr.attr('action'));
         event.stopPropagation();
      }
   }

   static selectDiagram(diagram /*: ?string */, andDisplay /*:: ?: boolean */ = true) {
      Diagram_name = (diagram == undefined) ? undefined : diagram;
      DC.Generator.enable();
      DC.Chunking.enable();
      DC.DiagramChoice._showChoice();

      if ( andDisplay ) displayGraphic();
   }
}
// @flow
/* This class brings together the functions used in managing the "Show these arrows:" arrow-list display and its side effects

   The central actions here are to add and remove arrows from the arrow-list display and the Cayley diagram

   Adding an arrow is done by left-clicking the 'Add' button, which display a menu of addable arrows (those not already in the diagram)
   and then left-clicking an arrow to add from the menu. Left-clicking anywhere else in the window will remove the menu.

   Removing an arrow is done by left-clicking one of the lines in the arrow-list display to highlight it,
   and then left-clicking the 'Remove' button to remove it.

   All of these events are fielded by a single event handler, Arrow.clickHandler(), which
 */
/*::
import MathML from '../js/MathML.js';
import Template from '../js/Template.js';
import Menu from '../js/Menu.js';
import XMLGroup from '../js/XMLGroup.js';
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';

import DC from './diagram.js';

// globals implemented in CayleyDiagram.js
var group: XMLGroup;
var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;
var emitStateChange: () => void;

export default
 */
DC.Arrow = class {
   // actions:  show menu; select from menu; select from list; remove
   // utility function add_arrow_list_item(element) to add arrow to list (called from initialization, select from menu)
   // utility function clearArrowList() to remove all arrows from list (called during reset)

   // arrow-control click handler
   //   find closest element with action and execute action
   static clickHandler(event /*: JQueryEventObject */) {
      event.stopPropagation();
      eval($(event.target).closest('[action]').attr('action'));
   }

   // Row selected in arrow-list:
   //   clear all highlights
   //   highlight row (find arrow-list item w/ arrow = ${element})
   //   enable remove button
   static selectArrow(element /*: number */) {
      $('#arrow-list li').removeClass('highlighted');
      $(`#arrow-list li[arrow=${element}]`).addClass('highlighted');
      $('#remove-arrow-button').attr('action', `DC.Arrow.removeArrow(${element})`);
      $('#remove-arrow-button').prop('disabled', false);
   }

   // returns all arrows displayed in arrow-list as an array
   static getAllArrows() /*: Array<number> */ {
      return $('#arrow-list li').toArray().map( (list_item /*: HTMLLIElement */) => parseInt(list_item.getAttribute('arrow')) );
   }

   // Add button clicked:
   //   Clear (hidden) menu
   //   Populate menu (for each element not in arrow-list)
   //   Position, expose menu
   static showArrowMenu(event /*: JQueryMouseEventObject */) {
      DC.clearMenus();
      const $menu = $(eval(Template.HTML('arrow-menu-template')));
      group.elements.forEach( (element) => {
         if (element != 0 && $(`#arrow-list li[arrow=${element}]`).length == 0) {
            $menu.append(
               $(eval(Template.HTML('arrow-menu-item-template')))
                  .html(MathML.sans(group.representation[element])));
         }
      } );
      // $('#add-arrow-button').append($menu);
      $(event.target).closest('button').append($menu);
      Menu.setMenuLocations(event, $menu);
   }

   // Add button menu element clicked:
   //   Hide menu
   //   Add lines to Cayley_diagram
   //   Update lines, arrowheads in graphic, arrow-list
   static addArrow(element /*: number */) {
      DC.clearMenus();
      Cayley_diagram.addLines(element);
      DC.Arrow.updateArrows();
   }

   // Remove button clicked
   //   Remove highlighted row from arrow-list
   //   Disable remove button
   //   Remove line from Cayley_diagram
   //   Update lines in graphic, arrow-list
   static removeArrow(element /*: number */) {
      $('#remove-arrow-button').prop('disabled', true);
      Cayley_diagram.removeLines(element);
      DC.Arrow.updateArrows()
   }

   // clear arrows
   // set line colors in Cayley_diagram
   // update lines, arrowheads in CD
   // add rows to arrow list from line colors
   static updateArrows() {
      $('#arrow-list').children().remove();
      Cayley_diagram.setLineColors();
      Graphic_context.updateLines(Cayley_diagram);
      Graphic_context.updateArrowheads(Cayley_diagram);
      // ES6 introduces a Set, but does not provide any way to change the notion of equality among set members
      // Here we work around that by joining a generator value from the line.arrow attribute ("27") and a color ("#99FFC1")
      //   into a unique string ("27#99FFC1") in the Set, then partitioning the string back into an element and a color part
      const arrow_hashes = new Set(Cayley_diagram.lines.map(
         (line) => '' + ((line.arrow /*: any */) /*: groupElement */) + ( ((line.color /*: any */) /*: color */) ).toString()
      ));
      arrow_hashes.forEach( (hash) => {
         const element = hash.slice(0,-7);
         const color = hash.slice(-7);
         $('#arrow-list').append(eval(Template.HTML('arrow-list-item-template')));  // make entry in arrow-list
      } );
      if (arrow_hashes.size == group.order - 1) {  // can't make an arrow out of the identity
         DC.Arrow.disable()
      } else {
         DC.Arrow.enable()
      }
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'arrow-control']);
      emitStateChange();
   }

   // disable Add button
   static enable() {
      $('#add-arrow-button').prop('disabled', false);
   }

   // enable Add button
   static disable() {
      $('#add-arrow-button').prop('disabled', true);
   }
}
// @flow
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';

import DC from './diagram.js';

var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;

export default
 */
DC.ArrowMult = class ArrowMult {
   static setMult(rightOrLeft /*: string */) {
      Cayley_diagram.right_multiplication = (rightOrLeft == 'right');
      Graphic_context.showGraphic(Cayley_diagram);
   }
}
// @flow
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import GEUtils from '../js/GEUtils.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

import DC from './diagram.js';

// globals implemented in CayleyDiagram.js
var group: XMLGroup;
var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;
var Diagram_name: string;
var emitStateChange: () => void;

export default
 */
DC.Chunking = class {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      if (   Diagram_name === undefined
          && Cayley_diagram.strategies.every( (strategy, inx) => strategy.nesting_level == inx ) ) {
         DC.Chunking.enable();
      } else {
         DC.Chunking.disable();
         return;
      }

      $('#chunk-choices').html(eval(Template.HTML('chunk-select-first-template')));
      const generators = [];
      // generate option for each strategy in Cayley diagram
      Cayley_diagram.strategies.forEach( (strategy, strategy_index) => {
         if (strategy != GEUtils.last(Cayley_diagram.strategies)) {
            generators.push(group.representation[strategy.generator]);
            // find matching subgroup for chunking option
            const subgroup_index = group.subgroups.findIndex( (subgroup) => strategy.bitset.equals(subgroup.members) );
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-other-template')));
         }
      } );
      $('#chunk-choices').append(eval(Template.HTML('chunk-select-last-template')));
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'chunk-choices'],
                        () => DC.Chunking.selectChunk(Cayley_diagram.chunk)
                       );
   }

   static clickHandler(event /*: JQueryEventObject */) {
      event.preventDefault();

      if (!DC.Chunking.isDisabled()) {
         const $curr = $(event.target).closest('[action]');
         if ($curr != undefined) {
            eval($curr.attr('action'));
            event.stopPropagation();
         }
      }
   }

   static selectChunk(subgroup_index /*: number */) {
      $('#chunk-choices').hide();
      const strategy_index =
            Cayley_diagram.strategies.findIndex( (strategy) => strategy.bitset.equals(group.subgroups[subgroup_index].members) );
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      Cayley_diagram.chunk = (strategy_index == -1) ? 0 : subgroup_index;
      Graphic_context.updateChunking(Cayley_diagram);
      emitStateChange();
   }

   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      Cayley_diagram.chunk = 0;
      Graphic_context.updateChunking(Cayley_diagram);

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
      emitStateChange();
   }

   static isDisabled() /*: boolean */ {
      return $('#chunk-select').prop('disabled');
   }
}
// @flow
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';

// globals implemented in CayleyDiagram.js
var Cayley_diagram: CayleyDiagram;
var Graphic_context: DisplayDiagram;
var emitStateChange: () => void;

export default
 */
class CVC {
/*::
   static VIEW_PANEL_URL: string;
 */
   static load($viewWrapper /*: JQuery */) /*: Promise<void> */ {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: CVC.VIEW_PANEL_URL,
                   success: (data /*: html */) => {
                      $viewWrapper.html(data);
                      CVC.setupViewPage();
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${CVC.VIEW_PANEL_URL} ${err === undefined ? '' : ': ' + err}`);
                   }
         } )
      } )
   }

   static setupViewPage() {
      $('#zoom-level').off('input', CVC.setZoomLevel).on('input', CVC.setZoomLevel);
      $('#line-thickness').off('input', CVC.setLineThickness).on('input', CVC.setLineThickness);
      $('#node-radius').off('input', CVC.setNodeRadius).on('input', CVC.setNodeRadius);
      $('#fog-level').off('input', CVC.setFogLevel).on('input', CVC.setFogLevel);
      $('#use-fog').off('input', CVC.setFogLevel).on('input', CVC.setFogLevel);
      $('#label-size').off('input', CVC.setLabelSize).on('input', CVC.setLabelSize);
      $('#show-labels').off('input', CVC.setLabelSize).on('input', CVC.setLabelSize);
      $('#arrowhead-placement').off('input', CVC.setArrowheadPlacement).on('input', CVC.setArrowheadPlacement);
   }

   /* Slider handlers */
   static setZoomLevel() {
      Cayley_diagram.zoomLevel = Math.exp( Number($('#zoom-level').val())/10 );
      Graphic_context.updateZoomLevel(Cayley_diagram);
      emitStateChange();
   }

   /* Set line thickness from slider value
    *   slider is in range [1,20], maps non-linearly to [1,15] so that:
    *   1 -> 1, using native WebGL line
    *   2 -> [4,15] by 4*exp(0.07*(slider-2)) heuristic, using THREE.js mesh line
    */
   static setLineThickness() {
      const slider_value = Number($('#line-thickness').val());
      const lineWidth = (slider_value == 1) ? 1 : 4*Math.exp(0.0734*(slider_value-2));
      Cayley_diagram.lineWidth = lineWidth;
      Graphic_context.updateLineWidth(Cayley_diagram);
      emitStateChange();
   }

   static setNodeRadius() {
      Cayley_diagram.nodeScale = Math.exp( Number($('#node-radius').val())/10 );
      Graphic_context.updateNodeRadius(Cayley_diagram);
      Graphic_context.updateLabels(Cayley_diagram);
      emitStateChange();
   }

   static setFogLevel() {
      Cayley_diagram.fogLevel = $('#use-fog').is(':checked') ? Number($('#fog-level').val())/10 : 0;
      Graphic_context.updateFogLevel(Cayley_diagram);
      emitStateChange();
   }

   static setLabelSize() {
      Cayley_diagram.labelSize = $('#show-labels').is(':checked') ? Math.exp( Number($('#label-size').val())/10 ) : 0;
      Graphic_context.updateLabelSize(Cayley_diagram);
      emitStateChange();
   }

   static setArrowheadPlacement() {
      Cayley_diagram.arrowheadPlacement = Number($('#arrowhead-placement').val())/20;
      Graphic_context.updateArrowheadPlacement(Cayley_diagram);
      emitStateChange();
   }
}

CVC.VIEW_PANEL_URL = 'cayleyViewController/view.html';
// @flow
/*
# Visualizer framework javascript

[VC.load()](#vc-load-) embeds the visualizer-specific control panels in a copy of the visualizer framework. It is called immediately after document load by CayleyDiagram.html, CycleGraph.html, Multtable.html, SymmetryObject.html, and Sheet.html

[VC.hideControls()](#vc-hideControls-) and [VC.showControls()](#vc-showControls-) hide and expose the visualizer-specific control panels

[VC.showPanel(panel_name)](#vc-showpanel-panel_name-) switch panel by showing desired panel_name, hiding the others

[VC.help()](#vc-help-) links to the visualizer-specific help page

```javascript
 */
/*::
import XMLGroup from '../js/XMLGroup.js';
import IsomorphicGroups from '../js/IsomorphicGroups.js';

var group: XMLGroup;

var HELP_PAGE: string;

export default
 */
class VC {
/*::
   static visualizerLayoutURL: string;
 */
   static _init() {
      VC.visualizerLayoutURL = './visualizerFramework/visualizer.html';
   }

   /*
```
## VC.load()
```javascript
   /*
    * Start an ajax load of visualizer.html that, on successful completion,
    *   embeds the existing visualizer-specific controls in the visualizer framework
    *
    * It returns the just-started ajax load as an ES6 Promise
    */
   static load() /*: Promise<void> */ {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: VC.visualizerLayoutURL,
                   success: (data /*: string */) => {
                      // The current body element contains visualizer-specific layout
                      // Detach it and save it for insertion into the visualizer framework below
                      const $customCode = $('body').children().detach();

                      // Replace the current body with content of visualizer.html, append resetTemplate
                      $('body').html(data);

                      // Remove controls-placeholder div and insert visualizer-specific code saved above
                      $('#controls-placeholder').remove();
                      $('#vert-container').prepend($customCode);

                      // Hide top right-hand 'hide-controls' icon initially
                      $( '#show-controls' ).hide();

                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${VC.visualizerLayoutURL} ${err === undefined ? '' : ': ' + err}`);
                   }
         } );
      } )
   }

   /*
```
## VC.hideControls()
```javascript
   /* Hide visualizer-specific control panels, resize graphic */
   static hideControls () {
      $( '#hide-controls' ).hide();
      $( '#show-controls' ).show();
      $( '#vert-container' ).hide().resize();
   }

   /*
```
## VC.showControls()
```javascript
   /* Expose visualizer-specific control panels, resize graphic */
   static showControls () {
      $( '#hide-controls' ).show();
      $( '#show-controls' ).hide();
      $( '#vert-container' ).show().resize();
   }

   /*
```
## VC.help()
```javascript
   /* Link to visualizer-specific help page */
   static help() {
      window.open(HELP_PAGE);
   }

   /*
```
## VC.findGroup()
```javascript
   /* Try to find this group in the Library based only on its structure */
   static findGroup() {
      const found = IsomorphicGroups.find( group );
      if ( found ) {
         window.open( `./GroupInfo.html?groupURL=${encodeURIComponent( found.URL )}` );
      } else {
         alert( 'Group Explorer could not find this group in its library.' );
      }
   }

   /*
```
## VC.showPanel(panel_name)
```javascript
   /* Switch panels by showing desired panel, hiding the rest */
   static showPanel(panel_name /*: string */) {
      $('#vert-container > .fill-vert').each( (_, control) => {
         const control_name = '#' + $(control).attr('id');
         if (control_name == panel_name) {
            $(control_name).show();
         } else {
            $(control_name).hide();
         }
      } )
   }
}

VC._init();
/*
```
 */
