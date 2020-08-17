resource "docker_container" "service-iframely" {
  count = var.instances
  name  = "service-iframely-${var.env}-${count.index}"
  image = "docker-registry.kabala.tech/gtms/serviceiframely:${var.tag}"
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
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
