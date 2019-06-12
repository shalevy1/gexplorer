
function DataViewer() {

    this.graphTitle = document.querySelector("#graph-title");

    this.searchBar = document.querySelector("#search");
    this.fields = document.querySelector("#fields");
    this.modalAnchor = document.querySelector("#graph-property");
    this.networkView = document.querySelector("#graph");
    this.networkDepth = document.querySelector("#network-depth");
    this.nodeBreadth = document.querySelector("#node-breadth");
    this.legendsView = document.querySelector("#legends-view");
    this.excludeLabel = document.querySelector("#exclude-case-cache");

    // api searchResource
    this.searchResource = new GraphResource();
}


DataViewer.prototype.bindSearch = function () {
    let page = this;
    this.searchBar.addEventListener("keyup", function (evt) {

        evt.preventDefault();
        let queryValue = this.value;
        if (queryValue.length < 30) {
            return false;
        }

        if (evt.which === 13) { // 13 is enter
            state.update("search", queryValue);
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
        }
    });
};

DataViewer.prototype.showSpinner = function (container) {
    let spinner = document.createElement("div");

    spinner.setAttribute("uk-spinner", "ration: 2");
    spinner.classList.add("uk-position-center");

    container.innerHTML = spinner.outerHTML;

};


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

VisNetwork.prototype.getOptions = function () {
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

VisNetwork.prototype.render = function () {

    let visNetwork = this;
    this.graphResource.get_subtree(this.root, this.depth.value, this.breadth.value,
        this.excludeLabel.checked).then(function (gdata) {

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

VisNetwork.prototype.renderNode = function (nodeId) {
    let visNetwork = this;
    this.graphResource.get_subtree(nodeId, this.depth.value, this.breadth.value, this.excludeLabel.checked).then(function (node_data) {
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

VisNetwork.prototype.renderLegend = function () {
    let inHtml = "";
    let unsorted_groups = state.getState("networkGroups");
    const groups = {};
    Object.keys(unsorted_groups).sort().forEach(function (key) {
        groups[key] = unsorted_groups[key];
    });
    for (let grp in groups) {
        if (groups.hasOwnProperty(grp)) {
            let group = groups[grp];
            inHtml += legendView(grp, group.color)
        }
    }
    this.legends.innerHTML = inHtml;
};

VisNetwork.prototype.storeNetworkGroups = function (groups) {
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
    let dv = new DataViewer();
    dv.bindSearch();
})();