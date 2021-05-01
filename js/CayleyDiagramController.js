// @flow

import {THREE} from '../lib/externals.js';

import {Group, Cayley_Diagram_View} from '../CayleyDiagram.js';
import BitSet from '../js/BitSet.js';
import {CayleyGeneratorFromStrategy, DIRECTION_INDEX, AXIS_NAME} from '../js/CayleyGenerator.js';
import GEUtils from '../js/GEUtils.js';
import Log from '../js/Log.js';
import Menu from '../js/Menu.js';
import Template from '../js/Template.js';

export {load, update};

const DIAGRAM_PANEL_URL /*: string */ = './html/CayleyDiagramController.html'

class Arrow {
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
      $('#arrow-remove-button').attr('action', `Arrow.removeArrow(${element})`);
      $('#arrow-remove-button').prop('disabled', false);
   }

   // returns all arrows displayed in arrow-list as an array
   static getAllArrows() /*: Array<groupElement> */ {
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
         const result = Group.elements
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
            .appendTo('#arrow-add-button');
      Menu.addMenus($menus, event, clickHandler);
   }

   // Add button menu element clicked:
   //   Hide menu
   //   Add lines to Cayley_diagram
   //   Update lines, arrowheads in graphic, arrow-list
   static addArrow(element /*: number */) {
      GEUtils.cleanWindow();
      Cayley_Diagram_View.addArrows([element]);
      Arrow.updateArrows();
   }

   // Remove button clicked
   //   Remove highlighted row from arrow-list
   //   Disable remove button
   //   Remove line from Cayley_diagram
   //   Update lines in graphic, arrow-list
   static removeArrow(element /*: number */) {
      $('#remove-arrow-button').prop('disabled', true);
      Cayley_Diagram_View.removeArrows([element]);
      Arrow.updateArrows()
   }

   // clear arrows
   // set line colors in Cayley_diagram
   // update lines, arrowheads in CD
   // add rows to arrow list from line colors
   static updateArrows() {
      $('#arrow-list').children().remove();
      // ES6 introduces a Set, but does not provide any way to change the notion of equality among set members
      // Here we work around that by joining a generator value from the line.arrow attribute ("27") and a color ("#99FFC1")
      //   into a unique string ("27#99FFC1") in the Set, then partitioning the string back into an element and a color part
      const arrow_hashes = new Set(Cayley_Diagram_View.arrows.map(
          (arrow) => '' + arrow.generator.toString() + '#' + (new THREE.Color(arrow.color).getHexString())
      ));
      arrow_hashes.forEach( (hash) => {
         const element = hash.slice(0,-7);
         const color = hash.slice(-7);
         $('#arrow-list').append(eval(Template.HTML('arrow-list-item-template')));  // make entry in arrow-list
      } );
      if (arrow_hashes.size == Group.order - 1) {  // can't make an arrow out of the identity
         Arrow.disable()
      } else {
         Arrow.enable()
      }
   }

   // disable Add button
   static enable() {
      $('#arrow-add-button').prop('disabled', false);
   }

   // enable Add button
   static disable() {
      $('#arrow-add-button').prop('disabled', true);
   }
}


class Chunking {
   static updateChunkingSelect() {
      // check that first generator is innermost, second is middle, etc.
      const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      if (   Cayley_Diagram_View.isGenerated
          && generator.strategies.every( (strategy, inx) => strategy.nesting_level == inx ) ) {
         Chunking.enable();

         $('#chunk-choices').html(eval(Template.HTML('chunk-no-chunking-template')));
         generator.strategies.slice(0, -1).reduce( (generators, strategy, inx) => {
            generators.push(Group.representation[strategy.generator]);
            const subgroup_index = Group.subgroups.findIndex( (subgroup) => subgroup.members.equals(strategy.elements) );
            $('#chunk-choices').append(eval(Template.HTML('chunk-select-subgroup-template')));
            return generators;
         }, [] );
         $('#chunk-choices').append(eval(Template.HTML('chunk-select-whole-group-template')));
         Chunking.selectChunk(generator.chunk);
      } else {
         Chunking.disable();
      }
   }

   static toggleChoices() {
      const choices = $('#chunk-choices');
      const new_visibility = choices.css('visibility') == 'visible' ? 'hidden' : 'visible';
      choices.css('visibility', new_visibility);
   }

