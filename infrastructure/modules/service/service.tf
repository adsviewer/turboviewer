locals {
  name         = "${var.environment}-${var.service_name}"
  service_port = 4000
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_ecr_repository" "ecr_repo" {
  name                 = local.name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_cloudwatch_log_group" "service_log_group" {
  name              = "/ecs/${var.environment}/${var.service_name}"
  retention_in_days = var.environment == "prod" ? 0 : 180
}
