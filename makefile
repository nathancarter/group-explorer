
JS_FILES = js/init.js             js/Log.js            js/BitSet.js        js/MathUtils.js       \
           js/BasicGroup.js       js/XMLGroup.js       js/Subgroup.js      js/SubgroupFinder.js  \
           js/IsomorphicGroups.js js/Template.js       js/Library.js       js/CayleyDiagram.js   \
           js/DisplayDiagram.js   js/mathmlUtils.js    js/Diagram3D.js     js/SymmetryObject.js  \
           js/Multtable.js        js/ColorPool.js      js/DisplayMulttable.js 					 \
		   js/CycleGraph.js       js/DisplayCycleGraph.js

SUB_FILES = subsetDisplay/subsets.js           subsetDisplay/BasicSubset.js     \
            subsetDisplay/Subgroup.js          subsetDisplay/Subset.js		\
            subsetDisplay/SubsetEditor.js      subsetDisplay/Partition.js	\
	    subsetDisplay/PartitionSubset.js					\
            subsetDisplay/ConjugacyClasses.js  subsetDisplay/Cosets.js		\
            subsetDisplay/OrderClasses.js      visualizerFramework/visualizer.js

# PRODUCTS = build/allGroupExplorer.js build/allGroupExplorer.min.js build/allVisualizer.js
PRODUCTS = build/allGroupExplorer.js build/allVisualizer.js

DOCS =  docs/Template.md	docs/visualizerExemplar.md	\
	docs/visualizerFramework_css.md	docs/visualizerFramework_js.md	docs/visualizerFramework_html.md

#COMBINE = uglifyjs
#COMBINE_OPTS = --compress

# easier to debug w/ cat
COMBINE = cat

MINIFY = uglifyjs
MINIFY_OPTS = --compress --mangle


all : products docs

clean :
	rm -f *~ js/*~ subsetDisplay/*~ visualizerFramework/*~ docs/*~
	rm -f ${PRODUCTS} ${DOCS}

#################

products : ${PRODUCTS}

build/allGroupExplorer.js : ${JS_FILES}
	${COMBINE} ${JS_FILES} ${COMBINE_OPTS} > build/allGroupExplorer.js

build/allGroupExplorer.min.js : ${JS_FILES}
	${MINIFY} ${JS_FILES} ${MINIFY_OPTS} > build/allGroupExplorer.min.js

build/allVisualizer.js : ${SUB_FILES}
	${COMBINE} ${SUB_FILES} ${COMBINE_OPTS} > build/allVisualizer.js

#################

docs : ${DOCS}

# make markdown files from html by removing lines starting with <!--Markdown and Markdown-->, which comment out markdown
# (you can still use <!-- --> comment delimiters, just not the special <!--Markdown and Markdown--> at the start of a line)
docs/visualizerExemplar.md : docs/visualizerExemplar.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < docs/visualizerExemplar.html > docs/visualizerExemplar.md

docs/visualizerFramework_html.md : visualizerFramework/visualizer.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < visualizerFramework/visualizer.html > docs/visualizerFramework_html.md

# copy these to make them viewable on github as markdown files
docs/Template.md : js/Template.js
	echo '' | cat js/Template.js - > docs/Template.md

docs/visualizerFramework_css.md : visualizerFramework/visualizer.css
	echo '' | cat visualizerFramework/visualizer.css - > docs/visualizerFramework_css.md

docs/visualizerFramework_js.md : visualizerFramework/visualizer.js
	echo '' | cat visualizerFramework/visualizer.js - > docs/visualizerFramework_js.md
