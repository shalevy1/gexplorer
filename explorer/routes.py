import cherrypy


class Root(object):

    @cherrypy.expose
    def index(self):
        return "H W"


class Search(object):

    @cherrypy.expose
    def search(self):
        return {"a": 10}
