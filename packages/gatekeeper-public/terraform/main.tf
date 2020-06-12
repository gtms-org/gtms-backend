resource "docker_container" "gatekeeper-public" {
  name  = "gatekeeper-public-${var.env}"
  image = "docker-registry.kabala.tech/gtms/gatekeeperpublic:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "true"
  }

  labels {
    label = "traefik.backend"
    value = "gatekeeper-public-${var.env}"
  }

  labels {
    label = "traefik.frontend.rule"
    value = "PathPrefixStrip:/api;Host:${var.app_domain}"
  }

  labels {
    label = "traefik.protocol"
    value = "http"
  }

  labels {
    label = "traefik.port"
    value = "80"
  }

  dns = [
    "172.18.0.100"
  ]

  env = [
    "RUN_ENV=${var.env}",
    "JWT_SECRET=${var.jwt_secret}",
    "VERSION=${var.tag}",
    "AUTH_SERVICE_URL=auth.service.consul",
    "GROUPS_SERVICE_URL=groups.service.consul",
    "TAGS_SERVICE_URL=tags.service.consul",
    "FILES_SERVICE_URL=files.service.consul",
    "POSTS_SERVICE_URL=posts.service.consul",
    "COMMENTS_SERVICE_URL=comments.service.consul",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
