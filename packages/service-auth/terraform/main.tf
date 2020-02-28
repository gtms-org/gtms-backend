resource "docker_container" "service-auth-${var.env}" {
  name  = "service-auth-${var.env}"
  image = "docker-registry.kabala.tech/gtms/openweather:${var.tag}"
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
    "DB_HOST=service-auth-${var.env}-db"
  ]
}

resource "docker_container" "service-auth-${var.env}-db" {
  name  = "service-auth-${var.env}-db"
  image = "mongo:4"
  restart = "always"

  networks_advanced {
      name = "kabala-net"
  }

  volumes {
    host_path      = "${var.mount_point}/${var.env}/service-auth-db"
    container_path = "/data/db"
  }
}