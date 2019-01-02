""" Data Structure for building graph networks using vis Javascript library"""


class Node(object):

    def __init__(self, node_id, label, data=None, parent_id=None):
        self.id = node_id
        self.label = label
        self.title = "{} ({})".format(label, self.id)
        self.data = data
        self.parent = parent_id
        self.shape = "dot"

    def __eq__(self, other):
        if isinstance(other, Node):
            return self.id == other.id
        return False

    def __hash__(self):
        return hash(self.id)

    @property
    def json(self):
        return dict(id=self.id, group=self.label, title=self.title, data=self.data)


class Edge(object):

    def __init__(self, src, dst, label, data=None):
        self.src = src
        self.dst = dst
        self.label = label
        self._data = data

    def __eq__(self, other):
        if isinstance(other, Edge):
            return self.src == other.src and self.dst == other.dst
        return False

    def __hash__(self):
        return hash((self.src, self.dst))

    @property
    def json(self):
        return {"from": self.src, "to": self.dst, "label": self.label}


def get_group(label):
    return dict(color=get_color(label))


def get_color(label):
    label_color = hex(hash(label) & 0x00FFFFFF)
    return "#{:f<6}".format(label_color[2:])


if __name__ == '__main__':
    print get_group("Submitted Unaligned Reads")