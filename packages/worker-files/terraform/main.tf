resource "docker_container" "worker-files" {
  name  = "worker-files-${var.env}"
  image = "docker-registry.kabala.tech/gtms/workerfiles:${var.tag}"
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
    "VERSION=${var.tag}",
    "PORT=80",
    "BUCKET_GROUP_LOGO=${var.BUCKET_GROUP_LOGO}",
    "BUCKET_GROUP_BG=${var.BUCKET_GROUP_BG}",
    "BUCKET_AVATAR=${var.BUCKET_AVATAR}",
    "BUCKET_USER_GALLERY=${var.BUCKET_USER_GALLERY}",
    "BUCKET_GROUP_TAG_LOGO=${var.BUCKET_GROUP_TAG_LOGO}",
    "AWS_ACCESS_KEY_ID=${var.AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY=${var.AWS_SECRET_ACCESS_KEY}",
    "AWS_REGION=${var.AWS_REGION}",
    "AWS_ENDPOINT=${var.AWS_ENDPOINT}",
  ]
}
