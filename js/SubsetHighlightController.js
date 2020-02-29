// @flow

import BitSet from '../js/BitSet.js';
import GEUtils from '../js/GEUtils.js';
import Log from '../js/Log.js';
import MathML from '../js/MathML.js';
import Menu from '../js/Menu.js';
import SubgroupFinder from '../js/SubgroupFinder.js';
import Template from '../js/Template.js';
import XMLGroup from '../js/XMLGroup.js';

export {load};

/*::
type highlighterRoutines = Array<{handler: (Array<Array<groupElement>>) => void, label: string}>;
*/

const SUBSET_DISPLAY_URL /*: string */ = './html/SubsetHighlightController.html';

let group /*: XMLGroup */ = new XMLGroup();
let nextSubsetIndex /*: number*/ = 0;
let nextId /*: number */ = 0;
let displayList /*: Array<AbstractSubset> */ = [];
let highlighters /*: highlighterRoutines */ = [];
let clearHighlights /*: () => void */ = () => void(0);
let element_display_timeoutID /*: ?TimeoutID */ = null;

/*
 * AbstractSubset --
 *   Direct superclass of Subgroup, Subset, and Partition
 *   Assigns an id to every element displayed in the subsetDisplay,
 *     and adds it to displayList
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
class AbstractSubset {
/*::
   id: number;
   elements: BitSet;
  +name: string;	// implemented in subclass
  +menu: JQuery;	// implemented in subclass
  +displayLine: string; // implemented in subclass
 */  
   constructor() {
      this.id = getNextId();
      displayList[this.id] = this;
   }

   get closure() /*: Subset */ {
      return new Subset(group.closure(this.elements));
   }

   // delete is a javascript keyword...
   destroy() {
      delete(displayList[this.id]);
      $(`#${this.id}`).remove();
   }


   /*
    * Operations that create new Subsets by performing
    *   union, intersection, and elementwise product on this set
    */
   union(other /*: AbstractSubset */) /* Subset */ {
      return new Subset(BitSet.union(this.elements, other.elements));
   }

   intersection(other /*: AbstractSubset */) /*: Subset */ {
      return new Subset(BitSet.intersection(this.elements, other.elements));
   }

   elementwiseProduct(other /*: AbstractSubset */) /*: Subset */{
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
      return new Subset(newElements);      
   }

   get elementString() /*: string */ {
      return '[' + this.elements.toString() + ']';
   }
}


