import flask

from explorer import routes
from explorer.graph import search


def make_app():
    app = flask.Flask(__name__, instance_relative_config=True)

    app.config.from_mapping(
        SECRET_KEY="test"
    )

    app.gs = search.GSearch()

    app.register_blueprint(routes.index.blueprint)
    app.register_blueprint(routes.graph.blueprint)
    return app
