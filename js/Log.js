// simple debug log function

class Log {
   static init(debug) {
      Log.debug = (debug === undefined) ? false : debug;
   }

   static log(msg) {
      if (Log.debug) {
         console.log(msg);
      }
   }
}

// initialize static properties
Log.init();
