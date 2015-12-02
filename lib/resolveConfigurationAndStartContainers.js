var when = require('when');
var findNecessaryContainers = require('./findNecessaryContainers');
var createContainer = require('./createContainer');

function resolveConfigurationAndStartContainers (config, callback) {
    if (!config.docker || !config.docker.enabled) {
        return callback(null, config);
    }

    var containers = findNecessaryContainers(config);

    if (containers.length === 0) {
        return callback(null, config);
    }

    when.map(containers, function (containerSpec) {
        return createContainer(config.docker.options, containerSpec);
    }).then(function (containers) {
        containers.forEach(function (container) {
            var configKey = container.containerSpec.key;
            var newValue = container.containerSpec.value;

            for (var prop in newValue) {
                var value = newValue[prop];
                if (newValue.hasOwnProperty(prop) && typeof value === 'string') {
                    value = value.replace(/\{docker_port\}/g, container.info.port);
                    value = value.replace(/\{docker_host\}/g, container.info.ip);
                    newValue[prop] = value.replace(/\{docker_env:([a-zA-Z_]+)\}/g, function (match, key) {
                        return container.containerSpec.docker.env[key];
                    });
                }
            }

            config[configKey] = newValue;
        });
        callback(null, config);
    }, callback);
};

module.exports = resolveConfigurationAndStartContainers;