   static selectChunk(subgroup_index /*: number */) {
      if (Chunking.isDisabled()) return;
      $('#bodyDouble').click();
      const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      const subgroup_members = Group.subgroups[subgroup_index].members;
      const strategy_index = generator.strategies.findIndex( (strategy) => strategy.elements.equals(subgroup_members) );
      $('#chunk-choice').html($(`#chunk-choices > li:nth-of-type(${strategy_index + 2})`).html());
      Cayley_Diagram_View.chunk = (strategy_index == -1) ? 0 : subgroup_index;
   }

   static enable() {
      $('#chunking-fog').hide();
      $('#chunk-select').prop('disabled', false);
   }

   static disable() {
      if (Cayley_Diagram_View.isGenerated) {
         const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
         generator.chunk = 0;
      }

      const $chunking_fog = $('#chunking-fog');
      $chunking_fog.css('height', '100%');
      $chunking_fog.css('width', '100%');
      $chunking_fog.show();

      $('#chunk-select').prop('disabled', true);
   }

   static isDisabled() /*: boolean */ {
      return $('#chunk-select').prop('disabled');
   }
}


class DiagramChoice {
   /* Populate diagram select element, show selected diagram */
   static setupDiagramSelect() {
      const $choices = Group.cayleyDiagrams.reduce(
         ($frag, diagram) => $frag.append(eval(Template.HTML('diagram-choice-template'))),
         $(document.createDocumentFragment()).append(eval(Template.HTML('diagram-generate-diagram-template'))))
      $('#diagram-choices')
         .html((($choices /*: any */) /*: DocumentFragment */))
         .css('visibility', 'hidden');
      DiagramChoice._showChoice();
   }

   static _showChoice() {
      $('#diagram-choices').css('visibility', 'hidden');
      const index = Group.cayleyDiagrams.findIndex( (cd) => cd.name == Cayley_Diagram_View.diagram_name );
      $('#diagram-choice')
         .html($(`#diagram-choices > li:nth-of-type(${index+2})`).html());
   }

   static toggleChoices() {
      const choices = $('#diagram-choices');
      const new_visibility = choices.css('visibility') == 'visible' ? 'hidden' : 'visible';
      choices.css('visibility', new_visibility);
   }

   static selectDiagram(diagram /*: ?string */, andDisplay /*:: ?: boolean */ = true) {
      $('#bodyDouble').click();
      Cayley_Diagram_View.diagram_name = diagram;
      Chunking.enable();
      DiagramChoice._showChoice();
      update();
   }
}

/*::
import type {Layout, Direction, StrategyParameters} from '../js/CayleyDiagramView.js';
*/

class Generator {
/*::
   static axis_label: {[key: Layout]: {[key: Direction]: string}};
   static axis_image: {[key: Layout]: {[key: Direction]: string}};
   static orders: Array<Array<string>>;
 */
   static init () {
      // layout choices (linear/circular/rotated), direction (X/Y/Z)
      Generator.axis_label = {
         linear:   { X: 'Linear in <i>x</i>',
                     Y: 'Linear in <i>y</i>',
                     Z: 'Linear in <i>z</i>' },
         circular: { YZ: 'Circular in <i>y</i>, <i>z</i>',
                     XZ: 'Circular in <i>x</i>, <i>z</i>',
                     XY: 'Circular in <i>x</i>, <i>y</i>' },
         rotated:  { YZ: 'Rotated in <i>y</i>, <i>z</i>',
                     XZ: 'Rotated in <i>x</i>, <i>z</i>',
                     XY: 'Rotated in <i>x</i>, <i>y</i>' },
      };

      Generator.axis_image = {
         linear:   { X: 'axis-x.png', Y: 'axis-y.png', Z: 'axis-z.png' },
         circular: { YZ: 'axis-yz.png', XZ: 'axis-xz.png', XY: 'axis-xy.png'},
         rotated:  { YZ: 'axis-ryz.png', XZ: 'axis-rxz.png', XY: 'axis-rxy.png'},
      };

      // wording for nesting order
      Generator.orders = [
         ['N/A'],
         ['inside', 'outside'],
         ['innermost', 'middle', 'outermost'],
         ['innermost', 'second innermost', 'second outermost', 'outermost'],
         ['innermost', 'second innermost', 'middle', 'second outermost', 'outermost']
      ];

      $('#multiplication-control input').each(
         (_inx, el) => el.addEventListener('click', () => Generator.setMult(`${el.id}`))
      );
   }

