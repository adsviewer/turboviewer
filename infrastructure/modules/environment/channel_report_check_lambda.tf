locals {
  channel_report_check_name-no-env = "channel-report-check"
  channel_report_check_name        = "${var.environment}-${local.channel_report_check_name-no-env}"
  channel_report_check_alarm_name  = "${local.channel_report_check_name}-error-alarm"
}

resource "aws_ecr_repository" "channel_report_check_ecr_repo" {
  name                 = local.channel_report_check_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "channel_report_check_role" {
  name               = local.channel_report_check_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_report_check_basic_policy_attachment" {
  role       = aws_iam_role.channel_report_check_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "channel_report_check_policy_document" {
  statement {
    actions = ["batch:SubmitJob"]
    resources = [
      aws_batch_job_queue.channel_report_process.arn,
      "arn:aws:batch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:job-definition/${local.channel_process_report}:*",
    ]
  }
}
resource "aws_iam_policy" "channel_report_check_policy" {
  name   = local.channel_report_check_name
  policy = data.aws_iam_policy_document.channel_report_check_policy_document.json
}
resource "aws_iam_role_policy_attachment" "channel_report_check_policy_attachment" {
  role       = aws_iam_role.channel_report_check_role.id
  policy_arn = aws_iam_policy.channel_report_check_policy.arn
}

resource "aws_lambda_function" "channel_report_check_lambda" {
  architectures = ["arm64"]
  description   = "Ingests channel data"
  environment {
    variables = merge({
      for k, v in local.common_secrets : k => v.value
      }, {
      for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
      }, {
      AWS_ACCOUNT_ID                        = data.aws_caller_identity.current.account_id
      CHANNEL_PROCESS_REPORT_JOB_DEFINITION = aws_batch_job_definition.channel_report_process.arn
      CHANNEL_PROCESS_REPORT_JOB_QUEUE      = aws_batch_job_queue.channel_report_process.arn
      CHANNEL_SECRET                        = aws_ssm_parameter.channel_secret.value
      DATABASE_URL                          = aws_ssm_parameter.database_url.value
      DATABASE_RO_URL                       = aws_ssm_parameter.database_ro_url.value
      IS_LAMBDA                             = true
      MODE                                  = var.environment
    })
  }
  function_name = local.channel_report_check_name
  image_config {
    command = ["apps/${local.channel_report_check_name-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.channel_report_check_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.channel_report_check_role.arn
  timeout      = 900

  lifecycle {
    ignore_changes = [image_uri]
  }
}

resource "aws_cloudwatch_event_rule" "channel_data_report" {
  description         = "Fires to trigger a channel report check."
  name                = "channel-data-report"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "trigger_channel_report_check" {
  rule      = aws_cloudwatch_event_rule.channel_data_report.name
  target_id = "check_foo"
  arn       = aws_lambda_function.channel_report_check_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_channel_report_check" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.channel_report_check_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.channel_data_report.arn
}

data "aws_iam_policy_document" "channel_report_check_error_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_report_check_name}-error-topic"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${local.channel_report_check_alarm_name}"
      ]
    }
  }
}
resource "aws_sns_topic" "channel_report_check_error_topic" {
  name   = "${local.channel_report_check_name}-error-topic"
  policy = data.aws_iam_policy_document.channel_report_check_error_policy_document.json
}

resource "aws_cloudwatch_log_metric_filter" "channel_report_check_lambda_log_error_filter" {
  name           = "${local.channel_report_check_name}-error-filter"
  pattern        = "{ $.level = 50 }"
  log_group_name = "/aws/lambda/${local.channel_report_check_name}"

  metric_transformation {
    name      = local.channel_report_check_name
    namespace = local.error_namespace
    value     = "1"
    unit      = "Count"
  }
  depends_on = [aws_lambda_function.channel_report_check_lambda]
}
resource "aws_cloudwatch_metric_alarm" "channel_report_check_lambda_error_alarm" {
  alarm_name          = local.channel_report_check_alarm_name
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = local.channel_report_check_name
  namespace           = local.error_namespace
  period              = 60
  statistic           = "SampleCount"
  threshold           = 1
  alarm_description   = "Alarm when the channel report check lambda has errors"
  alarm_actions       = [aws_sns_topic.channel_report_check_error_topic.arn]
}
