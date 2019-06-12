"use strict";

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

function isValidUuid(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let result = regex.exec(uuid);
    return result !== null && result.length === 1;
}
