import os

import flask
from flask.views import View


class Index(View):

    def __init__(self):
        self.template_name = "welcome.html"

    def dispatch_request(self):
        return flask.render_template(self.template_name, ctx=dict(title="Welcome", page="home",
                                                                  database=os.getenv("DB_HOST"),
                                                                  active_dict=os.getenv("ACTIVE_DICT")))
