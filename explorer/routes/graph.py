import cherrypy


@cherrypy.expose
class GraphResource(object):

    def __init__(self, gs, index_client):
        """
        Args:
            gs (explorer.ext.QueryService):
            index_client (indexclient.client.IndexClient):
        """
        self.gs = gs
        self.ic = index_client

    @cherrypy.tools.accept(media="text/plain")
    @cherrypy.tools.json_out()
    def GET(self, node=None):
        """ Loads nodes and edges associated with the provided node_id
        Args:
            node (str): node id
        Returns:
            dict: JSON dictionary with nodes and edges
        """
        graph = self.gs.query(node)
        return dict(nodes=graph.get_nodes(), edges=graph.get_edges(), groups=graph.groups)
