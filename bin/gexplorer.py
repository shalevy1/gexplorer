#!/usr/bin/env python
import cherrypy

from explorer.routes import Root, Search


def main():
    cherrypy.tree.mount(Root(), "/")
    cherrypy.quickstart(Search(), "/s")


if __name__ == '__main__':
    main()
