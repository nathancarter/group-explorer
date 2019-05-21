
/*
 * This file is compiled by the "make" process in the Group
 * Explorer project at https://github.com/nathancarter/group-explorer.
 * The resulting ge-lib.js file is not used by that project
 * directly, but is just a way for that project to wrapp all of
 * its most important JavaScript code into one file.  Then a
 * separate project (called "ge-lib") imports the latest version
 * of that file, installs several other useful utilities, and
 * packages it up for use as a node.js module.
 *
 * If you're reading this file in the Group Explorer repository,
 * know that it is not used here.  It is built here as part of
 * our build process, but then exported to another poject:
 * https://github.com/nathancarter/ge-lib
 *
 * If you're reading this file in the ge-lib repository, know
 * that this file should NOT be edited in that repository.  It
 * is compiled as part of the Group Explorer build process, so
 * any changes to its content will need to take place by changing
 * source files in that repository, recompiling ge-lib.js, and
 * then re-importing it into the ge-lib project's repository.
 *
 * The ge-lib.js file is built from four files, in this order:
 *  1. js/ge-lib-preamble.js
 *     This declares several global variables that exist in the
 *     browser when running Group Explorer, without which much of
 *     its code will not make sense nor run.
 *  2. build/allGroupExplorer.js
 *     This is the concatenation of most of the code in the
 *     Group Explorer application.
 *  3. groupURLs.js
 *     This is the list of groups in the Group Explorer library
 *     on disk, assigned into a global JavaScript variable.
 *  4. js/ge-lib-endmatter.js
 *     This file copies into the module.exports object all of the
 *     Group Explorer classes and functions that should be
 *     exported by the ge-lib module.  It also tweaks how the
 *     Library object loads groups, to deal with the fact that
 *     it is not using the filesystem rather than AJAX requests.
 */

const LocalStorage = require( 'node-localstorage' ).LocalStorage;
localStorage = new LocalStorage( './tmp' );

const { JSDOM } = require( 'jsdom' );
const { window } = new JSDOM();
const { document } = ( new JSDOM( '' ) ).window;
global.document = document;

var $ = jQuery = require( 'jquery' )( window );

THREE = require( 'three' );
