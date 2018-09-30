
JS_FILES = js/init.js             js/Log.js            js/BitSet.js        js/MathUtils.js       \
           js/BasicGroup.js       js/XMLGroup.js       js/Subgroup.js      js/SubgroupFinder.js  \
           js/IsomorphicGroups.js js/Template.js       js/Library.js       js/CayleyDiagram.js   \
           js/DisplayDiagram.js   js/mathmlUtils.js    js/Diagram3D.js     js/SymmetryObject.js  \
           js/Multtable.js        js/DisplayMulttable.js

SUB_FILES = subsetDisplay/subsets.js           subsetDisplay/BasicSubset.js     \
            subsetDisplay/Subgroup.js          subsetDisplay/Subset.js		\
            subsetDisplay/SubsetEditor.js      subsetDisplay/Partition.js	\
	    subsetDisplay/PartitionSubset.js					\
            subsetDisplay/ConjugacyClasses.js  subsetDisplay/Cosets.js		\
            subsetDisplay/OrderClasses.js      visualizerFramework/visualizer.js

# PRODUCTS = build/allGroupExplorer.js build/allGroupExplorer.min.js build/allVisualizer.js
PRODUCTS = build/allGroupExplorer.js build/allVisualizer.js

#COMBINE = uglifyjs
#COMBINE_OPTS = --compress

# easier to debug w/ cat
COMBINE = cat

MINIFY = uglifyjs
MINIFY_OPTS = --compress --mangle


all : products docs

clean :
	rm -f *~ js/*~ subsetDisplay/*~ visualizerFramework/*~
	rm -f ${PRODUCTS}

#################

products : ${PRODUCTS}

build/allGroupExplorer.js : ${JS_FILES}
	${COMBINE} ${JS_FILES} ${COMBINE_OPTS} > build/allGroupExplorer.js

build/allGroupExplorer.min.js : ${JS_FILES}
	${MINIFY} ${JS_FILES} ${MINIFY_OPTS} > build/allGroupExplorer.min.js

build/allVisualizer.js : ${SUB_FILES}
	${COMBINE} ${SUB_FILES} ${COMBINE_OPTS} > build/allVisualizer.js

#################

DOCS = docs/Template.md

docs : ${DOCS}

docs/Template.md : js/Template.js
	echo '' | cat js/Template.js - > docs/Template.md
