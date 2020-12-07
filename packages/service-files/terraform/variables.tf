variable "env" {}

variable "tag" {}

variable "queue_host" {}

variable "docker_host" {}

variable "db_name" {}

variable "DOCKER_REGISTRY" {
    default = "docker-registry.kabala.tech"
}

variable "DOCKER_REGISTRY_PASSWORD" {}

variable "DOCKER_REGISTRY_USERNAME" {}

variable "AWS_ACCESS_KEY_ID" {}

variable "AWS_SECRET_ACCESS_KEY" {}

variable "AWS_REGION" {}

variable "S3_BUCKET" {}

variable "AWS_ENDPOINT" {}
