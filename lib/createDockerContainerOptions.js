module.exports = function createDockerContainerOptions (spec) {
    var options = {};

    if (spec.docker) {
        spec = spec.docker;
    }

    if (spec.image) {
        options['Image'] = spec.image;
    }
    if (spec.env && typeof spec.env === 'object') {
        options['Env'] = [];
        Object.keys(spec.env).forEach(function (key) {
            options['Env'].push(key + '=' + spec.env[key]);
        });
    }
    if (spec.port) {
        options['ExposedPorts'] = {};
        if (typeof spec.port === 'number') {
            options['ExposedPorts']['' + spec.port + '/tcp'] = {};
        }
    }

    if (spec.name) {
        options['name'] = spec.name;
    }

    options['HostConfig'] = { PublishAllPorts: true };

    if (spec.hostPort && spec.port) {
        options['HostConfig']['PortBindings'] = {};
        if (typeof spec.hostPort === 'number') {
            options['HostConfig']['PortBindings']['' + spec.port + '/tcp'] = [{
                'HostPort': '' + spec.hostPort
            }];
        }
    }

    return options;
};
