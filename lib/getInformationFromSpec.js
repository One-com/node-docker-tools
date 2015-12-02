module.exports = function getInformationFromSpec (spec, dockerConfig, data) {
    var result = {};

    if (spec.docker) {
        spec = spec.docker;
    }

    var portKey = '' + spec.port + '/tcp';

    if (dockerConfig.host) {
        result.ip = dockerConfig.host;
    } else {
        result.ip = data.NetworkSettings.Ports[portKey][0].HostIp;
    }

    result.port = data.NetworkSettings.Ports[portKey][0].HostPort;

    if (spec.env) {
        for (var prop in spec.env) {
            if (spec.env.hasOwnProperty(prop)) {
                result[prop] = spec.env[prop];
            }
        }
    }

    return result;
};
