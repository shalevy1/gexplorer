import flask


blueprint = flask.Blueprint("graph", __name__, url_prefix="/s")


@blueprint.route("/", methods=["GET"])
def get(node=None, max_depth=3, exclude_edge_label=None):
    """ Loads nodes and edges associated with the provided node_id
    Args:
        node (str): node id
        max_depth (int): maximum depth of the graph to traverse
        exclude_edge_label (str): do not include edges with this label
    Returns:
        dict: JSON dictionary with nodes and edges
    """
    graph = flask.current_app.gs.query(node, int(max_depth), exclude_edge=exclude_edge_label)
    return flask.jsonify(dict(nodes=graph.get_nodes(),
                              edges=graph.get_edges(),
                              groups=graph.groups,
                              edge_labels=graph.get_edge_labels()))
