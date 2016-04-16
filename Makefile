BIN = ./node_modules/.bin

#
# INSTALL
#
install: node_modules/

node_modules/: package.json
	echo "> Installing ..."
	npm --loglevel=error --ignore-scripts install > /dev/null
	touch $@

#
# CLEAN
#

clean:
	echo "> Cleaning ..."
	rm -rf build/

mrproper: clean
	echo "> Cleaning deep ..."
	rm -rf node_modules/

#
# BUILD
#

build: clean install
	echo "> Building ..."
	$(BIN)/babel src/ --out-dir build/

build-watch: clean install
	echo "> Building forever ..."
	$(BIN)/babel src/ --out-dir build/ --watch

#
# MAKEFILE
#

.PHONY: \
	install \
	clean mrproper \
	build build-watch

.SILENT:
