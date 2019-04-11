
/*
# Version

A simple class containing version information used to document GE releases.  The static`Version.label()`method produces the formatted output displayed in the upper right-hand corner of the [main (group library)](help/rf-um-mainwindow) page, the [group info](help/rf-um-groupwindow) pages, [sheets](help/rf-um-sheetwindow), and [visualizer](help/rf-um-largewindow) pages.
   
```js
*/

class Version {
   static label() {
      return `GE ${Version.major}.${Version.minor} ${Version.suffix}`
   }
}

Version.major = '3';
Version.minor = '0';
Version.suffix = 'alpha';
/*
```
*/
