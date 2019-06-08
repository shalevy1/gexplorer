import flask


blueprint = flask.Blueprint("index", __name__, url_prefix="")


@blueprint.route("/")
def index():
    return flask.render_template("welcome.html", ctx=dict(title="Welcome", page="home"))
