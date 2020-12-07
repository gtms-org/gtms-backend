variable "env" {}

variable "tag" {}

variable "docker_host" {}

variable "DOCKER_REGISTRY" {
    default = "docker-registry.kabala.tech"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}

variable "instances" {
    default = 1
}
