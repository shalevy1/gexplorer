from explorer.mocks.data import MockData


def make_data(source, g, add_to_existing=False):
    """ Creates dummy data in the data
    Args:
        source (str|None): seed data file location
        g (psqlgraph.PsqlGraphDriver): pg driver
        add_to_existing (bool): add nodes to existing data, else skip if project already exists
    """
    mock = MockData(g, "SAMPLE", "TEST", add_to_existing=add_to_existing)
    mock.generate(source)
