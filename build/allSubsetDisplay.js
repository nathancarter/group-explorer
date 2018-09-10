
class SSD {
   static clearMenus() {
      $('.highlighted').removeClass('highlighted');
      $('.menu:visible').remove();
      $('.elements').remove();
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
      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
   }

   /*
    * Double-click displays elements in subset
    */
   static dblClickHandler(event) {
      event.preventDefault();
      SSD.clearMenus();
      const $curr = $(event.target).closest('li');
      const id = $curr.attr('id');
      if (id != undefined) {
         const subset = SSD.displayList[id];
         const subsetName = subset.name;
         const subsetElements = subset
            .elements.toArray()
            .reduce( (elements, element) => {
               elements.push(math(group.representation[element]));
               return elements;
            }, [] )
            .join(', ');
         const $menu = $(eval(Template.HTML('#subsetElements_template')));
         $curr.addClass('highlighted').append($menu);
         SSD.setMenuLocations(event, $menu);
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
      }
   }

   /*
    * Left-click executes "action" attribute in menu item
    */
   static menuClickHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         eval($curr.attr('action'));
         SSD.clearMenus();
         event.stopPropagation();
         MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
      }
   }

   /*
    * Right-click displays context menu according to
    *   -- target class (subset_page_header or placeholder)
    *   -- li element id (<subset>.menu)
    */
   static contextMenuHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('p.subset_page_header, p.placeholder, li[id]');
      if ($curr.length != 0) {
         SSD.clearMenus();
         const $menu =($curr.hasClass('subset_page_header') || $curr.hasClass('placeholder')) ?
                      $(eval(Template.HTML('#headerMenu_template'))) :
                      $(SSD.displayList[$curr.attr('id')].menu);
         $menu.on('click', SSD.menuClickHandler);
         $curr.addClass('highlighted').append($menu);
         SSD.setMenuLocations(event, $menu);
         event.stopPropagation();
      }
   }

   static setMenuLocations(event, $menu) {
      // set left edge location so menu doesn't disappear to the right
      const left = event.clientX + $menu.outerWidth() > $(window).innerWidth() ?
                   $(window).innerWidth() - $menu.outerWidth() :
                   event.clientX;
      $menu.css({left: left});

      // set top edge to menu doesn't disappear off the bottom
      const top = event.clientY + $menu.outerHeight() > $(window).innerHeight() ?
                  $(window).innerHeight() - $menu.outerHeight() :
                  event.clientY;
      $menu.css({top: top});

      // do the same for subMenus
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, subMenu) => SSD.setSubMenuLocation($menu, $(subMenu)) );
   }

   static setSubMenuLocation($menu, $subMenu) {
      const bottomRoom = $(window).innerHeight() - ($subMenu.offset().top + $subMenu.outerHeight());
      if (bottomRoom < 0) {
         if ($subMenu.outerHeight() < $(window).innerHeight()) {
            $subMenu.css({top: bottomRoom});
         } else {
            $subMenu.css({top: -$subMenu.offset().top, height: $(window).innerHeight()})
         }
      }

      const rightRoom = $(window).innerWidth() -
                        ($menu.offset().left + $menu.outerWidth() + $subMenu.outerWidth());
      const leftRoom = $menu.offset().left - $subMenu.outerWidth();
      const widthMargin = ($subMenu.outerWidth() - $subMenu.width())/2;
      if (rightRoom > 0) {
         $subMenu.css({left: '100%'});
      } else if (leftRoom > 0) {
         $subMenu.css({right: '100%'});
      } else if (rightRoom > leftRoom) {
         $subMenu.css({left: $menu.outerWidth() + rightRoom - widthMargin});
      } else {
         $subMenu.css({right: $menu.outerWidth() + leftRoom - widthMargin});
      }

      $subMenu.children('li:has(span.menu-arrow)')
              .children('ul')
              .each( (_, subMenu) => SSD.setSubMenuLocation($subMenu, $(subMenu)) );
   }

   static setCascadeDirections($menu) {
      $menu.children('li:has(span.menu-arrow)')
           .children('ul')
           .each( (_, child_menu) => {
              const $child_menu = $(child_menu);
              let direction = 'left';
              if ($menu.offset().left + $menu.width() + $(child_menu).width() > $(window).width()) {
                 direction = 'right';
              }
              $(child_menu).css(direction, '100%');
              setCascadeDirections( $(child_menu) );
           });
   }
}

