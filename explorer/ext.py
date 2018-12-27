from gdcdatamodel import models
from psqlgraph import PsqlGraphDriver

from explorer.env import env


colors = {
    "Aligned Reads": "#3742fa",
    "Aligned Reads Index": "#5352ed",
    "Alignment Workflow": "#353b48",
    "Aliquot": "#7bed9f",
    "Annotated Somatic Mutation": "#192a56",
    "Case": "#4cd137",
    "Demographic": "#0097e6",
    "Diagnosis": "#c23616",
    "Read Group": "#ffa502",
    "Sample": "#ff7f50",
    "Simple Somatic Mutation": "#1e90ff",
    "Somatic Annotation Workflow": "#718093",
    "Somatic Mutation Calling Workflow": "#718093",
    "Somatic Mutation Index": "#1e90ff",
    "Submitted Unaligned Reads": "#40739e"
}


class GraphService(object):

    def __init__(self):
        self.g = PsqlGraphDriver(
            host=env.get("DB_HOST", "postgres.service.consul"),
            user=env.get("DB_USER"),
            password=env.get("DB_PWD"),
            database=env.get("DB_NAME")
        )

    def query(self, node_id):
        with self.g.session_scope():
            start_node = self.g.nodes().get(node_id)
            gr = GraphData(start_node.node_id, start_node._dictionary.get("title"), data=start_node._props)

            nodes = [(start_node, None)]

            while len(nodes) > 0:
                node, parent_id = nodes.pop()
                gr.add_node(node, parent_id)
                for edge in node.edges_in:
                    nodes.append((edge.src, node.node_id))
            return gr


class Node(object):

    def __init__(self, id, label, data=None, parent=None):
        self.id = id
        self.label = label
        self.title = "{} ({})".format(label, self.id)
        self._data = data
        self.parent = parent

    def __eq__(self, other):
        if isinstance(other, Node):
            return self.id == other.id
        return False

    def __hash__(self):
        return hash(self.id)

    @property
    def json(self):
        return dict(id=self.id, title=self.title, color=colors.get(self.label, "#2f3542"), data=self._data)


class Edge(object):

    def __init__(self, src, dst, data=None):
        self.src = src
        self.dst = dst
        self._data = data

    def __eq__(self, other):
        if isinstance(other, Edge):
            return self.src == other.src and self.dst == other.dst
        return False

    def __hash__(self):
        return hash((self.src, self.dst))

    @property
    def json(self):
        return {"from": self.src, "to": self.dst}


class GraphData(object):

    def __init__(self, node_id, label, data=None):
        self.root_id = node_id
        self.nodes = {Node(node_id, label, data=data)}
        self.edges = set()

    def add_node(self, node, parent_id=None):
        node_data = Node(node.node_id, label=node._dictionary.get("title"), data=node._props)
        self.nodes.add(node_data)

        edge_data = Edge(node.node_id, parent_id or self.root_id)
        self.edges.add(edge_data)

    def get_nodes(self):
        return [node.json for node in self.nodes]

    def get_edges(self):
        return [edge.json for edge in self.edges]
