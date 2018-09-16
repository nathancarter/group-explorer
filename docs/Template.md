/*
# Templates

Most of what appears on the screen in GE3 is dynamic HTML, created at runtime by javascript and formatted by CSS stylesheets. This is often the result of a complex combination of HTML, CSS, and javascript, and it can difficult to read the code behind a web page to understand how the displayed data is derived and how it will appear. Every GE3 web page uses this 'template' pattern (though it may use others, too), making a template from a section of HTML with placeholders in it to represent data values that are to be replaced at runtime. This approach makes it easier to separate the layout of the data from the code that generates it. In GE3 this is done on the client side by javascript using HTML5 template tags and ES6 template literals.

## Example

*(Note that example code may be simplified from the actual implementation.)*

The subset display panel in the visualizer pages provides a ready example. The format for a subgroup is given by a template tag like this, similar to those in [subsets.html](../subsetDisplay/subsets.html):

```html
<template id="subgroup_template">
   <li id="${this.id}">
      ${this.name} = &lt; ${generators} &gt; is a subgroup of ${subgroupOrder}
   </li>
</template>
```

To use the template it is retrieved with a jQuery call, its HTML extracted as a string, and the result turned into a string literal, as done in the [Template.js](#template-retrieval-caching) code below:

```js
'`' + $('template[id="subgroup_template"]').html() + '`'
```

When executed, this `Template.HTML` produces the template contents as a string literal:

```js
`<li id="${this.id}">
   ${this.name} = &lt; ${generators} &gt; is a subgroup of order ${subgroupOrder}
 </li>`
```

Note the back ticks ` at the start and end of the string: this is an ES6 template literal.  When it is eval'd in a scope which has the referenced values defined, as excer[ted from [SSD.Subgroups](../subsetDisplay/Subgroup.js):

```js
const generators = this.subgroup.generators.toArray()
                       .map( el => math(group.representation[el]) ).join(', ');
const subgroupOrder = this.subgroup.order;
const subgroupLine = eval(Template.HTML('subgroup_template');
```

the expressions enclosed by curly braces ${...} are evaluated and replaced in the string. At this point (for one of the subgroups of <i>D<sub>4</sub></i>), `subgroupLine` will be a string of HTML something like:

```html
<li id="1">
   <i>H<sub>1</sub></i> = &lt; <i>r<sup>2</sup></i> &gt; is a subgroup of order 2.
</li>
```

This can be appended to the list of subgroups in the DOM with a simple jQuery command

```js
$('#subgroups').append(subgroupLine)
```

to give the following line in the list of subgroups:

&nbsp;&nbsp;&nbsp;&nbsp;<i>H<sub>1</sub></i> = &lt; <i>r<sup>2</sup></i> &gt; is a subgroup of order 2.


## Template retrieval caching

Since template retrieval is done repeatedly, the actual template retrieval function caches results by template id in a class static variable, which it creates and initializes on the first call.

```js
*/

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

/*
```
*/
