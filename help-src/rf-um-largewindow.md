
## What is a "large visualizer?"

Each [visualizer](rf-geterms.md#visualizers) in *Group Explorer* can show up
in three contexts: in a [group info page](rf-um-groupwindow.md), as an item
in a [sheet](rf-geterms.md#sheets), or in full detail in its own editable
window. This last case is the subject of this page.

Because each visualizer is different, this page covers just what all large
visualizer views have in common, and refers you to each visualizer's
individual interface page for specific information about each.

## Opening a large visualizer

You can obtain a large view of each visualizer one of two ways.

1.  Some pages contain links that will create a large visualizer for you.

    For instance, each [group info page](rf-um-groupwindow.md)
    has a Views section that gives a preview of every visualizer
    for the group and clicking any one opens a large copy
    in its own window. Thumbnails of each visualizer on
    [the main application page](rf-um-mainwindow.md) work the same way.

    In this case, although you can edit the appearance of the visualizer
    and save it as an image or print it, once you close the window,
    all your changes are lost.

2.  You can create visualizers in [sheets](rf-geterms.md#sheets)
    and double-click them to open a large version.

    In this case, the large view is linked to the small view in the sheet,
    and all changes made to the large view in its own window
    are reflected in the image on the sheet
    and will be saved if you save the sheet.

Here is a screenshot of a window viewing a large version of a Cayley
diagram.

![Screenshot of a large view of a Cayley diagram](illustration-largecd.png)

## Page structure

Every large visualizer page is split into two halves, like the one shown
above. The left half will always have the picture--the visualization. The
right half will be controls that allow you to edit the picture. You
can hide the right half with the [hide/show](#hideshow) control on the
top right of the window.

If you perform any of the edits described with the controls below but then
wish to undo them and reset the large visualizer to its original state, just
reload the page in your browser.  Any changes you have made will be lost.

## Toolbar

On the top right of any visualizer you will find the following controls.
We cover each of them separately, below.

![Screenshot of the tools on the top right of a large visualizer page](large-viz-menu-icons.png)

### Home

The first icon (the house) is a link to the main *Group Explorer* website.
That is, it will take you out of the app itself and back to the home page of
the entire project.

### Library

The second icon (the book) takes you to the Group Library page, the [main
page of the app itself](rf-um-mainwindow.md).

### Sheets

The third icon (the sheet of paper) takes you to a blank sheet, into which
you can insert visualizations of any groups from the library and connect
them with morphisms.  To read more on sheets, see [the sheets
tutorial](tu-sheets.md) or [the sheets reference](rf-um-sheetwindow.md).

### Help

The fourth icon (the question mark) takes you to the main page of these help
files.

### GitHub

The fifth icon (the GitHub logo) takes you to [the source code
repository](https://github.com/nathancarter/group-explorer) from which the
application and its website were built.  Visit that site if you would like
to see how the application was built, make suggestions for its improvement,
report an error in the documentation, or get involved in improving the
software as a developer.

### Hide/show

The rightmost icon (which looks like a right-arrow, &gt;, in the image
above) will hide the right-hand controls pane, exposing just the visualizer
to your view.  When you hide it, the icon becomes a left-arrow, &lt;,
instead.  Clicking it will reveal the controls again.

## Four visualizer types

The controls in that right-hand pane are specific to which large visualizer
you have open.  For more information on that controls pane, visit the
documentation on whichever large visualizer you're using:

*   [Documentation for large Cayley diagram interface](rf-um-cd-options.md)
*   [Documentation for large multiplication table interface](rf-um-mt-options.md)
*   [Documentation for large cycle graph interface](rf-um-cg-options.md)
*   [Documentation for large symmetry object interface](rf-um-os-options.md)

There are some controls in common among many of these visualizers; for
convenience, we provide links to their docuemntation here.

*   [Documentation for the subset options controls](rf-um-subsetlistbox.md)
*   [Documentation for controls for viewing 3D models](rf-um-modelview.md)
