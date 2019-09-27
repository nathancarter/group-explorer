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

