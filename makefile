
JS_FILES = js/init.js             js/Log.js            js/BitSet.js        js/MathUtils.js       \
           js/BasicGroup.js       js/XMLGroup.js       js/Subgroup.js      js/SubgroupFinder.js  \
           js/IsomorphicGroups.js js/Template.md       js/Library.js       js/MathML.md          \
           js/Menu.js                                                                            \
           js/Diagram3D.js        js/DiagramDnD.js     js/CayleyDiagram.js js/SymmetryObject.js  \
           js/DisplayDiagram.js                                                                  \
           js/Multtable.js        js/DisplayMulttable.js                                         \
           js/CycleGraph.js       js/DisplayCycleGraph.js                                        \
           Version.js                                                                            \

SUB_FILES = subsetDisplay/subsets.js           subsetDisplay/BasicSubset.js     \
            subsetDisplay/Subgroup.js          subsetDisplay/Subset.js          \
            subsetDisplay/SubsetEditor.js      subsetDisplay/Partition.js       \
            subsetDisplay/PartitionSubset.js   subsetDisplay/OrderClasses.js    \
            subsetDisplay/ConjugacyClasses.js  subsetDisplay/Cosets.js          \
										\
            diagramController/diagram.js       diagramController/Generator.js   \
            diagramController/DiagramChoice.js diagramController/Arrow.js       \
            diagramController/ArrowMult.js     diagramController/Chunking.js    \
										\
            cayleyViewController/view.js                                        \
										\
            visualizerFramework/visualizer.js

SHEET_FILES = js/DragResizeExtension.js		js/SheetModel.js

# PRODUCTS = build/allGroupExplorer.js build/allGroupExplorer.min.js build/allVisualizer.js
PRODUCTS = build/allGroupExplorer.js build/allVisualizer.js build/allSheets.js

DOCS =  docs/visualizerExemplar.md              \
        docs/visualizerFramework_css.md         \
        docs/visualizerFramework_js.md          \
        docs/visualizerFramework_html.md

#COMBINE = uglifyjs
#COMBINE_OPTS = --compress

# easier to debug w/ cat
COMBINE = cat

MINIFY = uglifyjs
MINIFY_OPTS = --compress --mangle


all : products docs

clean :
	rm -f *~ js/*~ subsetDisplay/*~ visualizerFramework/*~ docs/*~
	rm -f ${PRODUCTS} ${DOCS} Version.js

#################

products : ${PRODUCTS}

Version.js: package.json
	./versionjs

build/allGroupExplorer.js : ${JS_FILES}
	${COMBINE} ${JS_FILES} ${COMBINE_OPTS} > build/allGroupExplorer.js

build/allGroupExplorer.min.js : ${JS_FILES}
	${MINIFY} ${JS_FILES} ${MINIFY_OPTS} > build/allGroupExplorer.min.js

build/allVisualizer.js : ${SUB_FILES}
	${COMBINE} ${SUB_FILES} ${COMBINE_OPTS} > build/allVisualizer.js

build/allSheets.js : ${SHEET_FILES}
	${COMBINE} ${SHEET_FILES} ${COMBINE_OPTS} > build/allSheets.js

#################

docs : ${DOCS}

# make markdown files from html by removing lines starting with <!--Markdown and Markdown-->, which comment out markdown
# (you can still use <!-- --> comment delimiters, just not the special <!--Markdown and Markdown--> at the start of a line)
docs/visualizerExemplar.md : docs/visualizerExemplar.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < docs/visualizerExemplar.html > docs/visualizerExemplar.md

docs/visualizerFramework_html.md : visualizerFramework/visualizer.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < visualizerFramework/visualizer.html > docs/visualizerFramework_html.md

# add newline to these files so git doesn't decide we're just moving the old file to a new place...
docs/visualizerFramework_css.md : visualizerFramework/visualizer.css
	echo '' | cat visualizerFramework/visualizer.css - > docs/visualizerFramework_css.md

docs/visualizerFramework_js.md : visualizerFramework/visualizer.js
	echo '' | cat visualizerFramework/visualizer.js - > docs/visualizerFramework_js.md