/*
 * SSD.BasicSubset --
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
 *   (BasicSubset would be an abstract superclass in another language.)
 */

SSD.BasicSubset = class BasicSubset {
   constructor () {
      this.id = SSD.nextId++;
      SSD.displayList[this.id] = this;
   }

   get closure() {
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
   union(other) {
      return new SSD.Subset(BitSet.union(this.elements, other.elements));
   }

   intersection(other) {
      return new SSD.Subset(BitSet.intersection(this.elements, other.elements));
   }

   elementwiseProduct(other) {
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
   
   menuItems(operation) {
      const printOp = operation == 'elementwiseProduct' ? 'elementwise product' : operation;
      const action = (other) => `SSD.displayList[${this.id}].${operation}(SSD.displayList[${other.id}])`;      
      const li = (other) => eval('`' + `<li action="${action(other)}">the ${printOp} of ` +
                                    `${math(this.name)} with ${math(other.name)}</li>` + '`');

      const otherSubsets = SSD.displayList.filter( (el) => el != this );
      const frag =
         otherSubsets.filter( (el) => el instanceof SSD.Subgroup )
                     .reduce( (frag, el) => frag += li(el), '' ) +
         otherSubsets.filter( (el) => el instanceof SSD.Subset )
                     .reduce( (frag, el) => frag += li(el), '' ) +
         otherSubsets.filter( (el) => el instanceof SSD.PartitionSubset )
                     .reduce( (frag, el) => frag += li(el), '' );
      return frag;
   }
}

SSD.Subgroup = class Subgroup extends SSD.BasicSubset {
   constructor (subgroupIndex) {
      super();

      this.subgroupIndex = subgroupIndex;
      this.elements = window.group.subgroups[subgroupIndex].members;
   }

   get name() {
      return `<i>H<sub>${this.subgroupIndex}</sub></i>`;
   }

   get displayLine() {
      const generators = window.group.subgroups[this.subgroupIndex].generators.toArray()
                               .map( el => math(group.representation[el]) ).join(', ');
      let templateName;
      switch (this.subgroupIndex) {
         case 0:
            templateName = '#firstSubgroup_template';	break;
         case window.group.subgroups.length - 1:
            templateName = '#lastSubgroup_template';	break;
         default:
            templateName = '#subgroup_template';	break;
      }
      return eval(Template.HTML(templateName));
   }

   get menu() {
      return eval(Template.HTML('#subgroupMenu_template'));
   }

   get normalizer() {
      new SSD.Subset(
         new SubgroupFinder(window.group)
            .findNormalizer(window.group.subgroups[this.subgroupIndex]).members );
   }

   get leftCosets() {
      return new SSD.Cosets(this, 'left');
   }

   get rightCosets() {
      return new SSD.Cosets(this, 'right');
   }

   static displayAll() {
      $('#subgroups').html(
         window.group
               .subgroups
               .reduce( (frag, _, inx) => frag.append(new SSD.Subgroup(inx).displayLine),
                        $(document.createDocumentFragment()) )
      );
   }
}
SSD.Subset = class Subset extends SSD.BasicSubset {
   constructor (elements) {
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

   get name() {
      return `<i>S<sub>${this.subsetIndex}</sub></i>`;
   }

   get displayLine() {
      const numElements = this.elements.popcount();
      let items = this.elements
                      .toArray()
                      .slice(0, 3)
                      .map( (el) => math(window.group.representation[el]) )
                      .join(', ');
      if (numElements > 3) {
         items += ', ...';
      }
      return eval(Template.HTML('#subset_template'));
   }

   get menu() {
      return eval(Template.HTML('#subsetMenu_template'));
   }

   destroy() {
      super.destroy();
      if ($('#subsets').length == 0) {
         $('#subsets_placeholder').show();
      }
   }

   static nextName() {
      return `<i>S<sub>${SSD.nextSubsetIndex}</sub></i>`;
   }
}

SSD.SubsetEditor = class SubsetEditor {
   static open(displayId) {
      const subset = displayId === undefined ? undefined : SSD.displayList[displayId];
      const elements = subset === undefined ? new BitSet(group.order) : subset.elements;
      const setName = subset === undefined ? SSD.Subset.nextName() : subset.name;
      const $subsetEditor = $('body').append(eval(Template.HTML('#subsetEditor_template')))
                                     .find('#subset_editor').show();
      $subsetEditor.find('.ssedit_setName').html(setName);
      $subsetEditor.find('#ssedit_cancel_button').on('click', SSD.SubsetEditor.close);
      $subsetEditor.find('#ssedit_ok_button').on('click', SSD.SubsetEditor.accept);
      $subsetEditor.find('.ssedit_panel_container').on('dragover', (ev) => ev.preventDefault());
      $subsetEditor.find('#ssedit_elementsIn_container').on('drop', SSD.SubsetEditor.addElement);
      $subsetEditor.find('#ssedit_elementsNotIn_container').on('drop', SSD.SubsetEditor.removeElement);
      
      for (const el of group.elements) {
         const elementHTML =
            `<li element=${el} draggable="true">${math(window.group.representation[el])}</li>`;
         const listName = elements.isSet(el) ? 'elementsIn' : 'elementsNotIn';
         $(elementHTML).appendTo($subsetEditor.find(`#${listName}`))
                       .on('dragstart', (ev) => ev.originalEvent.dataTransfer.setData("text", el));
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

   static addElement(ev) {
      ev.preventDefault();
      const element = ev.originalEvent.dataTransfer.getData("text");
      $(`#elementsNotIn li[element=${element}]`).detach().appendTo($(`#elementsIn`));
   }

   static removeElement(ev) {
      ev.preventDefault();
      const element = ev.originalEvent.dataTransfer.getData("text");
      $(`#elementsIn li[element=${element}]`).detach().appendTo($(`#elementsNotIn`));
   }
}
SSD.Partition = class Partition {
   constructor () {
      this.subsets = [];
   }

   get name() {
      return this.subsets[0].name +
             ', ..., ' +
             this.subsets[this.subsets.length - 1].name;
   }

   destroy() {
      this.subsets.forEach( (subset) => subset.destroy() );
      if ($('#partitions').length == 0) {
         $('#partitions_placeholder').show();
      }
   }
}
SSD.PartitionSubset = class PartitionSubset extends SSD.BasicSubset {
   constructor(parent, subIndex, elements, name, partitionClass) {
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
            result.push(math(group.representation[i]));
         }
      }
      return result.join(', ') + (this.elements.popcount() > 3 ? ', ...' : '');
   }

   get menu() {
      return eval(Template.HTML('#partitionMenu_template'));
   }

   get displayLine() {
      return eval(Template.HTML('#' + this.partitionClass + '_template'));
   }
}

SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.Partition {
   constructor() {
      super();

      this.subsets = window.group.conjugacyClasses.map( (conjugacyClass, inx) => 
         new SSD.PartitionSubset(this, inx, conjugacyClass, `<i>CC<sub>${inx}</sub></i>`, 'conjugacyClass') );
      
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
SSD.Cosets = class Cosets extends SSD.Partition {
   constructor(subgroup, side) {
      super();

      this.subgroup = subgroup;
      this.isLeft = side == 'left';
      this.side = side;

      this.subsets = window
         .group
         .getCosets(this.subgroup.elements, this.isLeft)
         .map( (coset, inx) => {
            const rep = math(window.group.representation[coset.first()]);
            const name = this.isLeft ? rep + this.subgroup.name : this.subgroup.name + rep;
            return new SSD.PartitionSubset(this, inx, coset, name, 'cosetClass');
         } );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy() {
      $(`#partitions li.${this.side}coset${this.subgroupIndex}`).remove();
      super.destroy();
   }
}
SSD.OrderClasses = class OrderClasses extends SSD.Partition {
   constructor() {
      super();

      this.subsets = window
         .group
         .orderClasses
         .filter( (orderClass) => orderClass != undefined )
         .map( (orderClass, inx) => 
            new SSD.PartitionSubset(this, inx, orderClass, `<i>OC<sub>${inx}</sub></i>`, 'orderClass')
         );

      $('#partitions_placeholder').hide();
      $('#partitions').append(
         this.subsets.reduce( ($frag, subset) => $frag.append(subset.displayLine),
                              $(document.createDocumentFragment()) ))
                      .show();
   }

   destroy($curr) {
      $('#partitions li.orderClass').remove();
      super.destroy();
   }
}
