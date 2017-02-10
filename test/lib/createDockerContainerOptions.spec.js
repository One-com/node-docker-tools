var expect = require('unexpected');
var createDockerContainerOptions = require('../../lib/createDockerContainerOptions');

describe('lib/createDockerContainerOptions', function () {
    it('should convert an example of redis with exposed port', function () {
        return expect(createDockerContainerOptions({
            image: 'redis',
            port: 5432
        }), 'to equal', {
            Image: 'redis',
            ExposedPorts: {
                '5432/tcp': {}
            },
            HostConfig: { PublishAllPorts: true }
        });
    });

    it("should map 'hostPort' to PortBindings", function () {
        return expect(createDockerContainerOptions({
            image: 'redis',
            port: 5432,
            hostPort: 54321
        }), 'to equal', {
            Image: 'redis',
            ExposedPorts: {
                '5432/tcp': {}
            },
            HostConfig: {
                PublishAllPorts: true,
                PortBindings: {
                    '5432/tcp': [{
                        HostPort: '54321'
                    }]
                }
            }
        });
    });

    it("should not map 'hostPort' to PortBindings of 'port' has not been configured", function () {
        return expect(createDockerContainerOptions({
            image: 'redis',
            hostPort: 54321
        }), 'to equal', {
            Image: 'redis',
            ExposedPorts: undefined,
            HostConfig: {
                PublishAllPorts: true,
                PortBindings: undefined
            }
        });
    });
});
