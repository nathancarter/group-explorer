
This page is a dictionary of terms specific to *Group Explorer.* Many other
pages in the *Group Explorer* help link here to define terms. Unlike [the
group theory terminology page](rf-groupterms.md), these terms are not
well-known mathematical terms; they're used only in *Group Explorer.*

### Author of a group

The files which store group information are called group files, and they can
contain information about the original author of the file. This person
encoded the description of a finite group into *Group Explorer's* group
definition syntax so that *Group Explorer* could load and manipulate the
group. See also [URL of a group](#url-of-a-group).

### Date of last modification for a group

The date of last modification of a group actually refers to the date on
which the file from which the group was loaded was last modified. See also
[URL of a group](#url-of-a-group).

### URL of a group

Groups are stored on the *Group Explorer* website in files that end in the
extension `.group`. The group's URL is the web address (beginning with
`http://`) pointing to the `.group` file from which the group was loaded on
*Group Explorer's* website. Example:

`https://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/Z_2 x Z_4.group`

### Naming scheme (for group elements)

See [representation of a group](#representation-of-a-group).

### Representation of a group

In order to display the elements of a group on the screen, *Group Explorer*
needs to know their names. Although internally, *Group Explorer* stores
groups in a manner consistent with the mathematical abstractions that they
are, users prefer a prettier format. Each group file defines at least one
representation, or naming scheme--that is, a list of names, one for each
element of the group. Users can add additional representations (also called
naming schemes) by using the controls in [the group info
page](rf-um-groupwindow.md).

Note that group elements' representations should not be confused with group
presentations, which are embeddings of arbitrary groups into groups of
matrices. *Group Explorer* does not currently have any features related to
group presentations.

### Sheets

Sheets are a blank canvas on which the user can drop illustrations of a
group, homomorphisms to connect them, and pieces of text for description.
Thus groups need not be examined only in isolation; they can be compared to
other groups.

To open a new sheet, from [the main page](rf-um-mainwindow.md), click the
sheet icon on the top right. For more information, see [the introduction to
sheets](tu-sheets.md) or the [reference documentation on the sheet
interface](rf-um-sheetwindow.md).

### Visualizers

*Group Explorer* uses the term visualizer to describe any of the various
mechanisms for obtaining pictures of a group. For instance, one way to
visualize a group is through its multiplication table, so we refer to
multiplication tables as "visualizers." *Group Explorer* contains four
types of visualizers: [multiplication
tables](rf-groupterms.md#multiplication-table), [cycle
graphs](rf-groupterms.md#cycle-graph), [cayley
diagrams](rf-groupterms.md#cayley-diagrams), and [objects of
symmetry](rf-groupterms.md#objects-of-symmetry).
