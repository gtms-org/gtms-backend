resource "docker_container" "service-iframely" {
  count = var.instances
  name  = "service-iframely-${var.env}-${count.index}"
  image = "rg.nl-ams.scw.cloud/gtms/serviceiframely:${var.tag}"
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
    "PORT=8061",
    "NODE_TLS_REJECT_UNAUTHORIZED=0",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
