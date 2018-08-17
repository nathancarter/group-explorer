
class SSD {
   static clearMenus() {
      $('.highlighted').removeClass('highlighted');
      $('.menu:visible').remove();
   }

   static setup_subset_page() {
      SSD.Subgroup.init();
      SSD.Subset.init();
      SSD.Partition.init();

      SSD.redisplay_subset_page();
   }

   // this will pick up a change in group.representation
   static redisplay_subset_page() {
      // clear out displayed lists; show '(None)' placeholders
      $('ul.subset_page_content li').remove();
      $('p.placeholder').show();

      // clear displayed menus, highlighting
      $(window).off('click', SSD.clearMenus)
               .on('click', SSD.clearMenus)
               .off('contextmenu', SSD.clearMenus)
               .on('contextmenu', SSD.clearMenus);
      SSD.clearMenus();

      // Display from data
      SSD.Subgroup.displayAll();
      SSD.Subset.displayAll();
      SSD.Partition.displayAll();

      $('#subset_page').off('click', SSD.clickHandler).on('click', SSD.clickHandler);

      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
   }

   static clickHandler(event) {
      event.preventDefault();
      const $curr = $(event.target).closest('[action]');
      if ($curr.attr('action') !== undefined) {
         if ($curr.hasClass('hasMenu')) {
            SSD.clearMenus();
            const $menu = eval($curr.attr('action'));
            $curr.addClass('highlighted').append($menu);
            SSD.setMenuLocations(event, $menu);
            event.stopPropagation();
         } else {
            eval($curr.attr('action'));
         }
      }
      MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
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

   static getHeaderMenu($curr) {
      return $(eval(Template.HTML('#headerMenu_template')));
   }
}
SSD.Subset = class Subset {
   constructor (elements) {
      if (elements === undefined) {
         this.elements = new BitSet(group.order);
      } else if (Array.isArray(elements)) {
         this.elements = new BitSet(group.order, elements);
      } else {
         this.elements = elements;
      }
      this.index = SSD.Subset.list.length;
      SSD.Subset.list[this.index] = this;
      $('#subsets_placeholder').hide();
      $('#subsets').append(this.listItem).show();
   }

   get name() {
      return `<i>S<sub>${this.index}</sub></i>`;
   }

   get listItem() {
      const index = this.index,
            numElements = this.elements.popcount();
      let items = this.elements
                      .toArray()
                      .slice(0, 3)
                      .map( el => math(window.group.representation[el]) )
                      .join(', ');
      if (numElements > 3) {
         items += ', ...';
      }
      return eval(Template.HTML('#subset_template'));
   }

   get menu() {
      return eval(Template.HTML('#subsetMenu_template'));
   }

   static closure(elements) {
      new SSD.Subset(group.closure(elements));
   }

   static displayAll() {
      if (SSD.Subset.list.every( _ => false )) { // defined elements?
         $('#subsets_placeholder').show();
         $('#subsets').hide();
      } else {
         $('#subsets_placeholder').hide();
         $('#subsets').html(SSD.Subset.list.reduce( ($acc, el) => $acc.append(el.listItem),
                                                    $(document.createDocumentFragment()) ))
                      .show();
      }
   }

   static delete($curr, index) {
      delete(SSD.Subset.list[index]);
      $curr.closest('li.highlighted').remove()
      if (SSD.Subset.list.every( _ => false )) { // no defined elements?
         $('#subsets').hide();
         $('#subsets_placeholder').show();
      }
   }

   static getMenu($curr, index) {
      return $(SSD.Subset.list[index].menu)
   }

   static init() {
      SSD.Subset.list = [];
   }

   static nextName() {
      return `<i>S<sub>${SSD.Subset.list.length}</sub></i>`;
   }

   static createFromOperation(operation, name_1, name_2) {
      const getElements = el => {
         const thisName = el.name;
         if (name_1 == thisName) {
            elements_1 = el.elements;
         } else if (name_2 == thisName) {
            elements_2 = el.elements;
         }
      }

      let elements_1, elements_2;
      SSD.Subgroup.list.forEach( el => getElements(el) );
      SSD.Subset.list.forEach( el => getElements(el) );
      SSD.Partition.list.forEach( p =>
         p.items.forEach( el => getElements(el) )
      );

      let newElements;
      switch (operation) {
         case 'intersection':
            newElements = BitSet.intersection(elements_1, elements_2);
            break;
         case 'union':
            newElements = BitSet.union(elements_1, elements_2);
            break;
         case 'elementwise product':
            newElements = new BitSet(group.order);
            for (let i = 0; i < elements_1.len; i++) {
               if (elements_1.isSet(i)) {
                  for (let j = 0; j < elements_2.len; j++) {
                     if (elements_2.isSet(j)) {
                        newElements.set(group.multtable[i][j]);
                     }
                  }
               }
            }
            break;
         default: alert('big problem!');
      }

      new SSD.Subset(newElements);
   }

   static intersectionMenu(exceptionName) {
      const action =
         "SSD.Subset.createFromOperation('intersection', '${exceptionName}', '${thisName}')";
      return SSD.Subset.menuItems(exceptionName, action, "intersection");
   }

   static unionMenu(exceptionName) {
      const action =
         "SSD.Subset.createFromOperation('union', '${exceptionName}', '${thisName}')";
      return SSD.Subset.menuItems(exceptionName, action, "union");
   }

   static elementwiseProductMenu(exceptionName) {
      const action =
         "SSD.Subset.createFromOperation('elementwise product', '${exceptionName}', '${thisName}')";
      return SSD.Subset.menuItems(exceptionName, action, "elementwise product");
   }

   static menuItems(exceptionName, action, setOperation) {
      const li = thisName => (thisName == exceptionName) ? '' :
                           eval('`' + `<li action="${action}">the ${setOperation} of ` +
                                `${math(exceptionName)} with ${math(thisName)}</li>` + '`');
      let frag = '';
      SSD.Subgroup.list.forEach( el => frag += li(el.name) );
      SSD.Subset.list.forEach( el => frag += li(el.name) );
      SSD.Partition.list.forEach( p =>
         p.items.forEach( el => frag += li(el.name) )
      );
      return frag;
   }
}

SSD.SubsetEditor = class SubsetEditor {
   static open(setIndex) {
      const elements = setIndex === undefined ?
                       new BitSet(group.order) : SSD.Subset.list[setIndex].elements;
      const setName = setIndex === undefined ?
                      `<i>S<sub>${SSD.Subset.list.length}</sub></i>` :
                      SSD.Subset.list[setIndex].name;
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
   constructor (items) {
      this.partitionIndex = SSD.Partition.list.length;
      SSD.Partition.list.push(this);

      this.items = items;
   }

   static init() {
      SSD.Partition.list = [];
      if (SSD.Partition.item === undefined) {
         SSD.Partition.item = class  {
            constructor(parent, subIndex, elements, name, partitionClass) {
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

            get listItem() {
               return eval(Template.HTML('#' + this.partitionClass + '_template'));
            }
         }
      }
   }

   get listItem() {
      return this.items
                 .map( item => item.listItem )
                 .join('');
   }

   get name() {
      return this.items[0].name +
             ', ..., ' +
             this.items[this.items.length - 1].name;
   }

   static delete($curr, index) {
      SSD.Partition.list[index].delete($curr);
      delete(SSD.Partition.list[index]);
      if (SSD.Partition.list.every( _ => false )) { // no defined elements?
         $('#partitions').hide();
         $('#partitions_placeholder').show();
      }
   }

   static displayAll() {
      if (SSD.Partition.list.every( _ => false )) { // no defined elements?
         $('#partitions_placeholder').show();
         $('#partitions').hide();
      } else {
         $('#partitions_placeholder').hide();
         $('#partitions').html(
            SSD.Partition.list.reduce( ($acc, el) => $acc.append(el.listItem),
                                       $(document.createDocumentFragment()) ))
                         .show();
      }
   }

   static getMenu($curr, index, subIndex) {
      return $(SSD.Partition.list[index].items[subIndex].menu)
   }
}

SSD.ConjugacyClasses = class ConjugacyClasses extends SSD.Partition {
   constructor() {
      super([]);

      group.conjugacyClasses.forEach(
         elements => this.items.push(
            new SSD.Partition.item(this,
                                   this.items.length,
                                   elements,
                                   `<i>CC<sub>${this.items.length}</sub></i>`,
                                   'conjugacyClass')
         ));

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete($curr) {
      $('#partitions li.conjugacyClass').remove();
   }
}
SSD.Cosets = class Cosets extends SSD.Partition {
   constructor(index, side) {
      super([]);

      this.subgroupIndex = index;
      this.subgroupName = SSD.Subgroup.list[index].name;
      this.isLeft = side == 'left';
      this.side = side;

      const cosets = group.getCosets(SSD.Subgroup.list[index].elements, this.isLeft);
      for (const coset of cosets) {
         const rep = math(group.representation[coset.first()]);
         const name = this.isLeft ? rep + this.subgroupName : this.subgroupName + rep;
         this.items.push(new SSD.Partition.item(this,
                                                this.items.length,
                                                coset,
                                                name,
                                                'cosetClass'));
      }

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete() {
      $(`#partitions li.${this.side}coset${this.subgroupIndex}`).remove();
   }
}
SSD.OrderClasses = class OrderClasses extends SSD.Partition {
   constructor() {
      super([]);

      window.group.orderClasses.forEach(
         elements => this.items.push(
            new SSD.Partition.item(this,
                                   this.items.length,
                                   elements,
                                   `<i>OC<sub>${this.items.length}</sub></i>`,
                                   'orderClass')
         ));

      $('#partitions_placeholder').hide();
      $('#partitions').append(this.listItem).show();
   }

   delete($curr) {
      $('#partitions li.orderClass').remove();
   }
}

SSD.Subgroup = class Subgroup {
   constructor (index) {
      this.index = index;
      this.elements = group.subgroups[index].members;
      SSD.Subgroup.list[index] = this;
   }

   get name() {
      return `<i>H<sub>${this.index}</sub></i>`;
   }

   get listItem() {
      const index = this.index,
            items = window.group.subgroups[index].generators.toArray()
                          .map( el => math(group.representation[el]) ).join(', ');
      switch (index) {
         case 0:
            return eval(Template.HTML('#firstSubgroup_template'));
         case window.group.subgroups.length - 1:
            return eval(Template.HTML('#lastSubgroup_template'));
         default:
            return eval(Template.HTML('#subgroup_template'));
      }
   }

   get menu() {
      return eval(Template.HTML('#subgroupMenu_template'));
   }

   static createNormalizer(index) {
      new SSD.Subset(
         new SubGroupFinder(window.group).findNormalizer(window.group.subgroups[index]).members );
   }


   static displayAll() {
      const $frag = $(document.createDocumentFragment());
      window.group.subgroups.forEach( (_, inx) => $frag.append(new SSD.Subgroup(inx).listItem) );
      $('#subgroups').html($frag);
   }

   static getMenu($curr, index) {
      return $(SSD.Subgroup.list[index].menu);
   }

   static init() {
      SSD.Subgroup.list = [];
   }
}
