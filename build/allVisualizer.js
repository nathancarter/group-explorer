// @flow
/*::
import MathML from '../js/MathML.md';
import Menu from '../js/Menu.md';
import Template from '../js/Template.md';
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
import SubsetMenu from './SubsetMenu.js';

type highlighterRoutines = Array<{handler: (Array<Array<groupElement>>) => void, label: string}>;

var group: XMLGroup;

export default
 */
class SSD {
/*::
   static subsetsURL: string;
   static nextId: number;
   static nextSubsetIndex: number;
   static displayList: Array<AbstractSubset>;
   static highlighters: highlighterRoutines;

   static AbstractSubset: Class<AbstractSubset>;
   static ConjugacyClasses: Class<ConjugacyClasses>;
   static Cosets: Class<Cosets>;
   static OrderClasses: Class<OrderClasses>;
   static AbstractPartition: Class<AbstractPartition>;
   static PartitionSubset: Class<PartitionSubset>;
   static Subgroup: Class<Subgroup>;
   static SubsetEditor: Class<SubsetEditor>;
   static Subset: Class<Subset>;
   static SubsetMenu: Class<SubsetMenu>;
 */
   static _init() {
      SSD.subsetsURL = './subsetDisplay/subsets.html';
   }

   /* Load, initialize subset display */
   static load($subsetWrapper /*: JQuery */, highlighters /*: highlighterRoutines*/) /*: Promise<void> */ {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: SSD.subsetsURL,
                   success: (data /*: string */) => {
                      $subsetWrapper.html(data);
                      SSD.setup_subset_page(highlighters);
                      resolve();
                   },
                   error: (_jqXHR, _status, err) => {
                      reject(`Error loading ${SSD.subsetsURL} ${err === undefined ? '' : ': ' + err}`);
                   }
         } )
      } )
   }

   static setup_subset_page(highlighters /*: highlighterRoutines */) {
      SSD.highlighters = highlighters;
      // Initialize list of all displayed subsets
      SSD.nextId = 0;
      SSD.nextSubsetIndex = 0;
      SSD.displayList = [];

      // clear out displayed lists; show '(None)' placeholders
      $('ul.subset_page_content li').remove();
      $('p.placeholder').show();

      // Display all subgroups
      SSD.Subgroup.displayAll();

      // set up event listeners for menus
      SSD.SubsetMenu.init();
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
import MathML from '../js/MathML.md';
import Template from '../js/Template.md';
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
      return MathML.sans(MathML.sub('H', this.subgroupIndex));
   }

   get displayLine() {
      const generators = group.subgroups[this.subgroupIndex].generators.toArray()
                               .map( el => group.representation[el] );
      let templateName;
      switch (this.subgroupIndex) {
         case 0:
            templateName = 'first-subgroup-template';	break;
         case group.subgroups.length - 1:
            templateName = 'last-subgroup-template';	break;
         default:
            templateName = 'subgroup-template';	break;
      }
      return eval(Template.HTML(templateName));
   }

   get menu() {
      return $(eval(Template.HTML('subgroup-menu-template')));
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
import MathML from '../js/MathML.md';
import Template from '../js/Template.md';
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

      // cache formatted MathML for next two subset instances
      MathML.cacheStrings([MathML.sub('S', SSD.nextSubsetIndex),
                           MathML.sub('S', SSD.nextSubsetIndex + 1)]);

      $('#subsets_placeholder').hide();
      $('#subsets').append(this.displayLine).show();
   }

   get name() /*: mathml */ {
      return MathML.sans(MathML.sub('S', this.subsetIndex));
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
      return eval(Template.HTML('subset-template'));
   }

   get menu() {
      const id = this.id,
            name = this.name;
      const $menu = $(eval(Template.HTML('subset-menu-template')));
      return $menu;
   }

   destroy() {
      super.destroy();
      if ($('#subsets li').length == 0) {
         $('#subsets_placeholder').show();
      }
   }

   static nextName() /*: string */ {
      return MathML.sans(MathML.sub('S', SSD.nextSubsetIndex));
   }
}
// @flow
/*::
import BitSet from '../js/BitSet.js';
import MathML from '../js/MathML.md';
import Template from '../js/Template.md';
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
      const $subsetEditor = $('body').append(eval(Template.HTML('subset-editor-template')))
                                     .find('#subset_editor').show();
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
   }

   // Create new subset from elementsIn list, make sure it's formatted, and close editor
   static accept() {
      new SSD.Subset(
         $('#elementsIn > li')
            .map( (_, el) => parseInt($(el).attr('element')) )
            .toArray()
      );
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
import MathML from '../js/MathML.md';

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
      return [MathML.sans('<mtext>{</mtext>'),
              this.subsets[0].name,
              MathML.sans('<mtext>...</mtext>'), 
              this.subsets[this.subsets.length - 1].name,
              MathML.sans('<mtext>}</mtext>')]
         .join('&nbsp;');
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
import Template from '../js/Template.md';
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
      return $(eval(Template.HTML('partition-menu-template')));
   }

   get displayLine() /*: html */ {
      return eval(Template.HTML(this.partitionClass + '-template'));
   }
}
// @flow
/*::
import MathML from '../js/MathML.md';
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
            new SSD.PartitionSubset(this, inx, orderClass, MathML.sans(MathML.sub('OC', inx)), 'order-class')
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
import MathML from '../js/MathML.md';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.AbstractPartition {
   constructor() {
      super();

      this.subsets = group.conjugacyClasses.map( (conjugacyClass, inx) =>
          new SSD.PartitionSubset(this, inx, conjugacyClass, MathML.sans(MathML.sub('CC', inx)), 'conjugacy-class') );

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
import MathML from '../js/MathML.md';
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
                         MathML.sans(rep) + this.subgroup.name :
                         this.subgroup.name + MathML.sans(rep);
            return new SSD.PartitionSubset(this, inx, coset, name, 'coset-class');
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
import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.md';
import Menu from '../js/Menu.md';
import Template from '../js/Template.md';
import XMLGroup from '../js/XMLGroup.js';

import SSD from './subsets.js';

var group: XMLGroup;

export default
 */
