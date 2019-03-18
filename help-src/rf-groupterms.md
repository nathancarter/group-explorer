
This page is a dictionary of many of the essential terms one might come
across when beginning to learn group theory. Many other *Group Explorer*
help pages link here to define terms. Unlike [the *Group Explorer*
terminology page](rf-geterms.md), these terms not specific to *Group
Explorer itself*; all are all commonly used mathematical terms.

### 1-1 ("one-to-one")

See [injective](#injective-injection).

### Abelian group

An abelian group is one whose binary operation is commutative. That is, for every two elements \(a\) and \(b\) in the group, \(a\cdot b=b\cdot a\).

### Bijection, bijective

A function that is both [injective](#injective-injection) and
[surjective](#surjective-surjection) is called bijective.

### Cayley diagrams

A Cayley diagram is a graph (that is, a set of vertices and edges among
them) that depicts a group. There is one node (vertex) in the graph for each
element in the group, and the arrows (edges) show how the generators act on
the elements of the group.

For instance, if the group has two generators, \(a\) and \(b\), then there
will be one type of arrow (perhaps red-colored arrows) for generator \(a\)
and another type of arrow (perhaps blue-colored) for generator \(b\). You
can see that the following Cayley diagram fits this description.

![Cayley diagram of S_3](s_3_cayley_miniature.png)

The red arrows connect two elements if multiplying the first by \(a\) gives
the second. That is, we have \(x~{\color{red}\longrightarrow}~y\) just when
\(x\cdot a=y\). So the arrows represent right-multiplication. (One could
also make Cayley diagrams in which the arrows represented
left-multiplication.)

*Group Explorer* has a [visualizer](rf-geterms.md#visualizers) for showing
Cayley diagrams. It is documented in full [here](rf-um-cd-options.md),
with an introduction [here](gs-cd-intro.md), and a tutorial
[here](tu-cd-manip.md).

### Cayley table

See [multiplication table](#multiplication-table).

### Class equation

The elements of a group can be partitioned into [conjugacy
classes](#conjugacy-classes). The class equation is a numerical equation
describing this partitioning. For instance, the group
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group) has three conjugacy
classes, of sizes 1, 2, and 3 respectively. The [order](#order-of-a-group) of the group
is 6, and so the class equation is \[1 + 2 + 3 = 6.\]

All class equations are of this form: The left hand side is a sum of
positive integers, each the size of a conjugacy class, and the right side
the order of the group.

### Closure of a subset

Not all subsets of a group are [subgroups](#subgroup). The closure of a
subset is the smallest subgroup containing that subset. That is, it answers
the question, "What must I add to this subset to get a subgroup?" Another
way to think of a subset's closure is that it is the subgroup for which the
subset is a set of [generators](#generators-for-a-group-or-subgroup).

### Commutative group

See [Abelian](#abelian-group).

### Conjugacy classes

The conjugacy class of an element \(g\) in a group is the set of all elements \(hgh^{-1}\) for any element \(h\) in the group. These are called "classes" because they partition the group (that is, they form an equivalence relation) and are called "conjugacy" classes because the element \(hgh^{-1}\) is called the "conjugate" of \(g\) by \(h\).

See also [class equation](#class-equation).

### Cosets

For any subgroup \(H\) of a group \(G\), we can speak of the left cosets and
the right cosets of \(H\). The notation \(aH\) for an element \(a\) in \(G\)
means the set of all products \(a\) times an element of \(H\); this set is a
left coset of \(H\), because we multiplied by \(a\) on the left of \(H\).
One could do the same on the right and form a right coset of \(H\). The
collection of all \(aH\) for every \(a\) in \(G\) is the collection of left
cosets of \(H\); similarly for right cosets. Cosets of either type partition
the elements of the group.

### Cycle graph

A cycle graph is an illustration of the cycles of a group ([orbits of
elements](#orbit-of-an-element-in-a-group)) and how those cycles connect.
Here is an example cycle graph.

![Cycle graph of Z_2 times Z_4](z_2_x_z_4_cycle_miniature.png)

The above graph shows the group
[\(\mathbb{Z}_2\times\mathbb{Z}_4\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/Z_2
x Z_4.group). One can see that there are two four-cycles (in the top half
of the picture) which share two nodes (the central node and the topmost
node). In addition to these six elements, there are two other
[order](#order-of-an-element-in-a-group)\-2 elements that are not in either
of the two larger four-cycles, shown at the bottom of the picture.

*Group Explorer* has a [visualizer](rf-geterms.md#visualizers) for showing
you Cycle graphs, documented in full [here](rf-um-cg-options.md).

### Cyclic group

A cyclic group is one that is
[generated](#generators-for-a-group-or-subgroup) by one element. Therefore
it is comprised entirely of the [orbit](#orbit-of-an-element-in-a-group) of
that element. The Cyclic groups are denoted \(\mathbb{Z}_n\) or sometimes
\(C_n\), and look just like their name (cycles) when viewed as [Cayley
diagrams](#cayley-diagrams) or [cycle graphs](#cycle-graph).

### Definition a group via generators and relations

One can define groups by listing
[generators](#generators-for-a-group-or-subgroup) \(a,b,c,\ldots\) and then
writing equations that describe how they relate. For instance, the [cyclic
group](#cyclic-group) with five elements can be described as the group
generated by \(a\) where \(a^5\) is the identity element. This is written
    \[\left\langle a : a^5=e\right\rangle.\]
The portion to the left of the colon (:) is the lone generator \(a\) and the
portion to the right is the equation that describes it.

For groups with more than one generator, the situation is slightly more
complex, but is essentially the same. The definition
    \[\left\langle a,b : a^4=e, b^2=e, ab=ba\right\rangle\]
describes a group with an [order](#order-of-an-element-in-a-group)\-4
generator \(a\) and an [order](#order-of-an-element-in-a-group)\-2 generator
\(b\) which commute with each other. The last equation \(ab=ba\) describes
the commutativity of the generators, and therefore implies the commutativity
of the whole group. This group is thus
[\(\mathbb{Z}_2\times\mathbb{Z}_4\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/Z_2
x Z_4.group). But if we had written the same definition with a different
final equation, say \(bab=a^{-1}\), we would have come up with a different
group
([\(D_4\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/D_4.group)).

One of the columns available for view in [the main page (the group
library)](rf-um-mainwindow.md) is the definition in this format of every
group loaded.

### Elementwise product (of two subsets of a group)

The elementwise product of two subsets \(S\) and \(T\) of a group is written
\(ST\) and is the set of all products of elements from \(S\) with elements
from \(T\), in that order. Thus the product is taken on the level of
elements, or "elementwise." In set theory notation,
    \[ST=\left\{ st : s\text{ is from }S\text{ and }t\text{ is from }T \right\}.\]

### Epimorphism

See [surjection](#surjective-surjection).

### First Isomorphism Theorem

The First Isomorphism Theorem says that given a
[homomorphism](#homomorphism) \(f\) mapping a group \(G\) to a group \(G'\),
the [kernel](#kernel-of-a-homomorphism) of \(f\) is a [normal
subgroup](#normal-subgroup) of \(G\), and when we take the
[quotient](#quotient-group) \(\frac{G}{\text{Ker }f}\), it is
[isomorphic](#isomorphism-isomorphic) to the image \(\text{Im}(f)\) as a
subgroup of \(G'\).

This is useful in [short exact sequences](#short-exact-sequence), which
*Group Explorer* uses to illustrate the normality of subgroups. (To see an
example, open a [group info page](rf-um-groupwindow.md), click the "tell me
more" link next to the Subgroups computation, and search for "short exact
sequence" on that page--it will be in the description of any normal
subgroup.)

### Generators for a group (or subgroup)

A collection \(C\) of elements of a [group](#group) is said to generate the
group (and they are called generators) if all possible combinations of
multiplications of those elements with one another yields all elements of
the group.

For instance, the elements \(r\) and \(f\) in
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group)
generate the group because the complete list of elements of
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group)
is \(r,f,rf,fr,r^2\), plus the identity, which can be written as \(r^3\).
Thus all elements of \(S_3\) are expressible as products of \(r\)s and
\(f\)s, so the set \(\{r,f\}\) generates \(S_3\). Sometimes this is written
\(\left\langle r,f \right\rangle=\)
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group).

If we consider just the element \(r\) in the same group and ask what set of
elements it generates, \(\langle r\rangle\), we find only the elements
\(\{e,r,r^2\}\). Therefore \(r\) does not generate all of
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group),
but only a [subgroup](#subgroup).

### Group

A group is a set of elements together with a binary operation (which I'll denote here by \(*\)) such that the following criteria hold.

 * The binary operation is associative:
   For every \(a\), \(b\), and \(c\) in the set, \(a*(b*c)=(a*b)*c\).
 * There is a special element in the set called the identity,
   which I will here denote \(e\).
   The identity obeys this rule: for every \(a\) in the group,
   \(a*e=e*a=a\).
 * For every element \(a\) in the set,
   there is an element that is its inverse,
   usually written \(a^{-1}\), such that \(a*a^{-1} = e\).

But this is the formal definition of a group. [You should be looking at
pictures of them!](gs-index.md) That's what this program is for!

### Homomorphism

Sometimes called simply a [morphism](#morphism), this is a function from one
group to another--that is, from the set of elements of the one group to the
set of elements of the other--that also _preserves_ the group operation.
That is, it must keep the group's structure intact in the following specific
way: For every pair of elements \(a\) and \(b\) in the domain, the
homomorphism \(f\) must satisfy the equation \(f(ab) = f(a)f(b)\).
"Homomorphism" means "same shape/form" (homo = same, morph = shape/form).

### Image (of a subset under a morphism)

If a [homomorphism](#homomorphism) \(f\) maps group \(G\) to group \(G'\),
and there is a subset \(S\) of \(G\), we can find out what its "image" is
under the homomorphism \(f\) by simply applying \(f\) to each element of
\(S\). That is, the image of \(S\) under \(f\), sometimes written \(f[S]\),
is the set \(\left\{ f(a) : a\text{ is in }S \right\}\). Obviously this will
be a subset of \(G'\).

One can also speak of the image of \(f\), meaning the image of the whole
group \(G\) under \(f\), i.e. all elements of the codomain of \(f\).

See also [preimage](#preimage-of-a-subset-under-a-morphism).

### Index of a subgroup

The [order of a subgroup](#order-of-a-subgroup) will always divide the
[order of the group](#order-of-a-group). So we say that a subgroup's index
is the integer resulting from that division. In symbols, if \(H\) is a
[subgroup](#subgroup) of \(G\), then because \(|H|\) divides \(|G|\), the
index is \(\frac{|G|}{|H|}\), often written \([G:H]\).

### Injective, injection

A function is injective (or [1-1](#1-1-one-to-one), or an injection) if no
two different elements map to the same output. That is, if \(a\) and \(b\)
are not equal, then \(f(a)\) and \(f(b)\) are not equal either. An injective
[homomorphism](#homomorphism) is sometimes called a
[monomorphism](#monomorphism).

### Isomorphism, isomorphic

A [homomorphism](#homomorphism) that is [bijective](#bijection-bijective) is
called an isomorphism. In group theory, if there is an isomorphism from one
[group](#group) to another, that means that those groups are really the same
exact structure, but possibly with different names or labels. In other
words, they are the same mathematical object.

Oftentimes people do not consider the distinction of labeling significant,
and will therefore call two objects the same if they are isomorphic. This is
what is meant by the phrase "the same _up to isomorphism_"; it means the
objects are the same if we consider isomorphic things to be identical.

### The isomorphism theorems

The [First Isomorphism Theorem](#first-isomorphism-theorem) can be
illustrated in *Group Explorer.* Other isomorphism theorems do not yet
appear illustrated in this software.

### Kernel (of a homomorphism)

The kernel of a [homomorphism](#homomorphism) is the set of elements that
the homomorphism maps to the identity element. Sometimes written
\(\text{Ker}(f)\), this set is the
[preimage](#preimage-of-a-subset-under-a-morphism) of the set \(\{ e \}\)
(where \(e\) is the identity of the group to which the homomorphism maps),
in symbols \(\{ a : f(a) = e \}\).

### Lattice of subgroups

I will not define the concept of a lattice here; it is too broad a subject
for the small need we have of it. One can find a good definition of it in a
discrete mathematics textbook or
[online](https://en.wikipedia.org/wiki/Lattice_(order)).

For our purposes, a lattice is a two-dimensional arrangement of sets, with
larger objects higher in the arrangement (vertically), and with arrows drawn
from smaller objects up to larger ones if the smaller object is a subset of
the larger. Because all subgroups of a group are sets, we can arrange them
in a lattice. For example, [click here to see the lattice of subgroups of
\(S_3\)](s_3_multtable_lattice.png) (illustrated using [multiplication
tables](#multiplication-table)).

### Left cosets

See [cosets](#cosets).

### Monomorphism

See [injection](#injective-injection).

### Morphism

See [homomorphism](#homomorphism).

### Multiplication table

A multiplication table for a group is so named because it is much like
elementary school multiplication tables, except that it uses the group
elements and operation rather than integers under ordinary, everyday
multiplication.

Thus the table is a grid, and across the top row and down the left column
every element of the group is listed, and filling the rest of the table are
the results of applying the group operation to the elements in the header
row and column. For this reason, multiplication tables very well exhibit
patterns inherent in the group _operation_, but elements themselves appear
several times in the table, and thus the group as a set is not well
depicted.

*Group Explorer* has a [visualizer](rf-geterms.md#visualizers) for showing
you multiplication tables. More information about it appears in its
[documentation](rf-um-mt-options.md), [introduction](gs-mt-intro.md), and
[tutorial](tu-mt-manip.md).

*Group Explorer* shows multiplication tables in one of two ways--with or
without text in the cells of the table. Consider the following
multiplication table for the group
[\(D_4\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/D_4.group).

![Unlabeled multiplication table for D_4](d_4_multtable_miniature_unlabelled.png)

This table has no text and thus the colors of the cells exhibit the abstract
pattern inherent in the group operation. Omitting the text allows tables to
be shown in small sizes (like in [group info pages](rf-um-groupwindow.md) or
[the group library](rf-um-mainwindow.md)). If you want to see this same
table with the element names in the cells, [click here to open the group
info page for
\(D_4\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/D_4.group)
and then click the multiplication table visualizer shown under the Views
section. (Or jump to it directly with [this
link](http://nathancarter.github.io/group-explorer/Multtable.html?groupURL=groups/D_4.group).)

Upon inspecting the multiplication table with text included, you can see
that for example the element \(r\) in the leftmost column, second row,
multiplied by the element \(f\) (in the topmost row, fifth column) results
in the element \(rf\), in the second row, fifth column. This is because
multiplication is done in the order you can infer from this example: element
in left column times element in top row.

### Normal subgroup

A [subgroup](#subgroup) is called normal when any one of the following
equivalent criteria are met.

 * A normal subgroup is one whose collection of
   [left cosets](#left-cosets) is the same as its collection of
   [right cosets](#right-cosets).
 * A normal subgroup is one which is self-conjugate,
   that is if \(N\) is the subgroup then
   for any element \(G\) in the group,
   the set \(gNg^{-1}=N\).
   Here \(gNg^{-1}=\{ gng^{-1} : n\text{ is in }N\}\).
 * A normal subgroup \(N\) in a group \(G\) is one for which
   the [quotient](#quotient-group) \(\frac{G}{N}\) is defined.

The last of these is probably the easiest to visualize. [Multiplication
tables](#multiplication-table) and [Cayley diagrams](#cayley-diagrams) can
both organize themselves by the [cosets](#cosets) of a subgroup and then
separate those cosets (or "chunk" them) to help you visualize the quotient
operation. Refer to the documentation on [the multiplication table
interface](rf-um-mt-options.md) or [the Cayley diagram
interface](rf-um-cd-options.md) for more information on these features.

### Normalizer of a subgroup/subset

The normalizer of a [subgroup](#subgroup) \(H\) of a group \(G\), sometimes
written \(\text{Norm}(H)\), is the largest subgroup containing \(H\) in
which \(H\) is [normal](#normal-subgroup).

That is, \(H\) may not be normal in \(G\), but if we were to remove some of
the "problem" elements from \(G\), those that are preventing \(H\) from
being normal, we would find a subgroup of \(G\) in which \(H\) is normal.
The normalizer is exactly this, the subgroup which remains when you remove
as few elements as possible from \(G\) to make \(H\) normal.

### Objects of symmetry

Group theory is the study of symmetry in the abstract. But many very
concrete objects which one could hold in one's hand have symmetry (or
symmetries) to them, and the relationship among those symmetries can be
described by a group. Therefore several groups in *Group Explorer's* library
are groups that describe the symmetry of objects that exist in
three-dimensional space, and exist in the real world--for example, a cube, a
pinwheel, or a pyramid. These objects are called "objects of symmetry" (or
objects _with_ symmetry, or symmetry objects).

*Group Explorer* has a [visualizer](rf-geterms.md#visualizers) for showing
you objects of symmetry, documented in full [here](rf-um-os-options.md).

### One-to-one

See [injective](#injective-injection).

### Onto

See [surjective](#surjective-surjection).

### Orbit of an element in a group

The orbit of an element a in a [group](#group) \(G\) is the set of all
powers of that element, i.e. \(\{ a^n : n\text{ is any integer} \}\). You
can think of this as all the places one can "walk" using \(a\) as a step. In
a [Cayley diagram](#cayley-diagrams), this would be the chain of elements
one encounters by following \(a\)\-arrows repeatedly.

### Order classes

Each element in a [group](#group) has an
[order](#order-of-an-element-in-a-group), and thus we can partition the
elements of the group into classes which all have the same order. For
instance the elements of the group
[\(S_3\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/S_3.group)
are listed in the table below, with their orders.

| Element | Order |
|:-------:|:-----:|
| \(e\)   | 1     |
| \(r\)   | 3     |
| \(r^2\) | 3     |
| \(f\)   | 2     |
| \(fr\)  | 2     |
| \(rf\)  | 2     |

Thus this group has three order classes: one consisting of the elements of
order 1, \(\{ e \}\), another consisting of the elements of order 2, \(\{ f,
fr, rf \}\), and another consisting of the elements of order 3, \(\{ r, r^2
\}\).

You can learn about the order classes of any group by looking under the
Computations section of its [group info page](rf-um-groupwindow.md).

### Order of an element in a group

The order of an element in a [group](#group) can be thought of in two
equivalent ways.

 * The order of the element \(a\) is the smallest positive power of a
   that yields the identity. That is, if \(a^k=e\)
   and no smaller positive integer exponent satisfies that same equation,
   then the order of \(a\), written \(|a|\), is \(k\).
 * The order of the element \(a\) is the
   [order of the subgroup](#order-of-a-subgroup)
   [generated by](#generators-for-a-group-or-subgroup) \(a\),
   which is also the [orbit](#orbit-of-an-element-in-a-group) of \(a\).

The order of the identity element is 1 by either of these reckonings.
It generates the [subgroup](#subgroup) \(\{ e \}\).

### Order of a group

The order of a group \(G\), written \(|G|\), is simply its size (how many
elements are in it).

### Order of a subgroup

The order of a subgroup \(H\), written \(|H|\), is simply its size (how many
elements are in it). See also [subgroup index](#index-of-a-subgroup).

### \(p\)\-subgroup

A \(p\)\-subgroup is a [subgroup](#subgroup) all of whose elements have an
[order](#order-of-an-element-in-a-group) equal to a power of the prime
number \(p\). (See also [Sylow \(p\)\-subgroup](#sylow-p-subgroup).)

For instance, if every element of \(H\) has order \(1, 2, 4, 8, 16,\ldots\)
(any power of 2), then \(H\) is a 2-subgroup. If every element of \(H\) has
order \(1, 5, 25, 125,\ldots\) (any power of 5), then \(H\) is a 5-subgroup.
One does not say "4-subgroup" or "20-subgroup" because those numbers are not
prime. Also, one can see that if \(H\) is a \(p\)\-subgroup for some prime
\(p\), then it is not a \(q\)\-subgroup for any other prime \(q\) unless
\(H= \{ e \}\).

If you click "tell me more" next to Subgroups in the Computations section of
any [group info page](rf-um-groupwindow.md), you will see that the
descriptions of the subgroups tell you which ones are \(p\)\-subgroups.

### Preimage (of a subset under a morphism)

If a [homomorphism](#homomorphism) \(f\) maps a group \(G\) to a group
\(G'\) and there is a subset \(S\) of \(G'\), we can find out what its
"pre-image" is under the homomorphism \(f\) by finding all the elements
which \(f\) maps into \(S\). That is, the preimage of \(S\) under \(f\),
sometimes written \(f^{-1}[S]\), is the set \(\left\{ a : f(a)\text{ is in
}S \right\}\). Obviously this will be a subset of \(G\). See also
[image](#image-of-a-subset-under-a-morphism).

### Proper subgroup

A [subgroup](#subgroup) is proper if it is not the whole [group](#group).

Technically, by [the definition of subgroup](#subgroup), every group is a
subgroup of itself. But when we say "a proper subgroup" we mean subgroups
that are actually smaller than the group we're looking inside.

### Quotient group

If \(H\) is a [subgroup](#subgroup) of \(G\), then we can sometimes make a
group out of the [cosets](#cosets) of \(H\) as follows. The cosets of \(H\)
(let's use the [left cosets](#left-cosets)) are the sets \(aH\) for various
values of \(a\). To define an operation on this collection, we let \(aH\)
times \(bH\) equal \((ab)H\). One can prove that this operation is a valid
group operation (as per [the definition of a group](#group)) if and only if
\(H\) is a [normal subgroup](#normal-subgroup) of \(G\). In that case, the
new group we just formed is called the quotient of \(G\) by \(H\), written
\(\frac{G}{H}\).

[Multiplication tables](#multiplication-table) and [Cayley
diagrams](#cayley-diagrams) can both organize themselves by the
[cosets](#cosets) of a subgroup and then separate those cosets (or "chunk"
them) to help you visualize the quotient operation. Refer to the
documentation on [the multiplication table interface](rf-um-mt-options.md)
or [the Cayley diagram interface](rf-um-cd-options.md) for more information
on these features.

### Right cosets

See [cosets](#cosets).

### Short exact sequence

An exact sequence is a chain of groups connected by
[homomorphisms](#homomorphism) such that the
[image](#image-of-a-subset-under-a-morphism) of any one homomorphism in the
chain is the [kernel](#kernel-of-a-homomorphism) of the next homomorphism. A
short exact sequence is one with only five groups in it, the first and last
of which are both [the trivial group](#trivial-groupsubgroup). An example
is shown below.

![A sheet showing a short exact sequence for the normality of V_4 in A_4](a_4_sheet_ses.png)

A short exact sequence is related to the [quotient](#quotient-group)
operation on groups. Let us call the four morphisms in a short exact
sequence \(id\), \(e\), \(q\), and \(z\), from left to right, and the three
middle groups in the sequence \(A\), \(B\), and \(C\), also from left to
right.

I call the first homomorphism \(id\) (for "identity") because it simply maps
the one element in its domain (the identity element) to the identity element
in \(A\).

As per the definition above, the kernel of \(e\) must be the image of
\(id\), which is simply the identity element. A nice theorem of group theory
tells us that when a morphisms' kernel is the identity, the whole morphism
is [injective](#injective-injection); thus a copy of \(A\) appears in \(B\),
that copy being the image of \(e\) (which stands for "embedding," a synonym
for [injection](#injective-injection)).

In turn, the [kernel](#kernel-of-a-homomorphism) of \(q\) must be the image
of \(e\), which is an [isomorphic](#isomorphism-isomorphic) copy of \(A\).
This means that the map \(q\) effectively zeroes out or removes \(A\) from
\(B\). The [First Isomorphism Theorem](#first-isomorphism-theorem) then
implies that \(q\) is a quotient map (hence the name) and that \(\frac{B}{A}
= \text{Im}(q)\).

But there's more! Because the image of \(z\) is only the identity element,
its [kernel](#kernel-of-a-homomorphism) is all of \(C\). Therefore because
this is an exact sequence, the image of \(q\) must also be \(C\). This means
that the short exact sequence \(A\to B\to C\) illustrates the fact that
\(\frac{B}{A}=C\).

You can see a short exact sequence illustrated for any [normal
subgroup](#normal-subgroup) of any group. Go to a [group's info
page](rf-um-groupwindow.md), to the Subgroups section under Computations,
and click "tell me more." Any normal subgroup will provide a link to a
[sheet](rf-geterms.md#sheet) illustrating the [quotient](#quotient-group)
via a short exact sequence.

### Simple group

A simple group is a non-[abelian group](#abelian-group) with no
non-[trivial](#trivial-groupsubgroup), [proper](#proper-subgroup), [normal
subgroups](#normal-subgroup). The smallest simple group is
[\(A_5\)](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/A_5.group).

### Solvable group, solvable decomposition

Solvable groups are important in Galois theory, which is too large a topic
to embark on here. Briefly, Galois theory was invented to study which
polynomials are solvable using ordinary arithmetic plus radicals. If you are
interested in Galois theory, refer to an abstract algebra textbook or [an
online resource](https://en.wikipedia.org/wiki/Galois_theory).

The roots of polynomials have symmetry that can be described by groups,
called the Galois group of the polynomials. Evariste Galois (a 19th century
mathematician) proved that you could tell by looking at these groups whether
the polynomial was solvable. Groups that corresponded to solvable
polynomials got the name "solvable groups."

A group \(G\) is solvable if there is a chain of groups \(H_1, H_2, H_3,
\ldots, H_n\) such that each group is a [normal subgroup](#normal-subgroup)
of the next one in the chain, the resulting [quotient
groups](#quotient-group) are all abelian, and the chain begins with [the
trivial group](#trivial-groupsubgroup) and ends with \(G\). You can see a
diagram illustrating this for any solvable group by looking under the
Computations section of the [group's info page](rf-um-groupwindow.md).

### Subgroup

If \(S\) is a subset of the [group](#group) \(G\) (i.e. a subset of the set
of elements of \(G\)) then we say \(S\) is a subgroup if it is also a group
under the operation of \(G\).

A subset \(S\) of a group \(G\) may fail to be a subgroup in a few different ways; here are examples.

 * If \(S\) does not contain the identity element,
   it violates one of the criteria in [the definition of a group](#group).
 * If \(S\) contains an element but not that element's inverse,
   it would violates another of those criteria.
 * If \(S\) contains two elements but not their product,
   then the binary operation of \(G\) cannot be said to be
   a binary operation on \(S\),
   because it maps some pairs from \(S\) outside of \(S\).

### Surjective, surjection

A function is surjective (or [onto](#onto), or a surjection) from a set
\(A\) to a set \(B\) if every element of \(B\) is mapped to by some element
of \(A\). That is, if \(b\) is in \(B\), then there must be some \(a\) in
\(A\) such that \(f(a) = b\). A surjective [homomorphism](#homomorphism) is
sometimes called an [epimorphism](#epimorphism).

### Sylow p-subgroup

A Sylow [\(p\)\-subgroup](#p45subgroup) is a maximal \(p\)\-subgroup; that
is, no subgroup properly containing this one is still a \(p\)\-subgroup.

If you click "tell me more" next to Subgroups in the Computations section of
any [group info page](rf-um-groupwindow.md), you will see that the
descriptions of the subgroups tell you which ones are Sylow
\(p\)\-subgroups.

### Symmetry objects

See [objects of symmetry](#objects-of-symmetry).

### Trivial group/subgroup

The trivial group is the [group](#group) with only one element. [You can see
its information
here.](http://nathancarter.github.io/group-explorer/GroupInfo.html?groupURL=groups/Trivial.group)

In every group, the set containing only the identity element is a
[subgroup](#subgroup) and is called the trivial subgroup.
