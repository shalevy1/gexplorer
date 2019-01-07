from gdcdatamodel import models
from psqlgraph import PsqlGraphDriver

from explorer.env import env
from explorer.network import Node, Edge, get_group


class QueryService(object):

    def __init__(self):
        self.g = PsqlGraphDriver(
            host=env.get("DB_HOST", "postgres.service.consul"),
            user=env.get("DB_USER"),
            password=env.get("DB_PWD"),
            database=env.get("DB_NAME")
        )

    def query(self, node_id, max_depth=None):
        with self.g.session_scope():
            start_node = self.g.nodes().get(node_id)

            node_title = start_node._dictionary.get("title")

            if node_title in ["Program", "Project"]:
                max_depth = 1

            gr = GraphData(start_node.node_id, start_node._dictionary.get("title"), data=start_node._props)

            nodes = [(start_node, None, None, 0)]  # node, edge, parent_id, depth

            while len(nodes) > 0:
                node, edge, parent_id, current_depth = nodes.pop()

                # start node already added, so skip
                node_data = None
                if node.node_id != start_node.node_id:
                    node_data = gr.add_node(node, edge, parent_id)

                # if max allowed depth is reach, do not add child nodes to queue anymore, record number of children
                if max_depth and current_depth >= max_depth:
                    if node_data:
                        node_data.data["children"] = len(node.edges_in)
                else:
                    for edge in node.edges_in:
                        nodes.append((edge.src, edge, node.node_id, current_depth + 1))
            return gr


class GraphData(object):

    def __init__(self, node_id, label, data=None):
        self.root_id = node_id

        node = Node(node_id, label, data=data)
        # node.shape = "box"
        self.nodes = {node}
        self.edges = set()
        self.groups = {label: get_group(label)}

    def add_node(self, node, edge, parent_id=None):
        node_data = Node(node.node_id, label=node._dictionary.get("title"), data=node._props)
        self.nodes.add(node_data)

        edge_data = Edge(node.node_id, parent_id or self.root_id, edge.label)
        self.edges.add(edge_data)

        self.groups[node_data.label] = get_group(node_data.label)
        return node_data

    def get_nodes(self):
        return [node.json for node in self.nodes]

    def get_edges(self):
        return [edge.json for edge in self.edges]
