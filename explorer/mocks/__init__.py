import json
import uuid

from gdcdictionary import gdcdictionary
from gdcdatamodel import models
import psqlgraph


class MockData(object):
    
    
    def __init__(self, g, program, project):
        self.g = g
        self.program = program
        self.project = project
        
        self.generated = False
    
    @staticmethod
    def make_data(source):
        """ Creates dummy data in the data
        Args:
            source (str): seed data file location
        """
        mock = MockData()
        mock.generate(source)
    
    def _make_program(self):
        with self.g.session_scope():
            
            if self.g.nodes(models.Project).props(code=self.project).path("programs").props(name=self.program).one():
                self.generated = True
                return
            
            # create program
            program = models.Program(node_id=str(uuid.uuid4()))
            program.dbgap_accession_number = "phs000335"
            program.name = self.program
    
            project = models.Project(node_id=str(uuid.uuid4()))
            project.code = self.project
            project.dbgap_accession_number = "phs000335"
            program.projects.append(project)
            self.g.node_insert(program)
    
            return project, program.name, project.code
    
    def _read_source(self, file_loc):
        with open(file_loc, "r") as r:
            return json.loads(r.read(), "utf8")
    
    def generate(self, file_loc):
        self._make_program()
        if self.generated:
            return
        
        graph = self._read_source(file_loc)
        global_props = {
            'properties': {
                'project_id': "{}-{}".format(self.program, self.project),
                'state': 'submitted'
            }
        }
        factory = psqlgraph.mocks.GraphFactory(models=models, dictionary=gdcdictionary,
                                     graph_globals=global_props)
        nodes = factory.create_from_nodes_and_edges(nodes=graph["nodes"], edges=graph["edges"], all_props=True)
        with self.g.session_scope() as s:
            for node in nodes:
                s.add(node)

                
    
    