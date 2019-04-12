// simple debug log function

class Log {
   static debug = false;

   static log(msg) {
      if (Log.debug) {
         console.log(msg);
      }
   }
}
