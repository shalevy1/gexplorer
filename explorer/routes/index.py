import cherrypy


class IndexResource(object):

    @cherrypy.expose
    def index(self):
        return "Hello World"
