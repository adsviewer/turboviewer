locals {
  channel_ingress_name-no-env = "channel-ingress"
  channel_ingress_name        = "${var.environment}-${local.channel_ingress_name-no-env}"
  channel_ingress_alarm_name  = "${local.channel_ingress_name}-error-alarm"
}

resource "aws_ecr_repository" "channel_ingress_ecr_repo" {
  name                 = local.channel_ingress_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

data "aws_iam_policy_document" "github_operating" {
  statement {
    actions = [
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    effect = "Allow"
    resources = [
      aws_ecr_repository.channel_ingress_ecr_repo.arn, aws_ecr_repository.channel_report_process_ecr_repo.arn,
      aws_ecr_repository.channel_report_check_ecr_repo.arn
    ]
  }
  statement {
    actions = [
      "lambda:UpdateFunctionCode"
    ]
    effect = "Allow"
    resources = [
      aws_lambda_function.channel_ingress_lambda.arn, aws_lambda_function.channel_report_check_lambda.arn
    ]
  }
}

resource "aws_iam_policy" "ecr_policy" {
  name   = "${local.channel_ingress_name}-github-operating"
  policy = data.aws_iam_policy_document.github_operating.json
}

resource "aws_iam_role_policy_attachment" "github_operating" {
  role       = var.github_role_name
  policy_arn = aws_iam_policy.ecr_policy.arn
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "channel_ingress_role" {
  name               = local.channel_ingress_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_ingress_basic_policy_attachment" {
  role       = aws_iam_role.channel_ingress_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "channel_ingress_policy_document" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = module.environment_potentially_local.channel_report_arns
  }
}
resource "aws_iam_policy" "channel_ingress_policy" {
  name   = local.channel_ingress_name
  policy = data.aws_iam_policy_document.channel_ingress_policy_document.json
}
resource "aws_iam_role_policy_attachment" "channel_ingress_policy_attachment" {
  role       = aws_iam_role.channel_ingress_role.id
  policy_arn = aws_iam_policy.channel_ingress_policy.arn
}

resource "aws_lambda_function" "channel_ingress_lambda" {
  architectures = ["arm64"]
  description   = "Ingests channel data"
  environment {
    variables = merge({
      for k, v in local.common_secrets : k => v.value
      }, {
      for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
      }, {
      AWS_ACCOUNT_ID  = data.aws_caller_identity.current.account_id
      CHANNEL_SECRET  = aws_ssm_parameter.channel_secret.value
      DATABASE_URL    = aws_ssm_parameter.database_url.value
      DATABASE_RO_URL = aws_ssm_parameter.database_ro_url.value
      IS_LAMBDA       = true
      MODE            = var.environment
    })
  }
  function_name = local.channel_ingress_name
  image_config {
    command = ["apps/${local.channel_ingress_name-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.channel_ingress_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.channel_ingress_role.arn
  timeout      = 900

  lifecycle {
    ignore_changes = [image_uri]
  }
}

data "aws_iam_policy_document" "channel_ingress_error_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_ingress_name}-error-topic"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${local.channel_ingress_alarm_name}"
      ]
    }
  }
}
resource "aws_sns_topic" "channel_ingress_error_topic" {
  name   = "${local.channel_ingress_name}-error-topic"
  policy = data.aws_iam_policy_document.channel_ingress_error_policy_document.json
}

resource "aws_cloudwatch_log_metric_filter" "channel_ingress_lambda_log_error_filter" {
  name           = "${local.channel_ingress_name}-error-filter"
  pattern        = "{ $.level = 50 }"
  log_group_name = "/aws/lambda/${local.channel_ingress_name}"

  metric_transformation {
    name      = local.channel_ingress_name
    namespace = local.error_namespace
    value     = "1"
    unit      = "Count"
  }
}
resource "aws_cloudwatch_metric_alarm" "channel_ingress_lambda_error_alarm" {
  alarm_name          = local.channel_ingress_alarm_name
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = local.channel_ingress_name
  namespace           = local.error_namespace
  period              = 60
  statistic           = "SampleCount"
  threshold           = 1
  alarm_description   = "Alarm when the channel ingress lambda has errors"
  alarm_actions       = [aws_sns_topic.channel_ingress_error_topic.arn]
}
