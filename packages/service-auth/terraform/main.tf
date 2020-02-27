resource "docker_container" "openweather" {
  name  = "openweather"
  image = "docker-registry.kabala.tech/home/openweather:${var.tag}"
  restart = "always"
  networks_advanced {
      name = "global"
  }
  env = [
      "SECRET=${APPLICATION_SECRET}",
      "REFRESH_TOKEN_SECRET=${APPLICATION_REFRESH_TOKEN_SECRET}",
      "APP_DOMAIN=${APP_DOMAIN}",
      "QUEUE_HOST=${QUEUE_HOST}",
      "APM_URL=${APM_URL}",
      "APM_TOKEN=${APM_TOKEN}",
      "USER_PROFILE_SERVICE=${USER_PROFILE_SERVICE}"
      
  ]
}
