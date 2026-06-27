HUGO ?= hugo

.PHONY: serve build clean

serve:
	$(HUGO) server -D

build:
	$(HUGO)

clean:
	rm -rf public resources/_gen
