"use strict";

function showSpinner(container) {
    let spinner = document.createElement("div");

    spinner.setAttribute("uk-spinner", "ration: 2");
    spinner.classList.add("uk-position-center");

    container.innerHTML = spinner.outerHTML;

}

/**
 * JS Restful API
 */
function ApiClient() {

    // base url, useful when working with an external server
    this.resourceUrl = "";

    // custom headers used with the request
    this.headers = {};
}

/**
 * Formats the url by appending query params to the base url
 * @param resourcePath {string}: resource path
 * @param queryParams: {Object}: key value pairs
 */
ApiClient.prototype.makeUrl = function (resourcePath, queryParams) {

    this.resourceUrl += resourcePath;

    let params = "";
    if (queryParams !== null && queryParams !== undefined) {
        for (let param in queryParams) {
            if (queryParams.hasOwnProperty(param)){
                params += param + "=" + queryParams[param] + "&";
            }
        }

        if (params !== ""){
            this.resourceUrl += "?" + params;
        }
    }
};

/**
 * Adds extra headers
 * @param xheaders {Object}: key value pairs of headers
 */
ApiClient.prototype.addHeaders = function (xheaders) {
    for (let header in xheaders) {
        if (xheaders.hasOwnProperty(header)){
            this.headers[header] = xheaders[header];
        }
    }
};

/**
 * Makes a HTTP request, by:
 *  * formatting the url if necessary
 *  * add custom headers if necessary
 *  * make request
 * @param path {string}: resource path
 * @param method {string}: HTTP method, one of GET, POST, PUT
 * @param payload {Object}: request payload, contains keys $params, $headers, $entity
 * @returns {*}
 */
ApiClient.prototype.makeRequest = function (path, method, payload) {
    this.makeUrl(path, payload["$params"]);

    let headers = payload["$headers"];
    if (headers !== undefined) {
        this.addHeaders(headers);
    }
    return this.execute(method, payload["$entity"]);
};

/**
 * Promised based wrapper around XMLHttpRequest
 * @param method
 * @param entity
 * @returns {Promise<any>}
 */
ApiClient.prototype. execute = function (method, entity) {

    let resourceUrl = this.resourceUrl;
    let headers = this.headers;

    entity = JSON.stringify(entity);

    // Return a new promise.
    return new Promise(function (resolve, reject) {
        // Do the usual XHR stuff
        let req = new XMLHttpRequest();
        req.open(method, resourceUrl);

        for (let header in headers) {
            if (headers.hasOwnProperty(header)){
                req.setRequestHeader(header, headers[header]);
            }
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
};

/**
 * Graph Query resource
 * @constructor
 */
function GraphResource() {

    this.resourcePath = "/s";
}

/**
 *
 * @param nodeId {string}: node uuid
 * @returns {PromiseLike<T | never> | Promise<T | never> | Ft}
 */
GraphResource.prototype.query = function (nodeId, maxDepth) {
    let client = new ApiClient();
    let entity = {"$params": {"node": nodeId, "max_depth": maxDepth}, "$headers": {"Content-Type": "text/plain"}};
    return client.makeRequest(this.resourcePath, "GET", entity).then(JSON.parse);
};

function IndexPage() {

    this.searchBar = document.querySelector("#search");
    this.fields = document.querySelector("#fields");
    this.modalAnchor = document.querySelector("#graph-property");
    this.networkView = document.querySelector("#graph");
    this.networkDepth = document.querySelector("#network-depth");
    this.legendsView = document.querySelector("#legends-view");
    this.addEvents();
}

IndexPage.prototype.addEvents = function() {

    let page = this;
    this.searchBar.addEventListener("keypress", function(evt) {
        evt.preventDefault();
        let key = evt.which || evt.keyCode;
        if (key === 13) { // 13 is enter
            // code for enter
            showSpinner(page.networkView);
            let maxDepth = page.networkDepth.value;
            let ntwk = new VisNetwork(evt.target.value, maxDepth, page.networkView, page.modalAnchor, page.legendsView);
            ntwk.render();
        }
    })
};

function VisNetwork(root_id, depth, container, modal, legends) {
    this.root = root_id;
    this.depth = depth;

    this.graph = null;
    this.nodes = null;
    this.edges = null;
    this.groups = null;

    this.modal = modal;
    this.container = container;
    this.legends = legends;
    this.graphResource = new GraphResource();
}

VisNetwork.prototype.getOptions = function() {
    return {
        groups: this.groups,
        interaction: {
            hover: true
        },
        layout: {
            improvedLayout: false,
            hierarchical: {
                enabled: false,
                levelSeparation: 150,
                nodeSpacing: 100,
                treeSpacing: 200,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true,
                direction: 'DU',        // UD, DU, LR, RL
                sortMethod: 'directed'   // hubsize, directed
            }
        },
        nodes: {
            shape: "dot",
            font: {
                color: "white"
            },
            borderWidth: 2
        },
        edges: {
            arrows: {
                "from": {
                    enabled: true
                }
            }
        }
    }
};

VisNetwork.prototype.render = function() {

    let visNetwork = this;
    this.graphResource.query(this.root, this.depth).then(function(gdata) {

        // console.log(gdata);

        visNetwork.groups = gdata.groups;
        visNetwork.nodes = new vis.DataSet(gdata.nodes);
        visNetwork.edges = new vis.DataSet(gdata.edges);

        let data = {
            nodes: visNetwork.nodes,
            edges: visNetwork.edges
        };

        // initialize your network!
        let network = new vis.Network(visNetwork.container, data, visNetwork.getOptions());
        network.on("click", function (params) {
            params.event = "[original event]";
            let node = this.getNodeAt(params.pointer.DOM);
            if (node !== null && node !== undefined) {
                let node_data = data.nodes.get(node);
                visNetwork.modalAnchor.innerHTML = renderNetworkProperties(node_data);
                UIkit.modal(visNetwork.modalAnchor).show();
            }
        });

        // render legends
        visNetwork.renderLegend();

        // network.on("click", function (params) {
        //     params.event = "[original event]";
        //     let node = this.getNodeAt(params.pointer.DOM);
        //     if (node !== null && node !== undefined) {
        //         let node_data = data.nodes.get(node);
        //         console.log(node_data.data);
        //         graphResource.query(node, maxDepth).then(function(gdata) {
        //             let gnodes = gdata.nodes;
        //             let gedges = gdata.edges;
        //
        //             for (let gnode in gnodes) {
        //                 nodes.update(gnodes[gnode]);
        //             }
        //
        //             for (let gnode in gedges) {
        //                 edges.update(gedges[gnode]);
        //             }
        //         });
        //     }
        });
};

VisNetwork.prototype.renderLegend = function() {
    let inHtml = "";
    for (let grp in this.groups) {
        let group = this.groups[grp]
        inHtml += "<div style='background-color=    '" + group.color + "'>" + grp + "</div>"
    }
    this.legends.innerHTML = inHtml;
};

function renderNetworkProperties(networkData) {
    return `
        <div class="uk-modal-dialog uk-margin-auto-vertical">
            <button class="uk-modal-close-default" type="button" uk-close></button>
            <div class="uk-modal-header">
                <h4 class="uk-modal-titlex">${networkData.title}</h4>
            </div>
            <div class="uk-modal-body">
            ${JSON.stringify(networkData.data, null, 4)}
            </div>
        </div>
    `
}

(function() {
    let index = new IndexPage();
})();