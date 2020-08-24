resource "docker_container" "service-comments" {
  name  = "service-comments-${var.env}"
  image = "${var.DOCKER_REGISTRY}/gtms/servicecomments:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  labels {
    label = "gtms"
    value = "qa-master"
  }

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
