"use strict";

/**
 * JS Restful API client
 */
function ApiClient() {

    // base url, useful when working with an external server
    this.resourceUrl = "";

    // custom headers used with the request
    this.headers = {};
}

/**
 * Formats the url by appending get_subtree params to the base url
 * @param resourcePath {string}: resource path
 * @param queryParams: {Object}: key value pairs
 */
ApiClient.prototype.generateUrl = function (resourcePath, queryParams) {

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
    this.generateUrl(path, payload["$params"]);

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
ApiClient.prototype.execute = function (method, entity) {

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
 * @param maxDepth {int}: maximum allowed depth of tree
 * @param maxBreadth (int): maximum allowed breadth for each node
 * @param exclude_label (boolean): exclude case cache edges if true
 * @returns {PromiseLike<T | never> | Promise<T | never> | Ft}
 */
GraphResource.prototype.get_subtree = function (nodeId, maxDepth, maxBreadth, exclude_label) {
    let client = new ApiClient();
    let params = {
            "node": nodeId,
            "max_depth": maxDepth,
            "max_breadth": maxBreadth
        };
    if (exclude_label !== undefined || exclude_label !== null) {
        params["exclude_case_cache"] = exclude_label
    }
    let entity = {"$params": params, "$headers": {"Content-Type": "text/plain"}};
    return client.makeRequest(this.resourcePath, "GET", entity).then(JSON.parse);
};

/**
 *
 * @param nodeId {string}: node uuid
 * @param maxDepth {int}: maximum allowed depth of tree
 * @param maxBreadth (int): maximum allowed breadth for each node
 * @param exclude_label (boolean): exclude case cache edges if true
 * @returns {PromiseLike<T | never> | Promise<T | never> | Ft}
 */
GraphResource.prototype.find_matching = function (nodeId) {
    let client = new ApiClient();
    let path = this.resourcePath + "/find";
    let params = {
            "node": nodeId
        };
    let entity = {"$params": params, "$headers": {"Content-Type": "application/json"}};
    return client.makeRequest(path, "GET", entity).then(JSON.parse);
};


/**
 * Local state impl
 * @constructor
 */
function Store() {
    this.state = new Map();
    this.listeners = new Map();
    this.isMutating = false;
}

/**
 * Retrieves state for a given key
 * @param state {string}: state key
 * @returns {*}: value associated wit key or null
 */
Store.prototype.getState = function (state) {
    if (this.state.hasOwnProperty(state)) {
        return this.state[state];
    }
    return null;
};

/**
 * Sets the value for a given state and dispatches changes to available listeners
 * @param state {string}: state key
 * @param value {Object}: value for state
 */
Store.prototype.update = function (state, value) {

    // TODO if is mutating, wait

    this.isMutating = true;

    this.state[state] = value;
    this.dispatch(state);

    this.isMutating = false;
};

/**
 * Adds a listener to a given state key, listeners are triggered once there is a change state
 * @param state {string}: state key
 * @param callback {function}: listener function
 */
Store.prototype.subscribe = function (state, callback) {
    let listeners = this.listeners[state];
    if (listeners === undefined)
        listeners = [];
        this.listeners[state] = listeners;
    listeners.push(callback);
};

Store.prototype.dispatch = function (state) {
    let listeners = this.listeners[state];
    for (let index in listeners) {
        if (listeners.hasOwnProperty(index)) {
            let listener = listeners[index];
            listener();
        }
    }
};

/**
 * Creates a new state
 * @param initialState {Object}: key value object pair
 * @returns {Store}
 */
function createState(initialState) {
    let state = new Store();
    if (initialState !== null || initialState !== undefined) {
        state.state = initialState
    }
    return state;
}

const state = createState({});

function logState() {
    console.log("Search Param: " + state.getState("search"))
}

state.subscribe("search", logState);

function Index() {

    this.graphTitle = document.querySelector("#graph-title");

    this.searchBar = document.querySelector("#search");
    this.fields = document.querySelector("#fields");
    this.modalAnchor = document.querySelector("#graph-property");
    this.networkView = document.querySelector("#graph");
    this.networkDepth = document.querySelector("#network-depth");
    this.nodeBreadth = document.querySelector("#node-breadth");
    this.legendsView = document.querySelector("#legends-view");
    this.excludeLabel = document.querySelector("#exclude-case-cache");

    // api client
    this.client = new GraphResource();

    this.bindSearch();
}


Index.prototype.bindSearch = function() {
    let page = this;
    this.searchBar.addEventListener("input", function(evt) {

        evt.preventDefault();
        let queryValue = evt.target.value;
        if (queryValue.length < 4) {
            return false;
        }
        state.update("search", queryValue);

        console.log(evt.which);
        if (evt.which === 13) { // 13 is enter
            evt.preventDefault();
            // clean up hack
            UIkit.sticky("#close-search").$el.click();
            let maxDepth = page.networkDepth;
            let nodeBreadth = page.nodeBreadth;

            if (isValidUuid(queryValue)) {
                page.showSpinner(page.networkView);
                let ntwk = new VisNetwork(queryValue, maxDepth, nodeBreadth,
                    page.networkView, page.modalAnchor, page.legendsView, page.excludeLabel);
                ntwk.render();
            }
        }else {

            page.closeAutoCompleteItems(evt.target);
            let  div = document.createElement("DIV");
            div.setAttribute("id", this.id + "ge-autocomplete-list");
            div.setAttribute("class", "ge-autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(div);

            page.client.find_matching(queryValue).then(function (data) {

                    for (let index in data.nodes) {
                        let node = data.nodes[index];
                        let node_id = node.node_id
                        let startPos = node_id.indexOf(queryValue);
                        let boldArea = "<b>" + node_id.substr(startPos, queryValue.length) + "</b>";
                        let b = document.createElement("DIV");
                        b.innerHTML = node.type + " ( " + node_id.substr(0, startPos) + boldArea + node_id.substr(startPos + queryValue.length) + " ) ";
                        b.innerHTML += "<input type='hidden' value='" + node_id + "'>";
                        /*execute a function when someone clicks on the item value (DIV element):*/
                        b.addEventListener("click", function (e) {
                            page.searchBar.value = this.getElementsByTagName("input")[0].value;
                            page.closeAutoCompleteItems(evt.target);
                        });
                        div.appendChild(b);
                    }
                });
        }
        return false;
    });

    this.searchBar.addEventListener("keydown", function (evt) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
    });
};

Index.prototype.closeAutoCompleteItems = function(inp, elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    let x = document.getElementsByClassName("ge-autocomplete-items");
    for (let i = 0; i < x.length; i++) {
      if (elmnt !== x[i] && elmnt !== inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

Index.prototype.showSpinner = function(container) {
    let spinner = document.createElement("div");

    spinner.setAttribute("uk-spinner", "ration: 2");
    spinner.classList.add("uk-position-center");

    container.innerHTML = spinner.outerHTML;

};

function isValidUuid(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let result = regex.exec(uuid);
    return result !== null && result.length === 1;
}

function VisNetwork(root_id, depth, nodeBreadth, container, modal, legends, exclude_label) {
    this.root = root_id;
    this.depth = depth;
    this.breadth = nodeBreadth;
    this.excludeLabel = exclude_label;

    this.graph = null;
    this.nodes = null;
    this.edges = null;
    this.groups = null;
    this.network = null;

    this.modal = modal;
    this.container = container;
    this.legends = legends;
    this.graphResource = new GraphResource();

    state.subscribe("networkGroups", this.renderLegend.bind(this));
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
                enabled: true,
                levelSeparation: 150,
                nodeSpacing: 100,
                treeSpacing: 200,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: false,
                direction: 'UD',        // UD, DU, LR, RL
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
        },
        physics: {
            maxVelocity: 10
        }
    }
};

VisNetwork.prototype.render = function() {

    let visNetwork = this;
    this.graphResource.get_subtree(this.root, this.depth.value, this.breadth.value,
        this.excludeLabel.checked).then(function(gdata) {

        let groups = gdata.groups;
        visNetwork.nodes = new vis.DataSet(gdata.nodes);
        visNetwork.edges = new vis.DataSet(gdata.edges);

        let data = {
            nodes: visNetwork.nodes,
            edges: visNetwork.edges
        };

        visNetwork.storeNetworkGroups(groups);

        let network = new vis.Network(visNetwork.container, data, visNetwork.getOptions());
        network.on("clickx", function (params) {
            params.event = "[original event]";
            let node = this.getNodeAt(params.pointer.DOM);
            if (node !== null && node !== undefined) {
                let node_data = data.nodes.get(node);
                visNetwork.modalAnchor.innerHTML = renderNetworkProperties(node_data);
                UIkit.modal(visNetwork.modalAnchor).show();
            }
        });


        network.on("click", function (params) {
            params.event = "[original event]";
            let node = this.getNodeAt(params.pointer.DOM);
            if (node !== null && node !== undefined) {
                // render new nodes aif any
                visNetwork.renderNode(node);
            }
        });
        visNetwork.network = network;
    });
};

VisNetwork.prototype.renderNode = function(nodeId) {
    let visNetwork = this;
    this.graphResource.get_subtree(nodeId, this.depth, this.breadth, this.excludeLabel.checked).then(function(node_data) {
        let nodes = node_data.nodes;
        let edges = node_data.edges;
        let groups = node_data.groups;
        groups = Object.assign(visNetwork.groups, groups);
        visNetwork.storeNetworkGroups(groups);
        visNetwork.network.setOptions(visNetwork.getOptions());

        for (let node in nodes) {
            visNetwork.nodes.update(nodes[node]);
        }

        for (let edge in edges) {
            visNetwork.edges.update(edges[edge]);
        }
    });
};

VisNetwork.prototype.renderLegend = function() {
    let inHtml = "";
    let unsorted_groups = state.getState("networkGroups");
    const  groups = {};
    Object.keys(unsorted_groups).sort().forEach(function (key) {
        groups[key] = unsorted_groups[key];
    });
    for (let grp in groups) {
        if (groups.hasOwnProperty(grp)){
            let group = groups[grp];
            inHtml += legendView(grp, group.color)
        }
    }
    this.legends.innerHTML = inHtml;
};

VisNetwork.prototype.storeNetworkGroups = function(groups) {
    this.groups = groups;
    state.update("networkGroups", groups);
};

function legendView(grp, color) {
    return `
        <div class="uk-grid-collapse" uk-grid>
            <div class="uk-width-1-5" style="background-color: ${color}">
                
            </div>
            <div class="uk-width-4-5 uk-text-truncate " style="padding-left: 10px;">
                ${grp}
            </div>
        </div>
    `
}

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
    let index = new Index();
})();