function isObjectAndHasDockerProperty (subject) {
    if (!subject || typeof subject !== 'object') {
        return false;
    }
    if (!subject.docker || typeof subject.docker !== 'object') {
        return false;
    }

    return true;
}

function filteredClone(obj, filter) {
    var newObj = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && filter(prop)) {
            newObj[prop] = obj[prop];
        }
    }
    return newObj;
}

module.exports = function findNecessaryContainers(config) {
    var dockerEnabled = config.docker && config.docker.enabled;

    if (!dockerEnabled) {
        return [];
    }

    var namePrefix = config.docker.namePrefix + '_' || '';

    var configKeys = Object.keys(config);
    var dockerKeys = configKeys.filter(function (key) {
        return isObjectAndHasDockerProperty(config[key]);
    });

    var result = [];

    dockerKeys.forEach(function (key) {
        var containerSpec = {};
        containerSpec.docker = config[key].docker;
        containerSpec.docker.name = namePrefix + key;
        containerSpec.key = key;
        containerSpec.name = namePrefix + key;
        containerSpec.value = filteredClone(config[key], function (prop) {
            return prop !== 'docker';
        });
        result.push(containerSpec);
    });

    return result;
};
