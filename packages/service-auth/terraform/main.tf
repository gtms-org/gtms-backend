resource "docker_container" "service-auth" {
  count = var.instances
  name  = "service-auth-${var.env}-${count.index}"
  image = "${var.DOCKER_REGISTRY}/gtms/serviceauth:${var.tag}"
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
    "JWT_SECRET=${var.jwt_secret}",
    "JWT_REFRESH_TOKEN_SECRET=${var.jwt_refresh_token_secret}",
    "APP_DOMAIN=${var.app_domain}",
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "VERSION=${var.tag}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500",
    "GOOGLE_CLIENT_ID=${var.GOOGLE_CLIENT_ID}",
    "GOOGLE_CLIENT_SECRET=${var.GOOGLE_CLIENT_SECRET}",
    "GOOGLE_REDIRECT_URL=${var.GOOGLE_REDIRECT_URL}"
  ]
}
