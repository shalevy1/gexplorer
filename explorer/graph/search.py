from psqlgraph import PsqlGraphDriver

from explorer.env import env
from explorer.graph.core import GExpl


class GSearch(object):

    def __init__(self):

        self.init_models()

        self.g = PsqlGraphDriver(
            host=env.get("DB_HOST", "postgres.service.consul"),
            user=env.get("DB_USER"),
            password=env.get("DB_PWD"),
            database=env.get("DB_NAME")
        )

    @staticmethod
    def init_models():
        mode = env.get("DEPLOY_MODE", "gdc")
        if mode == "gdc":
            from gdcdatamodel import models  # noqa

    def query(self, node_id, max_depth=None, exclude_edge=None):
        with self.g.session_scope():
            start_node = self.g.nodes().get(node_id)

            node_title = start_node._dictionary.get("title")

            if node_title in ["Program", "Project"]:
                max_depth = 1

            gr = GExpl()

            nodes = [(start_node, None, 0)]  # node, edge, depth

            while nodes:
                node, edge, current_depth = nodes.pop()

                if edge and edge.label != exclude_edge:
                    node_data = gr.add_edge(edge.src, edge.dst, edge.label)

                # if max allowed depth is reach, do not add child nodes to queue anymore, record number of children
                if max_depth and current_depth >= max_depth:
                    if node_data:
                        node_data.data["children"] = len(node.edges_in)
                else:
                    for edge in node.edges_in:
                        nodes.append((edge.src, edge, current_depth + 1))
            return gr
