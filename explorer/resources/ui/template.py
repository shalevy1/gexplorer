import flask
from flask.views import View


class Template(View):

    def dispatch_request(self):
        return flask.render_template("pages/templateviewer.html", ctx=dict(title="Templates Viewer", page="templates"))