class Subgroup extends AbstractSubset {
/*::
   subgroupIndex: number;
  +normalizer: Subset;
  +leftCosets: Cosets;
  +rightCosets: Cosets;
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
      return new Subset(
         new SubgroupFinder(group)
            .findNormalizer(group.subgroups[this.subgroupIndex]).members );
   }

   get leftCosets() {
      return new Cosets(this, 'left');
   }

   get rightCosets() {
      return new Cosets(this, 'right');
   }

   static displayAll() {
      $('#subgroups').html('').append(
         group.subgroups.reduce( (frag, _, inx) => frag.append(new Subgroup(inx).displayLine),
                                 $(document.createDocumentFragment()) ));
   }
}


class Subset extends AbstractSubset {
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
      this.subsetIndex = getNextSubsetIndex();

      // cache formatted MathML for next two subset instances
      MathML.cacheStrings([MathML.sub('S', nextSubsetIndex),
                           MathML.sub('S', nextSubsetIndex + 1)]);

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
      return MathML.sans(MathML.sub('S', nextSubsetIndex));
   }
}


class AbstractPartition {
/*::
  +destroy: () => void;   
  +name: string;
   subsets: Array<PartitionSubset>;
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

class PartitionSubset extends AbstractSubset {
/*::
   parent: AbstractPartition;
   subIndex: number;
   elements: BitSet;
   name: string;
   partitionClass: string;
  +elementRepresentations: Array<string>;
 */
   constructor(parent /*: AbstractPartition */,
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


class ConjugacyClasses extends AbstractPartition {
   constructor() {
      super();

      this.subsets = group.conjugacyClasses.map( (conjugacyClass, inx) =>
          new PartitionSubset(this, inx, conjugacyClass, MathML.sans(MathML.sub('CC', inx)), 'conjugacy-class') );

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


class OrderClasses extends AbstractPartition {
   constructor() {
      super();

      this.subsets = group
         .orderClasses
         .filter( (orderClass) => orderClass.popcount() != 0 )
         .map( (orderClass, inx) => 
            new PartitionSubset(this, inx, orderClass, MathML.sans(MathML.sub('OC', inx)), 'order-class')
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


class Cosets extends AbstractPartition {
/*::
  subgroup: Subgroup;
  isLeft: boolean;
  side: string;
 */
   constructor(subgroup /*: Subgroup */, side /*: string */) {
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
            return new PartitionSubset(this, inx, coset, name, 'coset-class');
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


class SubsetEditor {
   static open(displayId /*: number */) {
      const subset = displayId === undefined ? undefined : displayList[displayId];
      const elements = subset === undefined ? new BitSet(group.order) : subset.elements;
      const setName = subset === undefined ? Subset.nextName() : subset.name;
      const $subsetEditor = $('body').append(eval(Template.HTML('subset-editor-template')))
                                     .find('#subset_editor').show();
      $subsetEditor.find('#ssedit_cancel_button').on('click', SubsetEditor.close);
      $subsetEditor.find('#ssedit_ok_button').on('click', SubsetEditor.accept);
      $subsetEditor.find('.ssedit_panel_container').on('dragover', (ev /*: JQueryEventObject */) => ev.preventDefault());
      $subsetEditor.find('#ssedit_elementsIn_container').on('drop', SubsetEditor.addElement);
      $subsetEditor.find('#ssedit_elementsNotIn_container').on('drop', SubsetEditor.removeElement);

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
      new Subset(
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


//displayElements, 
function initSubsetMenu() {
   const subsetPage = $('#subset-control')[0];
   if (GEUtils.isTouchDevice()) {
      // register touchstart, touchmove, touchend events on subset page

      subsetPage.addEventListener('touchstart', touchHandler);
      subsetPage.addEventListener('touchmove', touchHandler);
      subsetPage.addEventListener('touchend', touchHandler);

      subsetPage.addEventListener('click', subsetClickHandler);
   } else {
      // register contextmenu, dblclick
      subsetPage.addEventListener('contextmenu', subsetClickHandler);
      subsetPage.addEventListener('dblclick', (event /*: MouseEvent */) => displayElements(event, event));
   }
}

function subsetClickHandler (event /*: MouseEvent */) {
   event.preventDefault();
   const $action = $(event.target).closest('[action]');
   if ($action.length != 0) {
      event.stopPropagation();
      eval($action.attr('action'));
      // if we've just executed a menu action that's not just exposing a sub-menu
      //   then we're done: clean up the window
      if ($action.parent().hasClass('menu') && $action.attr('link') == undefined) {
         GEUtils.cleanWindow();  // is this always the right thing to do?
      }
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
function touchHandler(touchEvent /*: TouchEvent */) {
   // skip modified events, multi-touches
   if (   touchEvent.altKey || touchEvent.ctrlKey || touchEvent.metaKey || touchEvent.shiftKey
       || touchEvent.touches.length > 1 || touchEvent.changedTouches.length > 1) {
      return;
   }

   switch (touchEvent.type) {
   case 'touchstart':
      element_display_timeoutID = setTimeout( () => displayElements(touchEvent, touchEvent.touches[0]), 500);
      break;

   case 'touchend':
      element_display_timeoutID = clearTimeout(element_display_timeoutID);
      break;
   }
}

function displayElements(event /*: Event */, location /*: eventLocation */) {
   event.preventDefault();
   GEUtils.cleanWindow();
   const $curr = $(event.target).closest('li');
   const id = $curr.attr('id');
   if (id != undefined) {
      const subset = displayList[parseInt(id)];
      const subsetName = subset.name;
      const subsetElements = subset.elements.toArray().map( (el) => group.representation[el] );
      const $menu = $(eval(Template.HTML('subset-elements-template')));
      $curr.addClass('highlighted').append($menu);
      Menu.setMenuLocation($menu, location);
      $menu.css('visibility', 'visible');
      event.stopPropagation();
   }
}

function showingOrderClasses() /*: boolean */ {
   return $('#partitions li.orderClass').length != 0;
}

function showingConjugacyClasses() /*: boolean */ {
   return $('#partitions li.conjugacyClass').length != 0;
}

function showingLeftCosets(id /*: groupElement */) /*: boolean */ {
   return $('#partitions li.leftCoset' + id).length != 0;
}

function showingRightCosets(id /*: groupElement */) /*: boolean */ {
   return $('#partitions li.rightCoset' + id).length != 0;
}

function makeLongList(id /*: groupElement */, template_name /*: string */) /*: html */ {
   const template = Template.HTML(template_name);
   const result = displayList.reduce(
      (list, item, other_id) => ((other_id == id) ? null : list.push(eval(template)), list), [] )
         .join('');
   return result;
}

function showHeaderMenu(event /*: MouseEvent */) {
   GEUtils.cleanWindow();
   const $menus = $(eval(Template.HTML('header-menu-template')))
         .appendTo($(event.target).closest('[action]')[0]);
   Menu.addMenus($menus, event, subsetClickHandler);
}

function showMenu(event /*: MouseEvent */, id /*: number */) {
   GEUtils.cleanWindow();
   const $menus = displayList[id].menu
         .appendTo($(event.target).closest('li'));
   Menu.addMenus($menus, event, subsetClickHandler);
}

/* Load, initialize subset display */
function load($subsetWrapper /*: JQuery */,
              _highlighters /*: highlighterRoutines*/,
              _clearHighlights /*: () => void */,
              _group /*: XMLGroup */)
{
   group = _group;
   highlighters = _highlighters;
   clearHighlights = _clearHighlights;              
   nextSubsetIndex = 0;
   nextId = 0;
   displayList = [];

   $.ajax( { url: SUBSET_DISPLAY_URL,
             success: (data /*: html */) => {
                $subsetWrapper.html(data);
                setupSubsetPage();
             },
             error: (_jqXHR, _status, err) => {
                Log.err(`Error loading ${SUBSET_DISPLAY_URL} ${err === undefined ? '' : ': ' + err}`)
             }
           } );
}

function setupSubsetPage() {
   // clear out displayed lists; show '(None)' placeholders
   $('ul.subset_page_content li').remove();
   $('p.placeholder').show();

   // Display all subgroups
   Subgroup.displayAll();

   // set up event listeners for menus
   initSubsetMenu();
}

function getNextId() /*: number */ {
   return nextId++;
}

function getNextSubsetIndex() /*: number */ {
   return nextSubsetIndex++;
}
