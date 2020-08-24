variable "env" {}

variable "tag" {}

variable "jwt_secret" {}

variable "app_domain" {}

variable "docker_host" {}

variable "DOCKER_REGISTRY" {
    default = "rg.nl-ams.scw.cloud"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}
