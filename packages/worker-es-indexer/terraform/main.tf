resource "docker_container" "worker-es-indexer" {
  name  = "worker-es-indexer-${var.env}"
  image = "docker-registry.kabala.tech/gtms/workeresindexer:${var.tag}"
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
    "ES_HOST=192.168.0.33",
    "ES_PORT=9200",
    "VERSION=${var.tag}",
    "PORT=80",
    "CONSUL_HOST=consul-client",
    "CONSUL_PORT=8500"
  ]
}
