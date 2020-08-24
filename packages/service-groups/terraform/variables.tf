variable "env" {}

variable "tag" {}

variable "app_domain" {}

variable "queue_host" {}

variable "mount_point" {}

variable "docker_host" {}

variable "DOCKER_REGISTRY" {
    default = "rg.nl-ams.scw.cloud"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}

variable "db_name" {}
