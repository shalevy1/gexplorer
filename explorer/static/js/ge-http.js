/**
 * JS API searchResource
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
ApiClient.prototype.buildURL = function (resourcePath, queryParams) {

    this.resourceUrl += resourcePath;

    let params = "";
    if (queryParams !== null && queryParams !== undefined) {
        for (let param in queryParams) {
            if (queryParams.hasOwnProperty(param)) {
                params += param + "=" + queryParams[param] + "&";
            }
        }

        if (params !== "") {
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
        if (xheaders.hasOwnProperty(header)) {
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
    this.buildURL(path, payload["$params"]);

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
            if (headers.hasOwnProperty(header)) {
                req.setRequestHeader(header, headers[header]);
            }
        }

        req.onload = function () {
            if (req.status === 200) {
                resolve(req.response);
            } else {
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


function StatsResource() {
    this.resourcePath = "/stats"
}

StatsResource.prototype.ping = function() {
  let client = new ApiClient();
  return client.makeRequest(this.resourcePath, "GET", {}).then(JSON.parse);
};