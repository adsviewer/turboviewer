locals {
  error_metric_name = "${var.environment}-apprunner-error-metric"
  error_namespace   = "${var.environment}-error-namespace"
  alarm_name        = "${var.environment}-apprunner-error-alarm"
}

resource "aws_apprunner_service" "server" {
  service_name = "${var.environment}-${var.service_name}"

  instance_configuration {
    cpu               = 1024
    memory            = 4096
    instance_role_arn = aws_iam_role.instance_role.arn
  }
  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.ecr_access_role.arn
    }
    image_repository {
      image_configuration {
        runtime_environment_secrets   = var.mapped_secrets
        runtime_environment_variables = merge(var.environment_variables, { MODE = var.environment })
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

data "aws_iam_policy_document" "app_runner_error_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${var.environment}-${var.service_name}/*"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = ["arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${local.alarm_name}"]
    }
  }
}
resource "aws_sns_topic" "app_runner_error_topic" {
  name   = "${var.environment}-${var.service_name}-error-topic"
  policy = data.aws_iam_policy_document.app_runner_error_policy_document.json
}

resource "aws_cloudwatch_log_metric_filter" "app_runner_error_filter" {
  name           = "${var.environment}-apprunner-error-filter"
  pattern        = "{ $.level = 50 }"
  log_group_name = "/aws/apprunner/prod-server/${aws_apprunner_service.server.service_id}/application"

  metric_transformation {
    name      = local.error_metric_name
    namespace = local.error_namespace
    value     = "1"
    unit      = "Count"
  }
}
resource "aws_cloudwatch_metric_alarm" "app_runner_error_alarm" {
  alarm_name          = local.alarm_name
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = local.error_metric_name
  namespace           = local.error_namespace
  period              = 60
  statistic           = "SampleCount"
  threshold           = 1
  alarm_description   = "Alarm when the App Runner service instance has errors"
  alarm_actions       = [aws_sns_topic.app_runner_error_topic.arn]
}
