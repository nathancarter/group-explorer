// @flow
// simple debug log function

/*::
  export default
 */
class Log {
/*::
   static debug: boolean;
 */
   static init(debug /*: ?boolean */) {
      Log.debug = (debug == undefined) ? false : debug;
   }

   static log(msg /*: string */) {
      if (Log.debug) {
         console.log(msg);
      }
   }

   static err(msg /*: string */) {
      if (Log.debug) {
         console.error(msg);
      } else {
         alert(msg);
      }
   }
}

// initialize static properties
Log.init();
