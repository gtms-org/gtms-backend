resource "docker_container" "service-files" {
  name  = "service-files-${var.env}"
  image = "${var.DOCKER_REGISTRY}/gtms/servicefiles:${var.tag}"
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
    "VERSION=${var.tag}",
    "PORT=80",
    "AWS_ACCESS_KEY_ID=${var.AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY=${var.AWS_SECRET_ACCESS_KEY}",
    "AWS_REGION=${var.AWS_REGION}",
    "S3_BUCKET=${var.S3_BUCKET}",
    "AWS_ENDPOINT=${var.AWS_ENDPOINT}",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
