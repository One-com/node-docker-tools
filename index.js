module.exports = {
    get resolveConfigurationAndStartContainers () {
        return require('./lib/resolveConfigurationAndStartContainers');
    },
    get DockerContainer () {
        return require('./lib/Container')
    }
};
