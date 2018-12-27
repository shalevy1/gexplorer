"use strict";

/**
 * JS Restful API
 */
let ServiceClient = function() {
    this.apiUrl = "";
    this.headers = {};
}

ServiceClient.prototype = {

    init: function() {


    },

    /**
     * Updates the api url to include the target REST resource
     */
    preformatUrl: function (baseUrl, queryParams) {

        this.apiUrl += baseUrl;

        let params = "";
        if (queryParams !== undefined) {
            for (let param in queryParams) {
                params += param + "=" + queryParams[param] + "&";
            }

            if (params !== ""){
                this.apiUrl += "?" + params;
            }
        }
    },

    addHeaders: function (xheaders) {
        for (var header in xheaders) {
            this.headers[header] = xheaders[header];
        }
    },

    /**
     * Shorthand for making requests
     */
    makeRequest: function (path, method, entity) {
        this.preformatUrl(path, entity["$params"]);

        var headers = entity["$headers"];
        if (headers !== undefined) {
        	this.addHeaders(headers);
        }
        return this.execute(method, entity["$entity"]);
    },

    execute: function (method, entity) {

        var pathUrl = this.apiUrl;
        var headers = this.headers;

        entity = JSON.stringify(entity);

        // Return a new promise.
        return new Promise(function (resolve, reject) {
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            req.open(method, pathUrl);

            for (var header in headers) {
                req.setRequestHeader(header, headers[header]);
            }

            req.onload = function () {
                if (req.status === 200) {
                    resolve(req.response);
                }
                else {
                    reject(req);
                }
            };

            req.onerror = function (err) {
                reject(Error(err.message));
            };

            req.send(entity);
        });
    }
};

let GraphService = {

    path: "/s",
    
    query: function (node_id) {
        let client = new ServiceClient();
        let entity = {"$params": {"node": node_id}, "$headers": {"Content-Type": "text/plain"}}
        return client.makeRequest(this.path, "GET", entity).then(JSON.parse);

    }

};


let Index = {

    init: function() {
        this.nodes = [];
        this.bind();
    },

    addNodes: function(nodes) {

        for(let node in nodes) {
            var data = nodes[node];
            var key = data.id;
            this.nodes[key] = data.data
        }
    },

    getNodeInfo: function(node_id) {
        return this.nodes[node_id]
    },

    renderProperties: function(data) {
        var table = document.createElement("table");
        var tbody = document.createElement("tbody");

        data.forEach(function (rowData) {
            var row = document.createElement("tr")
        });

        table.appendChild(tbody)
        this.elements.fields.innerHTML = table.html
    },

    elements: {
        search: document.querySelector("#search"),
        fields: document.querySelector("#fields"),
        canvas: document.querySelector("#graph")
    },

    bind: function() {

        var page = this;
        this.elements.search.addEventListener("keypress", function(evt) {
            evt.preventDefault();
            var key = evt.which || evt.keyCode;
            if (key === 13) { // 13 is enter
              // code for enter
                page.render(evt.target.value)
            }
        })
    },

    render: function(node_id) {
        // create a network
        var container = this.elements.canvas;
        var page = this;
        GraphService.query(node_id).then(function(gdata) {

            page.addNodes(gdata.nodes);
            var nodes = new vis.DataSet(gdata.nodes);
            var edges = new vis.DataSet(gdata.edges);

            // provide the data in the vis format
            var data = {
                nodes: nodes,
                edges: edges
            };
            var options = {
                interaction:{hover:true},
                layout: {
                    randomSeed: 1
                },
                nodes: {
                    shape: "dot",
                    font: {
                        color: "white",
                        mono: "true"
                    },
                    borderWidth: 2
                },
                edges: {
                    arrows: {
                        "from": {
                            enabled: true
                        }
                    }
                },
            };

            // initialize your network!
            var network = new vis.Network(container, data, options);
            network.on("click", function (params) {
                console.log(params)
                params.event = "[original event]";
                // document.getElementById('eventSpan').innerHTML = '<h2>Click event:</h2>' + JSON.stringify(params, null, 4);
                var node = this.getNodeAt(params.pointer.DOM);
                console.log(node);
                console.log(page.getNodeInfo(node));
            });
        });
    }
};

(function() {
    Index.init()
})();