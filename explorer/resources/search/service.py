import logging

import psqlgraph
from explorer.core import Builder


class TreeLoader(object):

    def __init__(self, pg_driver):
        self.g = pg_driver
        self.logger = logging.getLogger(self.__module__ + "." + self.__class__.__name__)

    def load_subtree(self, node_id, max_depth=4, max_breadth=40, exclude_case_cache=True):
        """ Loads a sub tree for the provided node id, using the specified max depth and width
        Args:
            node_id (str): root node id
            max_depth (int): max depth of sub tree, defaults to 4
            max_breadth (int): defaults to 10
            exclude_case_cache (bool): defaults to True, exclude edges labeled `relates_to`
        Returns:
            Builder: custom graph object
        """
        with self.g.session_scope():
            builder = Builder()
            root_node = self.g.nodes().get(node_id)

            if not root_node:
                self.logger.info("No node found with id {}", node_id)
                return builder

            node_title = root_node.label

            if node_title in ["Program", "Project"]:
                max_depth = 1  # enforce a single depth for these node types

            nodes = [(root_node, None, 0)]  # node, edge, depth

            while nodes:
                node, edge, current_depth = nodes.pop()
                node_data = None
                if not edge:
                    # handle nodes leaf nodes
                    builder.add_node(node, current_depth)

                elif not exclude_case_cache or (exclude_case_cache and edge.label != "relates_to"):
                    node_data = builder.add_edge(edge.src, edge.dst, edge.label, current_depth)

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
            return builder

    def find_matching(self, node_id_pattern):
        """ Finds nodes matching the given node_id
        Args:
            node_id_pattern (str): node_id pattern for matching 
        Returns:
            list[dict]: list of info on the nodes picked 
        """
        response = []
        with self.g.session_scope():
            nodes = self.g.nodes().filter(psqlgraph.Node.node_id.like("%{}%".format(node_id_pattern)))
            for node in nodes:
                response.append(dict(
                    node_id=node.node_id,
                    type=type(node).__name__,
                    children=len(node.edges_in)
                ))
                if len(response) == 10:
                    break
        return response
