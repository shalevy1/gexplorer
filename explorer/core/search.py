import psqlgraph
from explorer.core import GExpl


class GSearch(object):

    def __init__(self, pg_driver):
        self.g = pg_driver

    def get_subtree(self, node_id, max_depth=4, max_breadth=10, exclude_case_cache=True):
        """ Loads a sub tree for the provided node id, using the specified max depth and width
        Args:
            node_id (str): root node id
            max_depth (int): max depth of sub tree, defaults to 4
            max_breadth (int): defaults to 10
            exclude_case_cache (bool): defaults to True, exclude edges labeled `relates_to`
        Returns:
            GExpl: custom graph object
        """
        with self.g.session_scope():
            start_node = self.g.nodes().get(node_id)

            node_title = start_node._dictionary.get("title")

            if node_title in ["Program", "Project"]:
                max_depth = 1

            gr = GExpl()

            nodes = [(start_node, None, 0)]  # node, edge, depth

            while nodes:
                node, edge, current_depth = nodes.pop()
                node_data = None
                if not edge:
                    # handle nodes leaf nodes
                    gr.add_node(node)

                elif not exclude_case_cache or (exclude_case_cache and edge.label != "relates_to"):
                    node_data = gr.add_edge(edge.src, edge.dst, edge.label)

                # if max allowed depth is reach, do not add child nodes to queue anymore, record number of children
                if max_depth and current_depth >= max_depth:
                    if node_data:
                        node_data.data["children"] = len(node.edges_in)
                else:
                    breadth = 0
                    for edge in node.edges_in:
                        nodes.append((edge.src, edge, current_depth + 1))
                        if breadth >= max_breadth:
                            break
                        breadth += 1
            return gr

    def find_matching(self, node_id):

        response = []
        with self.g.session_scope():
            nodes = self.g.nodes().filter(psqlgraph.Node.node_id.like("%{}%".format(node_id)))
            for node in nodes:
                response.append(dict(
                    node_id=node.node_id,
                    type=type(node).__name__,
                    children=len(node.edges_in)
                ))
                if len(response) == 10:
                    break
        return response
