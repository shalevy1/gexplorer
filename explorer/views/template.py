import flask


blueprint = flask.Blueprint("template", __name__, url_prefix="/templates")


@blueprint.route("/")
def index():
    return flask.render_template("pages/templateviewer.html", ctx=dict(title="Templates Viewer", page="templates"))
