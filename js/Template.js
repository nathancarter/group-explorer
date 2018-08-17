
/*
 * Caching template fetch --
 *   returns html of selector HTML as `string` for subsequent eval
 */

class Template {
   static HTML(selector) {
      Template._map = (Template._map === undefined) ? new Map() : Template._map;

      if (!Template._map.has(selector)) {
         Template._map.set(selector,  '`' + $(selector).html() + '`');
      };

      return Template._map.get(selector);
   }
}
