
The Group Info page is the presentation to the user of all information *Group
Explorer* has about a given group. 

It consists of several sections, each with a heading and a body.  On first
visiting the page most of the bodies are hidden, as indicated by a '+' sign to
the left of the heading. Clicking the '+' sign expands the body, and changes the
'+' sign to a '-'. Clicking the '-' sign hides the body again. You can also
hide/expose all the section together by clicking on the 'v' and '^' icons in the
upper right-hand corner of the page.

Let us consider each section that appears in a Group Info page separately.  It
may help you to open [an example group info page
now](../../GroupInfo.html?groupURL=groups/Z_5.group) and read it alongside this
help page.

## Facts

The section presents basic facts about a group such as its
[definition](rf-groupterms.md#definition-of-a-group-via-generators-and-relations),
[order](rf-groupterms.md#order), and any other names it has besides its primary
name (which is the title of each Group Info page).  Some (but not all) groups
contain notes with a description of the group, which appears in this
section.

## Views

*Group Explorer* is all about visualization, and thus the Views section receives
high priority. To the right of the heading a row of small thumbnails shows a
sample of the various ways to visualize the group. Expanding this section by
clicking the '+' sign to the left of the heading exposes larger previews of
every way to visualize the group, including all the [Cayley
diagrams](rf-groupterms.md#cayley-diagrams), a [multiplication
table](rf-groupterms.md#multtable), a [cycle
graph](rf-groupterms.md#cycle-graph), and any [objects of
symmetry](rf-groupterms.md#objects-of-symmetry) the group has.

## Computed properties

*Group Explorer* computes information about each group it loads. For example, it
computes all of its subgroups, which ones are normal, information about
conjugacy classes, and more. A summary of this information is shown to the right
of each subheading in this section, but **much** more information is available
than it may seem from the summaries. Users are encouraged to expand the bodies
by clicking on the '+' sign to the left of each subheading to find out reasons
for the computations, and often many additional helpful illustrations and
computations.

## Generators

Groups can be [generated](rf-groupterms.md#generators-for-a-group-or-subgroup)
in many ways and some groups come with a few different commonly-used
sets of generators chosen. If the group has no pre-selected set of
generators built in, *Group Explorer* computes one such (minimum-size)
set when the group is loaded. Each list of generators is given in this
section.

CITE(VGT-1.4 VGT-2.3)

## Naming schemes

The structure of a group is independent of whatever symbols we use to
represent the elements of the group. For this reason, a group may come with
several different lists of names for its elements, and the user may choose
any one of them to be used as the primary way of representing the elements
of the group. This section lets the user make such a selection and also
create new naming schemes.

This section also lets users remove or edit any of their previously-defined
naming schemes; this information is stored in the user's web browser so that
it will be preserved even when they leave the site.

The section contains a link that reads "Click here to add a new
[representation](rf-geterms.md#representation) for this group" and possibly
also links that read "Click here to edit this representation." (Note that
"[naming scheme](rf-geterms.md#namingscheme)" and
"[representation](rf-geterms.md#representation)" are interchangeable terms.)
In both cases, if you click the link, an interface like the following one
appears, allowing you to custom-define a naming scheme for the elements of
the group.

![Group element naming scheme interface](illustration-namescheme.png)

The left column lists the default element names, and you can click
entries in the right column and type any (plain) text you like. As you can
see in the image above, the user is typing the word "changing..." in the
top right cell of the table. When you are done, if you choose OK, your
changes will be committed and you will have defined a new representation (or
changed an old representation) of the elements of the group.

Links in the group info window to edit representations are present only for
representations that the user has created. Naming schemes built into the
group in *Group Explorer* are uneditable by the end user.

## Notes

Users can add their own personal notes to a group to supplement the default
information in any way they see fit. Such information appears in this
section, with controls for editing it. It is text only (not HTML) and will
be stored in the user's browser.

## File data

This section presents information about the group definition, as opposed to
mathematical information about the group itself.  It includes such items as URL
from which the group definition was downloaded, and its author.
