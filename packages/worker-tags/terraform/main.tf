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

  env = [
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "VERSION=${var.tag}",
    "PORT=80",
  ]
}
