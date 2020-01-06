/* @flow
## Multi-level Logging

The routines in this class perform simple logging and error reporting functions using console info/warn/error messages and the browser alert. Messages will be logged/alerted if they are at or higher than the current log level. There are five log levels defined: 'debug', 'info', 'warn', 'err', and 'none'. The default log level is 'warn' and the default alert level is 'err'. The log level may be set from the URL, thus:
  <br>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/group-explorer/Multtable.html?groupURL=./groups/D_4.group&<b>log=info&alert=warn</b>
<br>And it may be set by invoking `Log.setLogLevel(string)` or `Log.setAlertLevel(string)` at the debug console. 

```js
 */
/*::
  type logLevel = 'debug' | 'info' | 'warn' | 'err' | 'none';
*/

export default
class Log {
/*::
   static logLevels: {[key: logLevel]: number};
   static logFunctions: Array<(Array<any>) => void>;
   static logLevel: number;
   static alertLevel: number;
   static alertsRemaining: number;
 */
   static init() {
      const DEFAULT_LOG_LEVEL = 'warn';
      const DEFAULT_ALERT_LEVEL = 'err';
      const MAX_ALERT_COUNT = 3;
      Log.logLevels = {debug: 0, info: 1, warn: 2, err: 3, none: 4};
      Log.logFunctions = [console.log, console.info, console.warn, console.error];
      Log.setLogLevel(new URL(window.location.href).searchParams.get('log') || DEFAULT_LOG_LEVEL);
      Log.setAlertLevel(new URL(window.location.href).searchParams.get('alert') || DEFAULT_ALERT_LEVEL);
      Log.alertsRemaining = MAX_ALERT_COUNT;  // number of alerts remaining before we quit showing them
   }

   static setLogLevel(level /*: string */) {
      if (Log.logLevels.hasOwnProperty(level)) {
         Log.logLevel = Log.logLevels[((level /*: any */) /*: logLevel */)];
      }
   }

   static setAlertLevel(level /*: string */) {
      if (Log.logLevels.hasOwnProperty(level)) {
         Log.alertLevel = Log.logLevels[((level /*: any */) /*: logLevel */)];
      }
   }

   static _log(thisLevel /*: number */, args /*: Array<any> */) {
      if (thisLevel >= Log.logLevel) {
         Log.logFunctions[thisLevel](...args);
      }
      if (thisLevel >= Log.alertLevel && Log.alertsRemaining-- > 0) {
         alert(args);
      }
   }

   static debug(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['debug'], args);
   }

   static info(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['info'], args);
   }

   static warn(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['warn'], args);
   }

   static err(...args /*: Array<mixed> */) {
      Log._log(Log.logLevels['err'], args);
   }
}

// initialize static properties on window load
window.addEventListener('load', Log.init, {once: true});
/*
```
 */
