import json
import os

import uuid

from gdcdatamodel import models
from gdcdictionary import gdcdictionary
from psqlgraph import create_all, mocks


class MockData(object):

    def __init__(self, g, program, project):
        self.g = g
        self.program = program
        self.project = project

        self.generated = False
        
        self._add_tables()
    
    def _add_tables(self):
        create_all(self.g.engine)

    def _make_program(self):
        with self.g.session_scope():
            project = self.g.nodes(models.Project).props(code=self.project).path("programs").props(name=self.program).first()
            if project:
                self.generated = True
                return project

            # create program
            program = models.Program(node_id=str(uuid.uuid4()))
            program.name = self.program

            project = models.Project(node_id=str(uuid.uuid4()))
            project.code = self.project
            program.projects.append(project)
            self.g.node_insert(program)

            return project

    def _read_source(self, file_loc):
        with open(file_loc, "r") as r:
            return json.loads(r.read(), "utf8")

    def generate(self, file_loc):
        project = self._make_program()
        if self.generated:
            return

        file_loc = file_loc if file_loc else "{}/samples/seed.json".format(os.path.dirname(__file__))
        graph = self._read_source(file_loc)
        global_props = {
            'properties': {
                'project_id': "{}-{}".format(self.program, self.project),
                'state': 'submitted'
            }
        }
        factory = mocks.GraphFactory(models=models, dictionary=gdcdictionary,
                                     graph_globals=global_props)
        nodes = factory.create_from_nodes_and_edges(nodes=graph["nodes"], edges=graph["edges"], all_props=True)
        with self.g.session_scope() as s:
            for node in nodes:
                if node.label == "case":
                    node.projects.append(project)
                s.add(node)
                