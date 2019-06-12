import os
import flask

blueprint = flask.Blueprint("stats", __name__, url_prefix="/stats")


@blueprint.route("", methods=["GET"])
def ping():
    """ Gets server info """
    info = dict(
        active_dictionary=os.getenv("ACTIVE_DICT"),
        database=os.getenv("DB_HOST")
    )

    return flask.jsonify(info)
