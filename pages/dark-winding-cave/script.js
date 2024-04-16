class Throttle {
    constructor(duration) {
        this.duration = duration;
    }

    queue(callBack) {
        this.pendingCallback = callBack;
        if (!this.timeout) {
            this.pendingCallback();
            delete this.pendingCallback;
            this.timeout = window.setTimeout(() => this.handleTimeout(), this.duration);
        }
    }

    handleTimeout() {
        delete this.timeout;
        if (this.pendingCallback) {
            this.pendingCallback();
            delete this.pendingCallback;
        }
    }
}

class CenterFollowsMouse {
    constructor(element) {
        this.element = element;
    }

    follow(event) {
        this.element.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    }
}

class BlackBackgroundAfterDelay {
    constructor (element, options) {
        const defaults = {
            delay: 1000
        };

        this.options = {...defaults, ...options};
        this.element = element;
        this.element.style.background = "black";
    }

    update() {
        this.element.style.background = null;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.element.style.background = "black"
        }, this.options.delay);
    }
}

class GrowThenShrink {
    constructor(element, options) {
        const defaults = {
            shrinkDelay: 1000,
            shrinkDuration: 1000,
            growDuration: 1000
        };

        this.element = element;
        this.options = {...defaults, ...options};
        this.timeouts = [];

        //element.style.background = "black";
    }

    grow() {
        //this.element.style.background = null;
        this.element.style.transitionDuration = `${this.options.growDuration}ms`;
        this.element.style.transform = "scale(4)";
        this.timeouts.forEach(clearTimeout);
        this.timeouts = [];
        this.timeouts.push(setTimeout(() => this.shrink(), this.options.shrinkDelay));
    }

    shrink() {
        this.element.style.transitionDuration = `${this.options.shrinkDuration}ms`;
        this.element.style.transform = "scale(1)";
        this.timeouts.push(setTimeout(() => this.hide(), this.options.shrinkDuration));
    }

    hide() {
        //this.element.style.transitionDuration = "0ms";
        //this.element.style.background = "black";
    }
}

class Mask {
    constructor(options) {
        const divTranslate = document.createElement("div");
        divTranslate.className = "mask-translate";

        const divScale = document.createElement("div");
        divScale.className = "mask-scale";

        const divGradient = document.createElement("div");
        divGradient.className = "mask-gradient";

        divScale.appendChild(divGradient);
        divTranslate.appendChild(divScale);
        document.body.appendChild(divTranslate);

        this.centerFollowsMouse = new CenterFollowsMouse(divTranslate);
        this.turnBlack = new BlackBackgroundAfterDelay(divTranslate, {delay: options.shrinkDuration});
        this.growThenShrink = new GrowThenShrink(divScale, options);
    }

    update(event) {
        this.centerFollowsMouse.follow(event);
        this.turnBlack.update(event);
        this.growThenShrink.grow(event);
    }
}

class TextShadows {
    constructor(nodes) {
        this.nodes = nodes;
        this.nodeRects = nodes.map(anchor => anchor.getBoundingClientRect());
    }

    update(event) {
        const mouseY = event.pageY;
        const mouseX = event.pageX;
        for (let i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            const rect = this.nodeRects[i];

            const offsetX = (rect.left - mouseX) + rect.width>>2;
            const offsetY = (rect.top - mouseY) + rect.height>>2;

            const shadowOffsetX = offsetX>>2;
            const shadowOffsetY = offsetY>>2;

            node.style.textShadow = `${shadowOffsetX}px ${shadowOffsetY}px 4px black`;
        };
    }

    onResize(event) {
        this.nodeRects = this.nodes.map(anchor => anchor.getBoundingClientRect())
    }
}

class Spooky {
    constructor() {
        const mouseMoveThrottle = new Throttle(30);
        const resizeThrottle = new Throttle(500);

        const mask = new Mask({
            growDuration: 500,
            shrinkDelay: 1000,
            shrinkDuration: 300000
        });

        const textShadows = new TextShadows([...document.querySelectorAll(".text-shadow")]);
    
        addEventListener("mousemove", event => {
            mouseMoveThrottle.queue(() => {
                mask.update(event);
                textShadows.update(event);
            });
        });
    
        addEventListener("resize", event => {
            resizeThrottle.queue(() => {
                textShadows.onResize(event);
            });
        });
    }
}