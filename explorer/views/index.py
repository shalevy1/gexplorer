import os
import flask


blueprint = flask.Blueprint("index", __name__, url_prefix="")


@blueprint.route("/")
def index():
    return flask.render_template("welcome.html", ctx=dict(title="Welcome", page="home",
                                                          database=os.getenv("DB_HOST"),
                                                          active_dict=os.getenv("ACTIVE_DICT")))
