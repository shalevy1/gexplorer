import os

import flask

import datamodelutils
from biodictionary import biodictionary
from dictionaryutils import dictionary

from explorer import api
from explorer import views
from explorer.core import search


def make_app():
    app = flask.Flask(__name__, instance_relative_config=True)

    app.config.from_mapping(
        SECRET_KEY="test",
        ACTIVE_DICT=os.environ.get("ACTIVE_DICT", "gdc")
    )

    init_data_models()
    app.gs = search.GSearch()

    # register views
    app.register_blueprint(views.index.blueprint)

    # register api endpoints
    app.register_blueprint(api.search.v0.blueprint)

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
        from gdcdatamodel import models
    elif active_dict == "bio":
        models = datamodelutils.models
        dictionary.init(biodictionary)
        from gdcdatamodel import models as md
        models.init(md)
