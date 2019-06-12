function AutocompleteBar(elementId) {
    this.client = new GraphResource();
    this.element = document.getElementById(elementId);

    this.currentFocus = null;
    this.autocompleteItemsClass = "ge-autocomplete-items";
    this.autocompleteListClass = "ge-autocomplete-list";
    this.activeAutocompleteClass = "ge-autocomplete-active";
}

AutocompleteBar.prototype.bindInputEvent = function () {

    let bar = this;
    bar.element.addEventListener("input", function (e) {
        let queryValue = this.value;

        /*close any already open lists of autocompleted values*/
        bar.closeAutoCompleteItems();
        if (!queryValue || queryValue.length < 4) {
            return false;
        }

        bar.currentFocus = -1;
        let div = document.createElement("DIV");
        div.setAttribute("id", this.id + bar.autocompleteListClass);
        div.setAttribute("class", bar.autocompleteItemsClass);

        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(div);

        bar.client.find_matching(queryValue).then(function (data) {

            for (let index in data.nodes) {
                let node = data.nodes[index];
                let node_id = node.node_id

                let startPos = node_id.indexOf(queryValue);
                let boldArea = "<b>" + node_id.substr(startPos, queryValue.length) + "</b>";

                let autocompleteItem = document.createElement("DIV");
                autocompleteItem.innerHTML = node.type
                    + " ( " + node_id.substr(0, startPos) + boldArea + node_id.substr(startPos + queryValue.length)
                    + " [ " + node.children + " ] ) ";
                autocompleteItem.innerHTML += "<input type='hidden' value='" + node_id + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                autocompleteItem.addEventListener("click", function (e) {
                    bar.element.value = this.getElementsByTagName("input")[0].value;
                    bar.closeAutoCompleteItems();
                });
                div.appendChild(autocompleteItem);
            }
        });
    });

};

AutocompleteBar.prototype.bindKeyEvent = function () {
    let bar = this;
    bar.element.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + bar.autocompleteListClass);
        if (x) x = x.getElementsByTagName("div");
        if (e.which === 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            bar.currentFocus++;
            /*and and make the current item more visible:*/
            bar.addActive(x);
        } else if (e.which === 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            bar.currentFocus--;
            /*and and make the current item more visible:*/
            bar.addActive(x);
        } else if (e.which == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (bar.currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[bar.currentFocus].click();
                // bar.element.focus();
            }
        }
    });
};

AutocompleteBar.prototype.closeAutoCompleteItems = function (elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    let x = document.getElementsByClassName(this.autocompleteItemsClass);
    for (let i = 0; i < x.length; i++) {
        if (elmnt !== x[i] && elmnt !== this.element) {
            x[i].parentNode.removeChild(x[i]);
        }
    }
};

AutocompleteBar.prototype.removeActive = function (x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (let i = 0; i < x.length; i++) {
        x[i].classList.remove(this.activeAutocompleteClass);
    }
};

AutocompleteBar.prototype.addActive = function (x) {
    /*a function to classify an item as "active":*/
    if (!x) {
        return false;
    }
    /*start by removing the "active" class on all items:*/
    this.removeActive(x);
    if (this.currentFocus >= x.length) {
        this.currentFocus = 0;
    }
    if (this.currentFocus < 0) {
        this.currentFocus = (x.length - 1);
    }
    /*add class "autocomplete-active":*/
    x[this.currentFocus].classList.add(this.activeAutocompleteClass);
};

(function() {
    let bar = new AutocompleteBar("search");
    bar.bindInputEvent();
    bar.bindKeyEvent();
})();