SRC = $(shell find src)
LIB = $(SRC:src/%.js=lib/%.js);

lib: $(LIB)
lib/%.js: src/%.js
	mkdir -p $(@D)
	./node_modules/.bin/babel $< -o $@
