variable "env" {}

variable "tag" {}

variable "jwt_secret" {}

variable "jwt_refresh_token_secret" {}

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

variable "instances" {
    default = 1
}

variable "GOOGLE_CLIENT_ID" {}

variable "GOOGLE_CLIENT_SECRET" {}

variable "GOOGLE_REDIRECT_URL" {}
