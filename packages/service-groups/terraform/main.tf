resource "docker_container" "service-groups" {
  name  = "service-groups-${var.env}"
  image = "docker-registry.kabala.tech/gtms/servicegroups:${var.tag}"
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
    "APP_DOMAIN=${var.app_domain}",
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "PORT=80",
    "INTERNAL_GATEKEEPER=http://service-gatekeeper-internal-${var.env}/v1",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
