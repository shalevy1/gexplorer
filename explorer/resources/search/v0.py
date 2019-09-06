import flask

from explorer.resources.search import service


blueprint = flask.Blueprint("search", __name__, url_prefix="/s")


@blueprint.route("", methods=["GET"])
def get_subtree():
    """ Loads nodes and edges associated with the provided node_id
    Query Params:
        node (str): node id
        max_depth (int): maximum depth of the graph to traverse
        max_breadth (int): maximum breadth on any given node
        exclude_case_cache (str): do not include edges with this label
    Returns:
        dict: JSON dictionary with nodes and edges
    """

    node = flask.request.args.get("node")
    max_depth = flask.request.args.get("max_depth", "3")
    max_breadth = flask.request.args.get("max_breadth", "10")
    exclude_case_cache = flask.request.args.get("exclude_case_cache", "t").lower() in ["true", "t", "1"]

    gs = service.TreeLoader(flask.current_app.db)
    graph = gs.load_subtree(node, int(max_depth), max_breadth=int(max_breadth), exclude_case_cache=exclude_case_cache)
    return flask.jsonify(dict(nodes=graph.get_nodes(),
                              edges=graph.get_edges(),
                              groups=graph.groups,
                              edge_labels=graph.get_edge_labels()))


@blueprint.route("/find",  methods=["GET"])
def find():
    node = flask.request.args.get("node")

    gs = service.TreeLoader(flask.current_app.db)
    nodes = gs.find_matching(node)
    return flask.jsonify(dict(nodes=nodes)), 200
