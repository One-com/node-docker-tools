var expect = require('unexpected');
var DockerContainer = require('../../lib/Container');
var Docker = require('dockerode');

describe('Container', function () {
    var container;
    afterEach(function (cb) {
        if (container && container.state !== 'FRESH' && container.container) {
            return container.shutdown(function () {
                container.remove(function () {
                    container = null;
                    cb();
                });
            });
        }
        container = null;
        return cb();
    });
    it('should have state FRESH', function () {
        container = new DockerContainer();
        return expect(container.state, 'to equal', DockerContainer.states.FRESH);
    });
    it('should be able to launch a redis container', function () {
        container = new DockerContainer({
            image: 'redis',
            port: 5432
        });
        var init = container.init.bind(container);
        return expect(init, 'to call the callback without error');
    });
    it('should be able to launch a redis container and then expose methods of reaching it', function () {
        container = new DockerContainer({
            docker: {
                image: 'redis',
                port: 5432
            }
        });
        var init = container.init.bind(container);
        return expect(init, 'to call the callback without error').then(function () {
            return expect(container.info, 'to satisfy', {
                ip: '0.0.0.0',
                port: /^[0-9]{5}$/
            });
        });
    });
    it('should create a container with a specified name', function () {
        container = new DockerContainer({
            docker: {
                image: 'redis',
                name: 'test_redis',
                port: 5432
            }
        });
        var init = container.init.bind(container);
        return expect(init, 'to call the callback without error').then(function () {
            var docker = new Docker();
            var list = docker.listContainers.bind(docker);
            return expect(list, 'to call the callback without error').spread(function (containers) {
                var matching = containers.filter(function (container) {
                    return container.Names[0] === '/test_redis';
                });

                return expect(matching, 'to have length', 1).then(function () {
                    return expect(matching[0], 'to satisfy', {
                        Names: [ '/test_redis' ],
                        Image: 'redis'
                    });
                });
            });
        });
    });
    it('should reuse a container with a specified name', function () {
        container = new DockerContainer({
            image: 'redis',
            name: 'test_redis',
            port: 5432
        });
        var init = container.init.bind(container);
        return expect(init, 'to call the callback without error').then(function () {
            // start a new container (intentionally leaving the old one living).
            container = new DockerContainer({
                image: 'redis',
                name: 'test_redis',
                port: 5432
            });
            var init = container.init.bind(container);
            return expect(init, 'to call the callback without error').then(function () {
                var docker = new Docker();
                var list = docker.listContainers.bind(docker);
                return expect(list, 'to call the callback without error').spread(function (containers) {
                    var matching = containers.filter(function (container) {
                        return container.Names[0] === '/test_redis';
                    });

                    return expect(matching, 'to have length', 1).then(function () {
                        return expect(matching[0], 'to satisfy', {
                            Names: [ '/test_redis' ],
                            Image: 'redis'
                        });
                    });
                });
            });
        });
    });
});
