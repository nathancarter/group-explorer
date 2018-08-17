
The software FGB (Finite Group Behavior,
http://unr.edu/homepage/keppelma/fgb.html) written by Bayard Webb
and Ed Keppelmann has an extensive group library which was created
using the GAP system (Groups, Algorithms, and Programming,
http://www.gap-system.org).  It includes all groups up to order 20,
and all nonabelian groups up to order 40.

Group Explorer's group library is not as extensive; it contains all
groups up to order 20, and a scattered few groups larger than that.
The files in this folder are a conversion of part of the FGB group
library into Group Explorer's format.  Any group not in this
directory is either already in Group Explorer, or is not in FGB.
Nathan Carter performed the conversion with a Python script; this
is legal because the FGB package is freely distributed without
licensing restrictions.  (Of course, the data comes from GAP anyway,
which is also free software.)  The FGB group naming convention has
been preserved; a group name is four numbers, the first two being
the group's order, and the others simply counting up from 1.  So
groups of order 24 will be named 2401, 2402, etc.

To use these groups with Group Explorer, open Group Explorer and
click the Settings button on the toolbar (or choose Preferences from
the menu).  Click the Files tab in the window that appears, and click
the "Add group path" button.  Point Group Explorer to the file in
which you have unzipped this archive.  After clicking OK, Group
Explorer will tell you that your changes will take effect the next
time you launch the program.  Close and relaunch to see the new
groups.

Recall that Group Explorer does a lot of calculations on launch,
and if you load too many groups into the library, you will have a
long wait when the program starts up.  Also, depending on your other
preferences (e.g. maximum group order, maximum group file size) you
may or may not see all the groups in this directory in the group
library.  Ensure your settings are allowing the groups in this
directory to be seen (they have orders 22 to 40).

