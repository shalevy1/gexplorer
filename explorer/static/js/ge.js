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
        for (let header in xheaders) {
            this.headers[header] = xheaders[header];
        }
    },

    /**
     * Shorthand for making requests
     */
    makeRequest: function (path, method, entity) {
        this.preformatUrl(path, entity["$params"]);

        let headers = entity["$headers"];
        if (headers !== undefined) {
        	this.addHeaders(headers);
        }
        return this.execute(method, entity["$entity"]);
    },

    execute: function (method, entity) {

        let pathUrl = this.apiUrl;
        let headers = this.headers;

        entity = JSON.stringify(entity);

        // Return a new promise.
        return new Promise(function (resolve, reject) {
            // Do the usual XHR stuff
            let req = new XMLHttpRequest();
            req.open(method, pathUrl);

            for (let header in headers) {
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

let GraphResource = {

    path: "/s",
    
    query: function (node_id) {
        let client = new ServiceClient();
        let entity = {"$params": {"node": node_id}, "$headers": {"Content-Type": "text/plain"}}
        return client.makeRequest(this.path, "GET", entity).then(JSON.parse);

    }

};


let Index = {

    init: function() {
        this.bind();
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

        let page = this;
        page.elements.search.addEventListener("keypress", function(evt) {
            evt.preventDefault();
            let key = evt.which || evt.keyCode;
            if (key === 13) { // 13 is enter
                // code for enter
                page.render(evt.target.value)
            }
        })
    },

    render: function(node_id) {
        let page = this;
        // create a network
        let container = page.elements.canvas;
        let spinner = document.createElement("div");
        spinner.setAttribute("uk-spinner", "ration: 2");
        spinner.classList.add("uk-position-center");
        container.append(spinner)
        GraphResource.query(node_id).then(function(gdata) {

            console.log(gdata)

            let data = {
                nodes: new vis.DataSet(gdata.nodes),
                edges: new vis.DataSet(gdata.edges)
            };
            let options = {
                groups: gdata.groups,
                interaction: {
                    hover:true
                },
                layout: {
                    randomSeed: 1,
                    improvedLayout: false
                },
                nodes: {
                    shape: "dot",
                    font: {
                        color: "white"
                    },
                    borderWidth: 2,
                    physics: false
                },
                edges: {
                    arrows: {
                        "from": {
                            enabled: true
                        }
                    }
                }
            };

            // initialize your network!
            let network = new vis.Network(container, data, options);
            network.on("click", function (params) {
                params.event = "[original event]";
                let node = this.getNodeAt(params.pointer.DOM);
                let node_data = data.nodes.get(node)
                console.log(node_data.data);
            });
        });
    }
};

(function() {
    Index.init()
})();