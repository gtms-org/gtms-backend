resource "docker_container" "service-auth" {
  name  = "service-auth-${var.env}"
  image = "docker-registry.kabala.tech/gtms/serviceauth:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "kabala-net"
  }

  labels {
    label = "traefik.enable"
    value = "false"
  }

  env = [
    "JWT_SECRET=${var.jwt_secret}",
    "JWT_REFRESH_TOKEN_SECRET=${var.jwt_refresh_token_secret}",
    "APP_DOMAIN=${var.app_domain}",
    "QUEUE_HOST=${var.queue_host}",
    "DB_HOST=mongo-${var.env}-db",
    "DB_NAME=${var.db_name}",
    "USER_PROFILE_SERVICE=missing-for-now",
    "VERSION=${var.tag}",
    "APP_KEY=${var.APP_KEY}",
    "PORT=80",
    "INTERNAL_GATEKEEPER=http://service-gatekeeper-internal-${var.env}/v1"
  ]
}