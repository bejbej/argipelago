(() => {
    class DeferredPromise {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
    }

    const forAttribute = "[for]";
    const ifAttribute = "[if]";
    const innerHtmlAttribute = "[innerhtml]";
    const textContentAttribute = "[textcontent]";
    const reservedAttributes = [
        forAttribute,
        ifAttribute,
        innerHtmlAttribute,
        textContentAttribute
    ];

    window.sdb = {};
    window.sdb.init = function(config) {
        const defaults = {
            element: document.body,
            scope: window,
            cancellationToken: new Promise(() => {})
        };

        config = { ...defaults, ...config };

        handle(config.element, config.scope, config.cancellationToken);
    }

    function handle(parentElement, scope, cancellationToken) {
        let elements = [parentElement];

        while (elements.length > 0) {
            const currentElement = elements.pop();
            if (currentElement.hasAttribute(forAttribute)) {
                repeatHandler(currentElement, forAttribute, scope, cancellationToken);
                continue;
            }

            currentElement
                .getAttributeNames()
                .filter(attribute => /^\[.+\]$/.test(attribute))
                .filter(attribute => reservedAttributes.indexOf(attribute) === -1)
                .forEach(attribute => attributeHandler(currentElement, attribute, scope, cancellationToken));

            if (currentElement.hasAttribute(ifAttribute)) {
                ifHandler(currentElement, ifAttribute, scope, cancellationToken);
            }

            if (currentElement.hasAttribute(textContentAttribute)) {
                textContentHandler(currentElement, textContentAttribute, scope, cancellationToken);
                continue;
            }

            if (currentElement.hasAttribute(innerHtmlAttribute)) {
                innerHtmlHandler(currentElement, innerHtmlAttribute, scope, cancellationToken);
                continue;
            }

            elements = elements.concat([...currentElement.childNodes].filter(element => element.nodeType === 1));
        }
    }

    function attributeHandler(element, attribute, scope, parentCancellationToken) {
        const baseAttribute = attribute.slice(1, -1);
        const nodeString = element.getAttribute(attribute);
        const nodes = getNodes(nodeString);
        resolveValue(scope, nodes, parentCancellationToken, value => element.setAttribute(baseAttribute, value));
    }

    function textContentHandler(element, attribute, scope, parentCancellationToken) {
        const nodeString = element.getAttribute(attribute);
        const nodes = getNodes(nodeString);
        resolveValue(scope, nodes, parentCancellationToken, value => setTextContent(element, value));
    }

    function innerHtmlHandler(element, attribute, scope, parentCancellationToken) {
        const nodeString = element.getAttribute(attribute);
        const nodes = getNodes(nodeString);
        resolveValue(scope, nodes, parentCancellationToken, (value, valueCancellationToken) => {
            const childCancellationToken = new DeferredPromise();
            element.innerHTML = value;
            element.removeAttribute(attribute);
            handle(element, scope, childCancellationToken.promise);

            valueCancellationToken.then(() => childCancellationToken.resolve());
        });
    }

    function repeatHandler(element, attribute, scope, parentCancellationToken) {
        const bindFor = element.getAttribute(attribute);
        const match = /(.+)\sin\s(.+)/.exec(bindFor);
        const scopeVar = match[1];
        const nodes = match[2].split(".");

        const originalDisplay = element.style.display;
        element.style.display = "none";
        resolveValue(scope, nodes, parentCancellationToken, (values, valueCancellationToken) => {
            const childCancellationToken = new DeferredPromise();
            const children = values.map(value => {
                const newElement = element.cloneNode(true);
                newElement.removeAttribute(attribute);
                newElement.style.display = originalDisplay;
                element.parentNode.insertBefore(newElement, element);
                const newScope = { ...scope };
                newScope[scopeVar] = value;
                handle(newElement, newScope, childCancellationToken.promise);
                return newElement;
            });

            valueCancellationToken.then(() => {
                childCancellationToken.resolve();
                children.forEach(child => child.remove());
            });
        });
    }

    function ifHandler(element, attribute, scope, parentCancellationToken) {
        const nodeString = element.getAttribute(attribute);
        const nodes = getNodes(nodeString);
        resolveValue(scope, nodes, parentCancellationToken, value => {
            if (value === false) {
                element.style.display = "none";
            }
        });
    }

    function getNodes(nodeString) {
        return nodeString.split(".");
    }

    function resolveValue(currentValue, nodes, parentCancellationToken, callback) {
        if (currentValue === null || currentValue === undefined) {
            callback(currentValue, parentCancellationToken);
            return;
        }
        
        if (typeof(currentValue.then) === "function") {
            const isCancelled = false;
            currentValue.then(nextValue => {
                if (!isCancelled) {
                    resolveValue(nextValue, nodes, parentCancellationToken, callback);
                }
            });

            parentCancellationToken.then(() => isCancelled = true);
            return;
        }
        
        if (typeof(currentValue.subscribe) === "function") {
            let childCancellationToken = new DeferredPromise();
            const subscription = currentValue.subscribe(nextValue => {
                childCancellationToken.resolve();
                childCancellationToken = new DeferredPromise();
                resolveValue(nextValue, nodes, childCancellationToken.promise, callback);
            });

            parentCancellationToken.then(() => {
                subscription.unsubscribe();
                childCancellationToken.resolve();
            });
            return;
        }

        if (nodes.length === 0) {
            callback(currentValue, parentCancellationToken);
            return;
        }
        
        nodes = [...nodes];
        const currentNode = nodes.shift();
        const nextValue = currentValue[currentNode];
        resolveValue(nextValue, nodes, parentCancellationToken, callback);
    }

    function setTextContent(element, value) {
        element.textContent = value === Object(value) ? JSON.stringify(value) : value;
    }
})();