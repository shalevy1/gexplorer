import cherrypy


@cherrypy.expose
class GraphResource(object):

    def __init__(self, gs):
        """
        Args:
            gs (explorer.ext.GraphService):
        """
        self.gs = gs

    @cherrypy.tools.accept(media="text/plain")
    @cherrypy.tools.json_out()
    def GET(self, node=None):
        graph = self.gs.query(node)
        print graph
        return dict(nodes=graph.get_nodes(), edges=graph.get_edges())
