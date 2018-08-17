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
