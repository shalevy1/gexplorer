import os

import cherrypy

globals = {
    "server.socket_host": "0.0.0.0",
    "server.socket_port": 19891,
    "server.thread_pool": 10,
}

index = {
    "/": {
        "tools.staticdir.on": True,
        "tools.staticdir.root": os.path.join(os.path.dirname(__file__), ''),
        "tools.staticdir.dir": "static",
        "tools.staticdir.index": "index.html"
    }
}

graph = {
    "/": {
        'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        'tools.sessions.on': True,
        'tools.response_headers.on': True,
    }
}


def set_globals(port, threads):
    globals["server.socket_port"] = port or 19891
    globals["server.thread_pool"] = threads or 10