SSD.SubsetMenu = class {
/*::
   static element_display_timeoutID: ?TimeoutID;
 */
   static init() {
      const subsetPage = $('#subset-control')[0];
      if (GEUtils.isTouchDevice()) {
         // register touchstart, touchmove, touchend events on subset page

         subsetPage.addEventListener('touchstart', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchmove', SSD.SubsetMenu.touchHandler);
         subsetPage.addEventListener('touchend', SSD.SubsetMenu.touchHandler);

         subsetPage.addEventListener('click', Menu.actionClickHandler);
      } else {
         // register contextmenu, dblclick
         subsetPage.addEventListener('contextmenu', Menu.actionClickHandler);
         subsetPage.addEventListener('dblclick', (event /*: MouseEvent */) => SSD.SubsetMenu.displayElements(event, event));
     }
   }

   /*
    * Mouse right-click or touchscreen tap displays menu according to
    *   -- target class (subset_page_header or placeholder)
    *   -- li element id (<subset>.menu)
    *
    * Mouse double-click or touchscreen tap-hold displays elements in subset
    *   Following mouse click or touchscreen tap anywhere clears element display
    */
   static touchHandler(touchEvent /*: TouchEvent */) {
      // skip modified events, multi-touches
      if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
          || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
         return;
      }

      switch (touchEvent.type) {
      case 'touchstart':
         SSD.SubsetMenu.element_display_timeoutID = setTimeout( () => {
            SSD.SubsetMenu.displayElements(touchEvent, touchEvent.touches[0]);
         }, 500);
         break;

      case 'touchend':
         clearTimeout(SSD.SubsetMenu.element_display_timeoutID);
         break;
      }
   }

   static displayElements(event /*: Event */, location /*: eventLocation */) {
      event.preventDefault();
      GEUtils.cleanWindow();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[parseInt(id)];
         const subsetName = subset.name;
         const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
         const $menu = $(eval(Template.HTML('subset-elements-template')));
         $curr.addClass('highlighted').append($menu);
         Menu.setMenuLocation($menu, location);
         $menu.css('visibility', 'visible');
         event.stopPropagation();
      }
   }

   static showingOrderClasses() /*: boolean */ {
      return $('#partitions li.orderClass').length != 0;
   }

   static showingConjugacyClasses() /*: boolean */ {
      return $('#partitions li.conjugacyClass').length != 0;
   }

   static showingLeftCosets(id /*: groupElement */) /*: boolean */ {
      return $('#partitions li.leftCoset' + id).length != 0;
   }

   static showingRightCosets(id /*: groupElement */) /*: boolean */ {
      return $('#partitions li.rightCoset' + id).length != 0;
   }

   static makeLongList(id /*: groupElement */, template_name /*: string */) /*: html */ {
      const template = Template.HTML(template_name);
      const result = SSD.displayList.reduce(
         (list, item, other_id) => ((other_id == id) ? null : list.push(eval(template)), list), [] )
            .join('');
      return result;
   }

   static showHeaderMenu(event /*: MouseEvent */) {
      GEUtils.cleanWindow();
      const $menus = $(eval(Template.HTML('header-menu-template')))
            .appendTo($(event.target).closest('[action]')[0]);
      Menu.addMenus($menus, event);
   }

   static showMenu(event /*: MouseEvent */, id /*: number */) {
      GEUtils.cleanWindow();
      const $menus = SSD.displayList[id].menu
            .appendTo($(event.target).closest('li'));
      Menu.addMenus($menus, event);
   }
}
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

