
# Build procedure assumes all files will be served in place. This is simpler and,
# for the moment at least, performance is adequate. If it becomes desirable to serve
# minified versions of the .js files the build will have to be reworked to something
# like copying files from src locations to a build tree with uglify:
#    build/%.js : %.js
#               uglifyjs $< --compress --mangle -o $@

GIT_VERSION := "$(shell git describe --abbrev=4 --dirty --always --tags)"
SEMANTIC_VERSION := "$(shell git describe --abbrev=0 --tags)"

PAGES = Multtable.html GroupExplorer.html GroupInfo.html Sheet.html CayleyDiagram.html SymmetryObject.html CycleGraph.html

all : setGITVersion package # docs

setGITVersion : $(PAGES)
	sed -i 's/<meta name="GE3-GITVersion" content=".*">/<meta name="GE3-GITVersion" content=$(GIT_VERSION)>/g' $^

package :
	sed -i 's/"version": ".*",/"version": $(SEMANTIC_VERSION),/g' package.json

clean :
	rm -f *~ */*~
	rm -f ${DOCS}

#################

DOCS =  docs/visualizerExemplar.md              \
        docs/visualizerFramework_html.md

docs : ${DOCS}

# make markdown files from html by removing lines starting with <!--Markdown and Markdown-->, which comment out markdown
# (you can still use <!-- --> comment delimiters, just not the special <!--Markdown and Markdown--> at the start of a line)
docs/visualizerExemplar.md : docs/visualizerExemplar.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < docs/visualizerExemplar.html > docs/visualizerExemplar.md

docs/visualizerFramework_html.md : visualizerFramework/visualizer.html
	sed -e '/^<!--Markdown/d' -e '/^Markdown-->/d' < visualizerFramework/visualizer.html > docs/visualizerFramework_html.md
