resource "aws_apprunner_service" "server" {
  service_name = "${var.environment}-${var.service_name}"

  health_check_configuration {
    path     = "/graphql"
    protocol = "HTTP"
  }
  instance_configuration {
    cpu               = 256
    memory            = 512
    instance_role_arn = aws_iam_role.instance_role.arn
  }
  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.ecr_access_role.arn
    }
    image_repository {
      image_configuration {
        runtime_environment_secrets   = var.mapped_secrets
        runtime_environment_variables = var.environment_variables
        port                          = var.environment_variables.PORT
      }
      image_identifier      = "${aws_ecr_repository.ecr_repo.repository_url}:amd-latest"
      image_repository_type = "ECR"
    }
    auto_deployments_enabled = true
  }
}

resource "aws_apprunner_custom_domain_association" "server_domain_association" {
  domain_name = "${var.domain_prefix}.${var.domain_name}"
  service_arn = aws_apprunner_service.server.arn
}

data "aws_apprunner_hosted_zone_id" "this" {}

resource "aws_route53_record" "server_record" {
  for_each = toset(["A", "AAAA"])
  zone_id  = var.domain_zone_id
  name     = "${var.domain_prefix}.${var.domain_name}"
  type     = each.key

  alias {
    name                   = aws_apprunner_custom_domain_association.server_domain_association.dns_target
    zone_id                = data.aws_apprunner_hosted_zone_id.this.id
    evaluate_target_health = true
  }
}
