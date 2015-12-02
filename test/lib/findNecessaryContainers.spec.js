var expect = require('unexpected');
var findNecessaryContainers = require('../../lib/findNecessaryContainers');

describe('lib/findNecessaryContainers', function () {
    it('should find a redis container', function () {
        var config = {
            docker: {
                namePrefix: 'test',
                enabled: true,
                options: {
                    socketPath: '/var/run/docker.sock'
                }
            },
            redis: {
                docker: {
                    image: 'redis',
                    port: 6379
                },
                url: 'redis://{docker_host}:{docker_port}'
            }
        };
        return expect(findNecessaryContainers(config), 'to equal', [
            {
                name: 'test_redis',
                docker: {
                    image: 'redis',
                    port: 6379
                },
                key: 'redis',
                value: {
                    url: 'redis://{docker_host}:{docker_port}'
                }
            }
        ]);
    });
});
