// @flow

/* global DOMRect TouchEvent */

/*
 * The functions in this script file define how Group Explorer
 * displays and lets users interact with GAP code throughout
 * the application.
 */

import * as Library from './Library.js'

/*::
import XMLGroup from './XMLGroup.js'
*/

/*
 * We give access to live GAP execution online through the Sage Cell Server
 */

// purpose -> code map
// note that the code contains template string expressions which will be expanded
// when the code is wrapped in back tics '`' and eval'd in getCode
const codeForPurpose = new Map/*:: <string, string> */([
  ['creating this group',
   `# In GAP's Small Groups library, of all the groups
    # of order $\{ord}, this one is number $\{idx}:
    $\{G} := $\{gpdef};`],

  ['checking if a group is abelian',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is abelian:
    IsAbelian( $\{G} );`],

  ['computing the numbers in a class equation',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Get the sizes of all conjugacy classes:
    List( ConjugacyClasses( $\{G} ), Size );`],

  ['checking if a group is cyclic',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is cyclic:
    IsCyclic( $\{G} );`],

  ['getting the list of all subgroups of a group',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask for the list of subgroups:
    AllSubgroups( $\{G} );`],

  ['checking whether a subgroup is normal',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Pick a random subgroup as an example:
    S := Random( AllSubgroups( $\{G} ) );

    # Ask whether it is normal:
    IsNormal( $\{G}, S );`],

  ['getting the lattice of subgroups of a group',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask for the lattice of subgroups:
    LatticeSubgroups( $\{G} );

    # (See the GAP manual for how to manipulate the resulting object.)`],

  ['checking if a group is simple',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is simple:
    IsSimple( $\{G} );`],

  ['computing how many order classes a group has',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Compute all element orders and make a set of those results:
    Set( $\{G}, Order );`],

  ['checking if a group is solvable',
   `# Create the group:
    $\{G} := $\{gpdef};;

    # Ask if it is solvable:
    IsSolvable( $\{G} );`]
])

// executed in parent context: setup iframe in wrapper, invoke iframe routine to show code
export async function setup (purpose /*: string */, group /*: XMLGroup */) {
  const iframeElement = (($('#gap-iframe')[0] /*: any */) /*: HTMLIFrameElement */)

  // load iframe on first time through
  if (iframeElement.contentWindow.GAPCell == null) {
    $(iframeElement)
      .attr('src', Library.getBaseURL() + 'html/ShowGAPCode.html')
      .css({
        'max-width': window.innerWidth,
        'max-height': window.innerHeight
      })

    await new Promise((resolve, reject) => {
      iframeElement.addEventListener('load', () => resolve(), { once: true })
    })
  }

  // get the GAP code to accomplish the purpose for this group and show it in iframeElement
  const code = getCode(purpose, group)
  iframeElement.contentWindow.GAPCell.show(purpose, code)
}

function getCode (purpose /*: string */, group /*: XMLGroup */) /*: string */ {
  // converting an arbitrary string to a JS identifier (not injective)
  function toIdent (str) {
    if (!/^[a-zA-Z_]/.test(str)) str = '_' + str
    return str.replace(/[^a-zA-Z0-9_]/g, '')
  }

  const G = toIdent(group.shortName)
  const [ord, idx] = group.gapid.split(',')
  const gpdef = `SmallGroup( ${ord}, ${idx} )`

  const code = ((codeForPurpose.get(purpose) /*: any */) /*: string */)
  const newCode = eval('`' + code.split('\n').map((line) => line.trim()).join('\n') + '`')

  return newCode
}
