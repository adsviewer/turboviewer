resource "aws_apprunner_service" "server" {
  service_name = "${var.environment}-${var.service_name}"

  health_check_configuration {
    healthy_threshold   = 1
    interval            = 1
    path                = "/graphql"
    protocol            = "HTTP"
    timeout             = 1
    unhealthy_threshold = 1
  }
  instance_configuration {
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
        port                          = "80"
      }
      image_identifier      = "${aws_ecr_repository.ecr_repo.repository_url}:latest"
      image_repository_type = "ECR"
    }
    auto_deployments_enabled = true
  }
}
