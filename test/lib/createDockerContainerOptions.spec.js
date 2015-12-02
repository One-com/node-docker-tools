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
});
