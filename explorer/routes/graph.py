import cherrypy


@cherrypy.expose
class GraphResource(object):

    def __init__(self, gs, index_client):
        """
        Args:
            gs (explorer.graph.search.GSearch):
            index_client (indexclient.client.IndexClient):
        """
        self.gs = gs
        self.ic = index_client

    @cherrypy.tools.accept(media="text/plain")
    @cherrypy.tools.json_out()
    def GET(self, node=None, max_depth=3, exclude_edge_label=None):
        """ Loads nodes and edges associated with the provided node_id
        Args:
            node (str): node id
            max_depth (int): maximum depth of the graph to traverse
            exclude_edge_label (str): do not include edges with this label
        Returns:
            dict: JSON dictionary with nodes and edges
        """
        graph = self.gs.query(node, int(max_depth), exclude_edge=exclude_edge_label)
        return dict(nodes=graph.get_nodes(),
                    edges=graph.get_edges(),
                    groups=graph.groups,
                    edge_labels=graph.get_edge_labels())
