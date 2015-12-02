var Promise = require('when').Promise;
var passError = require('passerror');
var Container = require('./Container');

module.exports = function createContainer (dockerConfig, spec) {
    return new Promise(function (resolve, reject) {
        var container = new Container(spec);
        container.setDockerConfig(dockerConfig);

        container
            .on('ready', function () {
                resolve(container);
            });

        container.init(passError(function (err) {
            reject(err);
        }, function () {}));
    });
};
