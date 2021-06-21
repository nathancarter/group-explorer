/*
 * Forced Cache Refresh
 *
 * Browsers cache downloads to improve performance, but stale files cached in the browswer
 * interfere with updating GE3. This routine fetches the latest Version.js and js/Migration.js
 * files with { cache: 'reload' } specified to force the cache to refresh its copy.
 *
 * NOTE: This is *NOT* a javascript module, and the <script> element that loads it does not
 * have type="module" specified. Modules in the browser are loaded as deferred, while plain
 * script files as loaded and run in the order they are specified in the document. Having
 * this be a plain file and referencing it before any others allows it to force a cache reload
 * before any module loading has begun, making sure the Version and Migration modules used
 * are the up to date.
 */

const url = new URL(window.location.href)
const urlString = url.origin + url.pathname // trim off query string
const baseURL = urlString.slice(0, urlString.lastIndexOf('/') + 1); // baseURL is part up to last '/'

// kicking off the fetch is enough, we don't have to wait for it to complete
[
  './js/Migration.js',
  './Version.js'
].forEach((fileName) => window.fetch(baseURL + fileName, { cache: 'reload' }))
