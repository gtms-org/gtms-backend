resource "docker_container" "worker-groups" {
  name  = "worker-groups-${var.env}"
  image = "docker-registry.kabala.tech/gtms/workergroups:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80",
  ]
}
