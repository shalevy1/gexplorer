import os

import flask
import psqlgraph

from explorer.resources import search
from explorer.resources import stats
from explorer.resources import ui


def make_app():
    app = flask.Flask(__name__, instance_relative_config=True)

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "test"),
        ACTIVE_DICT=os.environ.get("ACTIVE_DICT", "gdc")
    )

    init_data_models()
    app.db = init_pg_graph()

    # register views
    app.add_url_rule("/", view_func=ui.Index.as_view("index"))
    app.add_url_rule("/templates", view_func=ui.Template.as_view("template"))

    # register api endpoints
    app.register_blueprint(search.v0.blueprint)
    app.register_blueprint(stats.v0.blueprint)

    # handle errors
    app.register_error_handler(404, page_not_found)
    return app


def page_not_found(e):
    return flask.render_template("errors/404.html"), 404


def internal_server_error(e):
    return flask.render_template("errors/404.html"), 500


def init_data_models():
    active_dict = os.environ.get("ACTIVE_DICT", "gdc")
    if active_dict == "gdc":
        from gdcdatamodel import models  # noqa
#     elif active_dict == "bio":
#         from biodictionary import biodictionary
#         from gdcdatamodel import models


def init_pg_graph():
    return psqlgraph.PsqlGraphDriver(
        host=os.environ.get("DB_HOST", "postgres.service.consul"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PWD"),
        database=os.environ.get("DB_NAME")
    )
