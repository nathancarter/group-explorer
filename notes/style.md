## Javascript style

It's a generally accepted notion in the programming community that a consistent, readable coding style makes it easier to understand and (God forbid!) debug programs. It can offer hints to the original programmers' intentions, particularly important in light of JS's dynamic typing. The current GE3 code base is a hodgepodge of styles that have evolved over the course of development.  In the interest of presenting a more consistent view here are some specific suggestions for future work. Feel free to offer other approaches, there's no reason to believe yours won't be an improvement :-)

### Code layout

* indent four spaces (current code is a mix of three and four spaces -- sigh)
* where applicable, prefer `const` over `let`, and `let` over `var`
* favor printable Unicode characters over entities (e.g., put `ℤ` in your code rather than `&Zopf;` or `&#8484;`)
* use the One True Brace style for if-then-else constructs, K&R ok for isolated if statements
* put a space between the function name and the parenthesis following it in the declaration, but not in its invocation (it makes it easier to find the declaration)
    * declaration: `function highlightByNodeColor (elements) {`
    * use: `highlightByNodeColor(some_elements)`
* use [Flow](http://flow.org) annotations in js code (it's a good way to find errors during development, and it's great source of documentation during maintenance)

### Variable naming

* local variables are `snake_case`
* instance variable are `this.snake_case`
* class static variables are `Class.snake_case`
* global variables are `Snake_case`
* global constants (real constants, not const's) are `SNAKE_CASE`
* class static constants (real constants, not const's) are `Class.SNAKE_CASE`
* functions are `camelCase`
* functions intended for private use within a class are `_camelCase`
* variables intended for private use within a class are `_snake_case`
* classes are `CamelCase`
* HTML attribute values are `kebab-case`
* names starting with `$` refer to JQuery objects, to differentiate them from similar but different DOM objects:
    * `let $foo = $('#foo')`
    * `let foo = $('#foo')[0]`

### Random sources

There are a lot of good suggestions in these docs. I've adopted some explicitly, but need to expand.

* [Google](https://google.github.io/styleguide/jsguide.html#special-characters)
* [W3Schools](https://www.w3schools.com/js/js_conventions.asp)
* [StandardJS](https://standardjs.com/rules.html)
* [Douglas Crockford](https://www.crockford.com/javascript/)
