var Docker = require('dockerode');
var passError = require('passerror');
var EventEmitter = require('events').EventEmitter;

var createDockerContainerOptions = require('./createDockerContainerOptions');
var getInformationFromSpec = require('./getInformationFromSpec');
var findContainerIdByName = require('./findContainerIdByName');

var states = {
    FRESH: 'FRESH',
    ERRORED: 'ERRORED',
    CREATING: 'CREATING',
    BOOTING: 'BOOTING',
    INSPECTING: 'INSPECTING',
    RUNNING: 'RUNNING',
    READY: 'READY',
    CLOSING: 'CLOSING',
    CLOSED: 'CLOSED',
    REMOVING: 'REMOVING',
    REMOVED: 'REMOVED'
};

module.exports = DockerContainer;

function DockerContainer(spec) {
    EventEmitter.call(this);
    this.state = states.FRESH;
    this.container = null;
    this.dockerConfig = {
        socketPath: '/var/run/docker.sock' // Default configuration
    };
    this.containerSpec = spec || null;
    this.info = {};

    this.on('running', this.onRunning.bind(this));
}

require('util').inherits(DockerContainer, EventEmitter);

DockerContainer.states = states;

DockerContainer.prototype.setDockerConfig = function (dockerConfig) {
    this.dockerConfig = dockerConfig;
};

DockerContainer.prototype.setState = function (state) {
    this.state = state;
    this.emit('statechange', state.toLowerCase());
    this.emit(state.toLowerCase());
};

DockerContainer.prototype.handleError = function (err) {
    var that = this;
    if (typeof err === 'function') {
        var callback = err;
        return function (err) {
            that.handleError(err);
            callback(err);
        };
    } else {
        this.setState(states.ERRORED);
        this.emit('error', err);
    }
};

DockerContainer.prototype.onRunning = function () {
    // default implementation of onRunning.
    // overwrite this in order to wait for a container to be ready.
    this.setState(states.READY);
};

DockerContainer.prototype.init = function (cb) {
    cb = cb || function () {};
    var handleError = this.handleError(cb);
    if (this.state !== states.FRESH) {
        return handleError(new Error('Cannot init a container that already was initted'));
    }
    if (!this.containerSpec) {
        return handleError(new Error('No container specification given.'));
    }

    var that = this;
    var docker = new Docker(this.dockerConfig);
    var dockerOpts = createDockerContainerOptions(this.containerSpec);

    var withImage = function (image, cb) {
        var normalizedName = image;
        if (!(/:/.test(image))) {
            normalizedName += ':latest';
        }
        docker.listImages(passError(handleError, function (images) {
            var repoTags = images.map(function (image) {
                return image.RepoTags;
            }).reduce(function (repoTags, next) {
                return repoTags.concat(next);
            }, []).filter(function (repoTag) {
                return repoTag !== '<none>:<none>';
            });
            var hasImage = repoTags.indexOf(normalizedName) !== -1;

            if (hasImage) {
                return cb();
            } else {
                docker.pull(normalizedName, passError(handleError, function (stream) {
                    console.log('pulling image', normalizedName);
                    docker.modem.followProgress(stream, function onFinished (err) {
                        cb(err);
                    });
                }));
            }
        }));
    };

    var createContainer = function (cb) {
        var image = that.containerSpec.image || that.containerSpec.docker.image;
        return withImage(image, passError(handleError, function () {
            return docker.createContainer(dockerOpts, passError(handleError, function (containerReference) {
                that.setState(states.BOOTING);
                that.container = containerReference;
                that.container.start(passError(handleError, function () {
                    that.setState(states.INSPECTING);
                    that.container.inspect(passError(handleError, function (data) {
                        that.info = getInformationFromSpec(that.containerSpec, that.dockerConfig, data);
                        that.setState(states.RUNNING);
                        cb();
                    }));
                }));
            }));
        }));
    };

    that.setState(states.CREATING);
    if (that.containerSpec.name) {
        findContainerIdByName(this.dockerConfig, that.containerSpec.name, function (err, id) {
            if (err) {
                if (err.message !== 'No such container.') {
                    // An error happened.
                    return handleError(err);
                } else {
                    // No container with that name existed.
                    createContainer(cb);
                }
            } else {
                // existing container
                that.container = docker.getContainer(id);
                that.setState(states.INSPECTING);
                that.container.inspect(passError(handleError, function (data) {
                    if (data.State.Running) {
                        that.info = getInformationFromSpec(that.containerSpec, that.dockerConfig, data);
                        that.setState(states.RUNNING);
                        cb();
                    } else {
                        that.container.start(passError(handleError, function () {
                            that.container.inspect(passError(handleError, function (data) {
                                that.info = getInformationFromSpec(that.containerSpec, that.dockerConfig, data);
                                that.setState(states.RUNNING);
                                cb();
                            }));
                        }));
                    }
                }));
            }
        });
    } else {
        createContainer(cb);
    }
};

DockerContainer.prototype.shutdown = function (cb) {
    cb = cb || function () {};
    var handleError = this.handleError(cb);
    var that = this;
    if (this.state === states.READY) {
        this.setState(states.CLOSING);
        return this.container.stop(passError(handleError, function () {
            that.setState(states.CLOSED);
            return cb();
        }));
    } else if (this.state === states.CLOSED || this.state === states.ERRORED) {
        return cb();
    } else {
        return handleError(new Error('Cannot shutdown before container is ready.'));
    }
};

DockerContainer.prototype.remove = function (cb) {
    cb = cb || function () {};
    var handleError = this.handleError(cb);
    var that = this;
    if (this.state === states.CLOSED || this.state === states.ERRORED) {
        this.setState(states.REMOVING);
        return this.container.remove(passError(handleError, function () {
            that.setState(states.REMOVED);
            return cb();
        }));
    } else if (this.state === states.REMOVED) {
        return cb();
    } else {
        return handleError(new Error('Cannot remove container until it is closed.'));
    }
};
