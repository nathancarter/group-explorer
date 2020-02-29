
# Build procedure assumes all files will be served in place. This is simpler and,
# for the moment at least, performance is adequate. If it becomes desirable to serve
# minified versions of the .js files the build will have to be reworked to something
# like copying files from src locations to a build tree with uglify:
#    build/%.js : %.js
#               uglifyjs $< --compress --mangle -o $@

all : Version.js docs

clean :
	rm -f *~ js/*~ visualizerFramework/*~ docs/*~
	rm -f ${PRODUCTS} ${DOCS} Version.js

#################

Version.js: package.json
	./versionjs

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
