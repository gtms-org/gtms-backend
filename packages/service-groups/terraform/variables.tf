variable "env" {}

variable "tag" {}

variable "app_domain" {}

variable "queue_host" {}

variable "docker_host" {}

variable "DOCKER_REGISTRY" {
    default = "docker-registry.kabala.tech"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}

variable "db_name" {}
