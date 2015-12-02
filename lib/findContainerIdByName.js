var Docker = require('dockerode');
var passError = require('passerror');

module.exports = function findContainerIdByName (dockerOptions, name, cb) {
    var docker = new Docker(dockerOptions);

    docker.listContainers({ all: 1 }, passError(cb, function (containers) {
        var matching = containers.filter(function (container) {
            return container.Names && container.Names[0] && container.Names[0] === '/' + name;
        });

        if (matching.length === 1) {
            return cb(null, matching[0].Id);
        } else {
            return cb(new Error('No such container.'));
        }
    }));
};