   /*
    * Draw Generator table
    */
   static draw () {
      // clear table
      const $generation_table = $('#generation-table');
      $generation_table.children().remove();

      // add a row for each strategy in Cayley diagram
      const strategies = Cayley_Diagram_View.strategy_parameters;
      if (strategies == undefined) {
         $('#generation-table').html(
            '<tr style="height: 3em"><td></td><td style="width: 25%"></td><td style="width: 40%"></td><td></td></tr>');
      } else {
         strategies.forEach( (strategy, inx) => {
            $generation_table.append($(eval(Template.HTML('generation-table-row-template'))));
         } );
      }
   }

   /*
    * Show option menus for the columns of the Generator table
    */
   static showGeneratorMenu (click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      // show only elements not generated by previously applied strategies
      const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      const eligibleGenerators = ( (strategy_index == 0) ?
                                   new BitSet(Group.order, [0]) :
                                   generator.strategies[strategy_index-1].elements.clone() )
            .complement().toArray();


      // returns an HTML string with a list element for each arrow that can be added to the arrow-list
      const makeEligibleGeneratorList = () /*: html */ => {
         const template_html = Template.HTML('generation-generator-menu-item-template');
         const result = eligibleGenerators
               .reduce( (generators, generator) => (generators.push(eval(template_html)), generators), [] )
               .join('');
         return result;
      }

      const $menus = $(eval(Template.HTML('generation-generator-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location, clickHandler);
   }

   static showAxisMenu (click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      // previously generated subgroup must have > 2 cosets in this subgroup
      //   in order to show it in a curved (circular or rotated) layout
      const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      const curvable =
            (generator.strategies[strategy_index].elements.popcount()
             /  ((strategy_index == 0) ? 1 : generator.strategies[strategy_index - 1].elements.popcount()))
      > 2;

      const $menus = $(eval(Template.HTML('generation-axis-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location, clickHandler);
   }

   static showOrderMenu (click_location /*: eventLocation */, strategy_index /*: number */) {
      $('#bodyDouble').click();

      const generator = ((Cayley_Diagram_View.generator /*: any */) /*: CayleyGeneratorFromStrategy */);
      const makeStrategyList = () => {
         const template = Template.HTML('generation-order-menu-item-template');
         const result = generator.strategies
               .reduce( (orders, _strategy, order) => (orders.push(eval(template)), orders), [])
               .join('');
      return result;
      };
      
      const num_strategies = generator.strategies.length;
      const $menus = $(eval(Template.HTML('generation-order-menu-template')))
            .appendTo('#generation-table');

      Menu.addMenus($menus, click_location, clickHandler);
   }

   static makeOrganizeByMenu () {
      const template = Template.HTML('generation-organize-by-menu-item-template');
      const result = Group.subgroups
           .reduce( (list, subgroup, inx) => {
              if (subgroup.order != 1 && subgroup.order != Group.order) {  // only append non-trivial subgroups
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
   static organizeBy (subgroup_index /*: number */) {
      // get subgroup generators
      const subgroup_generators = Group.subgroups[subgroup_index].generators.toArray();

      // add subgroup generator(s) to start of strategies
      for (let g = 0; g < subgroup_generators.length; g++) {
         Generator.updateGenerator(g, subgroup_generators[g]);
         Generator.updateOrder(g, g);
      }
   }

   static updateGenerator (strategy_index /*: number */, generator /*: number */) {
      const strategy_parameters = ((Cayley_Diagram_View.strategy_parameters /*: any */) /*: Array<StrategyParameters> */);
      strategy_parameters[strategy_index].generator = generator;
      updateStrategies(strategy_parameters);
   }

   static updateAxes (strategy_index /*: number */, layout /*: Layout */, direction /*: Direction */) {
      const strategy_parameters = ((Cayley_Diagram_View.strategy_parameters /*: any */) /*: Array<StrategyParameters> */);
      strategy_parameters[strategy_index].layout = layout;
      strategy_parameters[strategy_index].direction = direction;
      updateStrategies(strategy_parameters);
   }

   static updateOrder (strategy_index /*: number */, order /*: number */) {
      const strategy_parameters = ((Cayley_Diagram_View.strategy_parameters /*: any */) /*: Array<StrategyParameters> */);
      const other_strategy = strategy_parameters.findIndex( (strategy) => strategy.nestingLevel == order );
      strategy_parameters[other_strategy].nestingLevel = strategy_parameters[strategy_index].nestingLevel;
      strategy_parameters[strategy_index].nestingLevel = order;
      updateStrategies(strategy_parameters);
   }

   /*
    * Drag-and-drop generation-table rows to re-order generators
    */
   static dragStart (dragstartEvent /*: DragEvent */) {
      const target = ((dragstartEvent.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dragstartEvent.dataTransfer /*: any */) /*: DataTransfer */);
      dataTransfer.setData('text/plain', target.textContent);
   }

   static drop (dropEvent /*: DragEvent */) {
      dropEvent.preventDefault();
      const target = ((dropEvent.target /*: any */) /*: HTMLElement */);
      const dataTransfer = ((dropEvent.dataTransfer /*: any */) /*: DataTransfer */);
      const dest = parseInt(target.textContent);
      const src = parseInt(dataTransfer.getData('text/plain'));
      const strategy_parameters = ((Cayley_Diagram_View.strategy_parameters /*: any */) /*: Array<StrategyParameters> */);
      strategy_parameters.splice(dest-1, 0, strategy_parameters.splice(src-1, 1)[0]);
      updateStrategies(strategy_parameters);
   }

   static dragOver (dragoverEvent /*: DragEvent */) {
         dragoverEvent.preventDefault();
   }

   static setMult (rightOrLeft /*: string */) {
      Cayley_Diagram_View.right_multiply = (rightOrLeft == 'right');
   }
}

/*
 * Internal routines, not exported
 */

// Remove redundant generators, check whether there are enough elements to use curved display
function refineStrategies (strategies /*: Array<StrategyParameters> */) {
   const generators_used = new BitSet(Group.order);
   let elements_generated = new BitSet(Group.order, [0]);
   strategies = strategies.reduce( (nonRedundantStrategies, strategy) => {
      if (!elements_generated.isSet(strategy.generator)) {
         const old_size = elements_generated.popcount();
         generators_used.set(strategy.generator);
         elements_generated = Group.closure(generators_used);
         const new_size = elements_generated.popcount();

         if (strategy.layout != 'linear' && new_size / old_size < 3) {
            strategy.layout = 'linear';
            if (strategy.direction != 'X' && strategy.direction != 'Y' && strategy.direction != 'Z') {
               strategy.direction = 'X';
            }
         }

         nonRedundantStrategies.push(strategy);
      }
      return nonRedundantStrategies;
   }, []);

   // fix nesting order
   strategies.slice().sort( (a,b) => a.nestingLevel - b.nestingLevel ).map( (el,inx) => (el.nestingLevel = inx, el) );

   // add elements to generate entire group; append to nesting
   if (elements_generated.popcount() != Group.order) {
      // look for new element -- we know one exists
      const new_generator = ((elements_generated
                              .complement()
                              .toArray()
                              .find( (el) => Group.closure(generators_used.clone().set(el)).popcount() == Group.order ) /*: any */) /*: groupElement */);
      // among linear layouts, try to find a direction that hasn't been used yet
      const unused_direction =
            strategies.reduce( (unused_directions, {layout, direction}) => {
               if (layout == 'linear') {
                  unused_directions.clear(DIRECTION_INDEX[direction]);
               }
               return unused_directions;
            }, new BitSet(3).setAll() )
            .first();
      const new_direction = (unused_direction == undefined) ? AXIS_NAME[0] : AXIS_NAME[unused_direction];
      strategies.push({generator: new_generator, layout: 'linear', direction: new_direction, nestingLevel: strategies.length});
   }

   return strategies;
}

function updateStrategies (new_strategies /*: Array<StrategyParameters> */) {
   const strategies = refineStrategies(new_strategies);
   Cayley_Diagram_View.strategy_parameters = strategies;
   update();
}


/* Load, initialize diagram control */
async function load ($diagramWrapper /*: JQuery */) /*: Promise<void> */ {
  const data = await GEUtils.ajaxLoad(DIAGRAM_PANEL_URL)

  $diagramWrapper.html(data)

   Generator.init();

   $('#diagram-select')[0].addEventListener('click', clickHandler);

   $('#generation-control')[0].addEventListener('click', clickHandler);
   $('#generation-table')[0].addEventListener('dragstart', Generator.dragStart);
   $('#generation-table')[0].addEventListener('drop', Generator.drop);
   $('#generation-table')[0].addEventListener('dragover', Generator.dragOver);

   $('#arrow-control')[0].addEventListener('click', clickHandler);

   $('#chunk-select')[0].addEventListener('click', clickHandler);

   update();
}

function update() {
   DiagramChoice.setupDiagramSelect();
   Generator.draw();
   Arrow.updateArrows();
   Chunking.updateChunkingSelect();
}

function clickHandler(event /*: MouseEvent */) {
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
