from explorer.mocks.data import MockData


def make_data(source, g):
    """ Creates dummy data in the data
    Args:
        source (str): seed data file location
        g (psqlgraph.PsqlGraphDriver): pg driver
    """
    mock = MockData(g, "SAMPLE", "TEST")
    mock.generate(source)
