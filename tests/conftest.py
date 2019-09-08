import json
import os
import uuid

import psqlgraph
import pytest

from explorer import mocks

SAMPLE_PROGRAM = "GDC"
SAMPLE_PROJECT = "MISC"


def drop_all(engine):
    psqlgraph.base.ORMBase.metadata.drop_all(engine)
    psqlgraph.base.VoidedBase.metadata.drop_all(engine)


@pytest.fixture("session")
def graph_factory(graph_models):
    
    models, dictionary = graph_models
    global_props = {
        'properties': {
            'project_id': "{}-{}".format(SAMPLE_PROGRAM, SAMPLE_PROJECT),
            'state': 'submitted'
        }
    }
    factory = psqlgraph.mocks.GraphFactory(models=models, dictionary=dictionary,
                                 graph_globals=global_props)
    return factory


@pytest.fixture("session", params=["gdc"])
def graph_models(request):
    if request.param == "bio":
        pass
#         from biodictionary import biodictionary as dictionary
    else:
        from gdcdictionary import gdcdictionary as dictionary
    from gdcdatamodel import models
    return models, dictionary


@pytest.fixture("session")
def db(graph_models):
    
    models, _ = graph_models
    db_driver = psqlgraph.PsqlGraphDriver(
            host="localhost",
            user="test",
            password="test",
            database="gexplorer"
        )
    
    # precautionary
    drop_all(db_driver.engine)
    
    psqlgraph.create_all(db_driver.engine)
    add_project(db_driver, models)
    
    yield db_driver
    
    drop_all(db_driver.engine)


def add_project(db_driver, models):
    """ Adds dummy project to database
    Args:
        db_driver (psqlgraph.PsqlGraphDriver): db_driver driver
    """
    with db_driver.session_scope():
        # create program
        program = models.Program(node_id=str(uuid.uuid4()))
        program.name = SAMPLE_PROGRAM

        project = models.Project(node_id=str(uuid.uuid4()))
        project.code = SAMPLE_PROJECT
        program.projects.append(project)
        db_driver.node_insert(program)

        return project, program.name, project.code


@pytest.fixture()
def sample_graph(db, graph_factory):
    """
    Args:
        db (psqlgraph.PsqlGraphDriver):
        graph_factory (psqlgraph.mock.GraphFactory):
    """
    nodes = mocks.make_data(source=None, g=db, add_to_existing=False)
    yield nodes
    with db.session_scope() as x:
        for stale_node in nodes:
            node = db.nodes().get(stale_node.node_id)
            if node:
                x.delete(node)
