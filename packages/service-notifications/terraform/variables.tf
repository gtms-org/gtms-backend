variable "env" {}

variable "tag" {}

variable "queue_host" {}

variable "mount_point" {}

variable "docker_host" {}

variable "DOCKER_REGISTRY" {
    default = "docker-registry.kabala.tech"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}

variable "app_domain" {}

variable "db_name" {}
