function get_workflow_state(storage_key) {
    storage_key = storage_key || 'auth0_result';
    var result = localStorage.getItem(storage_key);
    if (result)
        return JSON.parse(result);
    else
        return {};
}

function resume_workflow(workflow, options) {
    if (!workflow || typeof workflow !== 'object')
        throw new Error('options.workflow parameter must be specified.')
    if (options && typeof options !== 'object')
        throw new Error('options parameter must be an object.')

    options = options || {};
    options.storage_key = options.storage_key || 'auth0_result';
    options.intitial_state = options.intitial_state || 'start';

    // Determine current workflow state
    var hash = getHashParams();
    var state = hash.state;
    delete hash.state;

    // Update workflow results in local storage
    var auth0_result;
    if (state !== null && state !== undefined) {
        
        auth0_result = localStorage.getItem(options.storage_key);
        if (auth0_result)
            auth0_result = JSON.parse(auth0_result);
        auth0_result[state] = hash;
    }
    else {
        auth0_result = {};
    }
    localStorage.setItem(options.storage_key, JSON.stringify(auth0_result));

    // store workflow data in local storage

    // Determine state transition
    var nextState;
    if (state === null || state === undefined) {
        nextState = options.intitial_state;
    }
    else if (!workflow[state]) {
        throw new Error("Workflow does not define state `" + state + "`.");
    }
    else if (typeof workflow[state].next === 'undefined' || workflow[state].next === 'end') {
        nextState = null;
    }
    else if (typeof workflow[state].next === 'string') {
        nextState = workflow[state].next;
    }
    else if (typeof workflow[state].next === 'function') {
        nextState = workflow[state].next(options);
    }
    else {
        throw new Error("The `next` property of state `" + state + "` must be a string or a function returning a string.");
    }

    if (nextState === null) {
        // Workflow completed
        document.body.removeAttribute('hidden');
        return false;
    }
    else if (!workflow[nextState] || typeof workflow[nextState] !== 'object') {
        throw new Error("Workflow does not define state `" + nextState + "`, unable to transition.");
    }
    else if (typeof workflow[nextState].url !== 'string') {
        throw new Error("Workflow state `" + nextState + "` does not define `url` property, unable to transition.");
    }
    else {
        // Set up the form for a POST that will initiate the next webtask to run
        options.form_id = options.form_id || 'auth0-wf';
        var form = document.forms[options.form_id];
        if (!form) {
            throw new Error("The page does not contain form with id `" + options.form_id + "`. Unable to set up workflow state transition.");
        }
        form.method = 'POST';
        form.action = workflow[nextState].url;
        addHidden(form, 'callback', workflow[nextState].callback || 
            (window.location.origin 
                + window.location.pathname 
                + window.location.search));
        addHidden(form, 'state', nextState);
        if (workflow[nextState].inputs && typeof workflow[nextState].inputs === 'object') {
            for (var i in workflow[nextState].inputs) {
                addHidden(form, i, workflow[nextState].inputs[i]);
            }
        }
        if (workflow[nextState].transition === 'auto' || workflow[nextState].transition === undefined) {
            // Automatically submit the form
            form.submit();
        }
        else if (workflow[nextState].transition !== 'manual') {
            throw new Error("Workflow state `" + nextState + "` has an unsupported value of the `transition` property. Only `manual` or `auto` are supported.");
        }
        else {
            // Manual state transition, show UI
            document.body.removeAttribute('hidden');
        }
        return true;
    }

    function addHidden(form, key, value) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    function getHashParams() {
        var hashParams = {};
        var e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
           hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }
}
