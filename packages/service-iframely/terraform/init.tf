provider "docker" {
    host = "tcp://${var.docker_host}/"

    registry_auth {
    address = "rg.nl-ams.scw.cloud"
    username = "${var.DOCKER_REGISTRY_USERNAME}"
    password = "${var.DOCKER_REGISTRY_PASSWORD}"
  }
}

terraform {
  backend "s3" {
    bucket = "kabalatech-terraform"
    key    = "gtms-service-iframely.tfstate"
    region = "nl-ams"
    endpoint = "s3.nl-ams.scw.cloud"
    skip_credentials_validation = true
    skip_region_validation      = true
  }
}