// @flow
/*::
import BitSet from '../js/BitSet.js';
import CayleyDiagram from '../js/CayleyDiagram.js';
import type {layout, direction, StrategyArray} from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import MathML from '../js/MathML.md';
import Menu from '../js/Menu.md';
import Template from '../js/Template.md';
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
   static init() {
      // layout choices (linear/circular/rotated), direction (X/Y/Z)
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
   }

   /*
    * Draw Generator table
    */
   static draw() {
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
            $generation_table.append($(eval(Template.HTML('generation-table-row-template')))) );
      }
   }

   /*
    * Show option menus for the columns of the Generator table
    */
   static showGeneratorMenu(click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      // show only elements not generated by previously applied strategies
      const eligibleGenerators = ( (strategy_index == 0) ?
                                   new BitSet(group.order, [0]) :
                                   Cayley_diagram.strategies[strategy_index-1].bitset.clone() )
            .complement().toArray();


      // returns an HTML string with a list element for each arrow that can be added to the arrow-list
      const makeEligibleGeneratorList = () /*: html */ => {
         const template_html = Template.HTML('generation-generator-menu-item-template')
         const result = eligibleGenerators
               .reduce( (generators, generator) => (generators.push(eval(template_html)), generators), [] )
               .join('');
         return result;
      }

      const $menus = $(eval(Template.HTML('generation-generator-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location);
   }

   static showAxisMenu(click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      // previously generated subgroup must have > 2 cosets in this subgroup
      //   in order to show it in a curved (circular or rotated) layout
      const curvable =
         (Cayley_diagram.strategies[strategy_index].bitset.popcount()
            /  ((strategy_index == 0) ? 1 : Cayley_diagram.strategies[strategy_index - 1].bitset.popcount()))
      > 2;

      const $menus = $(eval(Template.HTML('generation-axis-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location);
   }

   static showOrderMenu(click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      const makeStrategyList = () => {
         const template = Template.HTML('generation-order-menu-item-template');
         const result = Cayley_diagram.strategies
               .reduce( (orders, _strategy, order) => (orders.push(eval(template)), orders), [])
               .join('');
      return result;
      };
      
      const num_strategies = Cayley_diagram.strategies.length;
      const $menus = $(eval(Template.HTML('generation-order-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location);
   }

   static makeOrganizeByMenu() {
      const template = Template.HTML('generation-organize-by-menu-item-template');
      const result = group.subgroups
           .reduce( (list, subgroup, inx) => {
              if (subgroup.order != 1 && subgroup.order != group.order) {  // only append non-trivial subgroups
                 list.push(eval(template));
              }
              return list;
           }, [] )
         .join('');
      return result;
   }

   /*
    * Perform actions directed by option menus
    */
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

   /*
    * Drag-and-drop generation-table rows to re-order generators
    */
   static dragStart(dragstartEvent /*: DragEvent */) {
      const target = ((dragstartEvent.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dragstartEvent.dataTransfer /*: any */) /*: DataTransfer */);
      dataTransfer.setData('text/plain', target.textContent);
   }

   static drop(dropEvent /*: DragEvent */) {
      dropEvent.preventDefault();
      const target = ((dropEvent.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dropEvent.dataTransfer /*: any */) /*: DataTransfer */);
      const dest = parseInt(target.textContent);
      const src = parseInt(dataTransfer.getData('text/plain'));
      const strategies = Cayley_diagram.getStrategies()
      strategies.splice(dest-1, 0, strategies.splice(src-1, 1)[0]);
      DC.Generator.updateStrategies(strategies);
   }

   static dragOver(dragoverEvent /*: DragEvent */) {
         dragoverEvent.preventDefault();
   }
}

// @flow
/*::
import Template from '../js/Template.md';
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
      DC.DiagramChoice._showChoice();
   }

   static _showChoice() {
      $('#diagram-choices').hide();
      const index = group.cayleyDiagrams.findIndex( (cd) => cd.name == Diagram_name );
      $('#diagram-choice')
         .html($(`#diagram-choices > li:nth-of-type(${index+2})`).html())
         .show();
   }

   static toggleChoices() {
      const choicesDisplay = $('#diagram-choices').css('display');
      $('#bodyDouble').click();
      if (choicesDisplay == 'none') {
         $('#diagram-choices').show();
      }         
   }

   static selectDiagram(diagram /*: ?string */, andDisplay /*:: ?: boolean */ = true) {
      $('#bodyDouble').click();
      Diagram_name = (diagram == undefined) ? undefined : diagram;
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

   All of these events are fielded and dispatched through the Menu.actionClickHandler()
 */
/*::
import CayleyDiagram from '../js/CayleyDiagram.js';
import DisplayDiagram from '../js/DisplayDiagram.js';
import GEUtils from '../js/GEUtils.js';
import MathML from '../js/MathML.md';
import Menu from '../js/Menu.md';
import Template from '../js/Template.md';
import XMLGroup from '../js/XMLGroup.js';

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

   // Row selected in arrow-list:
   //   clear all highlights
   //   highlight row (find arrow-list item w/ arrow = ${element})
   //   enable remove button
   static selectArrow(element /*: number */) {
      GEUtils.cleanWindow();
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
      // returns an HTML string with a list element for each arrow that can be added to the arrow-list
      const makeArrowList = () /*: html */ => {
         const template = Template.HTML('arrow-menu-item-template');
         const result = group.elements
               .reduce( (list, element) => {
                  // not the identity and not already displayed
                  if (element != 0 && $(`#arrow-list li[arrow=${element}]`).length == 0) {
                     list.push(eval(template));
                  }
                  return list;
               }, [] )
               .join('');
         return result;
      }

      GEUtils.cleanWindow();
      const $menus = $(eval(Template.HTML('arrow-menu-template')))
            .appendTo('#add-arrow-button');
      Menu.addMenus($menus, event);
   }

   // Add button menu element clicked:
   //   Hide menu
   //   Add lines to Cayley_diagram
   //   Update lines, arrowheads in graphic, arrow-list
   static addArrow(element /*: number */) {
      GEUtils.cleanWindow();
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
import Template from '../js/Template.md';
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
      DC.Chunking.selectChunk(Cayley_diagram.chunk);
   }

   static toggleChoices() {
      const choicesDisplay = $('#chunk-choices').css('display');
      $('#bodyDouble').click();
      if (choicesDisplay == 'none') {
         $('#chunk-choices').show();
      }         
   }

   static selectChunk(subgroup_index /*: number */) {
      if (DC.Chunking.isDisabled()) return;
      $('#bodyDouble').click();
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
