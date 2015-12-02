# docker tools for node.js

This module contains different tools for working with docker containers from
node.js. It is still in its early phase, so the API will most likely change some
until the first major version is cut.

The module is currently in development, and was extracted from another project.
It's API will probably change a bit to be more inline with that of the Docker
Remote API, as dockerode also attempts.

# DockerContainer

This module provides a higher level model for Docker containers in Node.js. It
is a wrapper around the
[Docker Remote API](http://docs.docker.com/engine/reference/api/docker_remote_api_v1.21/)
which it uses [dockerode](https://github.com/apocas/dockerode) to interface
with.
