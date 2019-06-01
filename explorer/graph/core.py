class GNode(object):

    def __init__(self, node_id, label, data=None, shape="dot"):
        self.id = node_id
        self.label = label
        self.title = "{} ({})".format(label, self.id)
        self.data = data or {}
        self.shape = shape

    def __eq__(self, other):
        if isinstance(other, GNode):
            return self.title == other.title
        return False

    def __hash__(self):
        return hash(self.title)

    @property
    def json(self):
        return dict(id=self.id, group=self.label, title=self.title, data=self.data)


class GEdge(object):

    def __init__(self, src, dst, label, data=None):
        self.src = src
        self.dst = dst
        self.label = label
        self._data = data or {}

    @property
    def edge_id(self):
        return "{}-{}-{}".format(self.src, self.label, self.dst)

    def __eq__(self, other):
        if isinstance(other, GEdge):
            return self.src == other.src and self.dst == other.dst and self.label == other.label
        return False

    def __hash__(self):
        return hash((self.src, self.dst, self.label))

    @property
    def json(self):
        return {"from": self.src, "to": self.dst, "label": self.label, "id": self.edge_id}


class GExpl(object):

    def __init__(self):
        self.nodes = set()
        self.edges = set()
        self.groups = {}
        self.edge_labels = set()

    def add_edge(self, src, dst, edge_label):
        """ Adds an edge
        Args:
            src (psqlgraph.Node):
            dst (psqlgraph.Node):
            edge_label (str):
        """
        src_node = GNode(src.node_id, src._dictionary.get("title"), data=src.properties)
        dst_node = GNode(dst.node_id, dst._dictionary.get("title"), data=dst.properties)

        self.nodes.add(src_node)
        self.groups[src_node.label] = get_group(src_node.label)

        self.nodes.add(dst_node)
        self.groups[dst_node.label] = get_group(dst_node.label)

        # gdc graph has reverse representations for src/dst
        edge_data = GEdge(dst.node_id, src.node_id, edge_label)
        self.edges.add(edge_data)
        self.edge_labels.add(edge_label)

    def get_nodes(self):
        return [node.json for node in self.nodes]

    def get_edges(self):
        return [edge.json for edge in self.edges]

    def get_edge_labels(self):
        return [label for label in self.edge_labels]


def get_group(label):
    return dict(color=get_color(label))


def get_color(label):
    label_color = hex(hash(label) & 0x00FFFFFF)
    return "#{:f<6}".format(label_color[2:])