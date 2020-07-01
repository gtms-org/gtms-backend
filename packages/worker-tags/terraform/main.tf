resource "docker_container" "worker-tags" {
  name  = "worker-tags-${var.env}"
  image = "docker-registry.kabala.tech/gtms/workertags:${var.tag}"
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
    "INTERNAL_GATEKEEPER=http://service-gatekeeper-internal-${var.env}/v1",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
