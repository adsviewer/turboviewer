locals {
  lambda_names = [local.cache_refresh_name, local.channel_process_report, local.channel_ingress_name]
}

data "aws_iam_policy_document" "lambda_error_policy_document" {
  for_each = toset(local.lambda_names)
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${each.key}-error-topic"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${each.key}-error-alarm"
      ]
    }
  }
}

resource "aws_sns_topic" "lambda_error_topics" {
  for_each = toset(local.lambda_names)
  name     = "${each.key}-error-topic"
  policy   = data.aws_iam_policy_document.lambda_error_policy_document[each.key].json
}

resource "aws_cloudwatch_log_group" "lambda_log_groups" {
  for_each          = toset(local.lambda_names)
  name              = "/aws/lambda/${each.value}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_metric_filter" "lambda_log_error_filters" {
  for_each       = toset(local.lambda_names)
  name           = "${each.value}-error-filter"
  pattern        = "{ $.level = 50 }"
  log_group_name = "/aws/lambda/${each.value}"

  metric_transformation {
    name      = each.value
    namespace = local.error_namespace
    value     = "1"
    unit      = "Count"
  }
  depends_on = [aws_cloudwatch_log_group.lambda_log_groups]
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_alarms" {
  for_each            = toset(local.lambda_names)
  alarm_name          = "${each.value}-error-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = each.value
  namespace           = local.error_namespace
  period              = 60
  statistic           = "SampleCount"
  threshold           = 1
  alarm_description   = "Alarm when the ${each.value} lambda has errors"
  alarm_actions       = [aws_sns_topic.lambda_error_topics[each.key].arn]
}
