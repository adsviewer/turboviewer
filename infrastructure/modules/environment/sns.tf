locals {
  channel_data_refresh_topic_name = "${var.environment}_channel_data_refresh_topic"
  channel_data_report_topic_name  = "${var.environment}_channel_data_report_topic"
  channel_data_refresh_dlq_name   = "${var.environment}_channel_data_refresh_dlq"
}

data "aws_iam_policy_document" "channel_data_refresh_dlq_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = ["sqs:SendMessage"]
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_data_refresh_dlq_name}"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_data_refresh_topic_name}"
      ]
    }
  }
}

resource "aws_sqs_queue" "channel_data_refresh_dlq" {
  name   = local.channel_data_refresh_dlq_name
  policy = data.aws_iam_policy_document.channel_data_refresh_dlq_policy_document.json
}

data "aws_iam_policy_document" "channel_data_refresh_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_data_refresh_topic_name}"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.channel_data_refresh.arn]
    }
  }
}

resource "aws_sns_topic" "channel_data_refresh_topic" {
  name   = local.channel_data_refresh_topic_name
  policy = data.aws_iam_policy_document.channel_data_refresh_policy_document.json
}

resource "aws_sns_topic_subscription" "subscription" {
  topic_arn = aws_sns_topic.channel_data_refresh_topic.arn
  protocol  = "https"
  endpoint  = "${local.server_api_endpoint}/channel/refresh"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.channel_data_refresh_dlq.arn
  })
}

resource "aws_cloudwatch_event_rule" "channel_data_refresh" {
  schedule_expression = "rate(8 hours)"
  name                = "channel-data-refresh"
  description         = "Fires to trigger a refresh of channel data."
}

resource "aws_cloudwatch_event_target" "target_sns" {
  rule      = aws_cloudwatch_event_rule.channel_data_refresh.name
  target_id = local.channel_data_refresh_topic_name
  arn       = aws_sns_topic.channel_data_refresh_topic.arn
}


// Check report trigger sns
data "aws_iam_policy_document" "channel_data_report_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions = ["SNS:Publish"]
    resources = [
      "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_data_report_topic_name}"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.channel_data_report.arn]
    }
  }
}

resource "aws_sns_topic" "channel_report_report_topic" {
  name   = local.channel_data_report_topic_name
  policy = data.aws_iam_policy_document.channel_data_report_policy_document.json
}

# resource "aws_sns_topic_subscription" "subscription" {
#   topic_arn = aws_sns_topic.channel_report_report_topic.arn
#   protocol  = "https"
#   endpoint  = "${local.server_api_endpoint}/channel/report"
# }

resource "aws_cloudwatch_event_rule" "channel_data_report" {
  schedule_expression = "rate(2 minutes)"
  name                = "channel-data-report"
  description         = "Fires to trigger a channel report check."
}

resource "aws_cloudwatch_event_target" "target_report_sns" {
  rule      = aws_cloudwatch_event_rule.channel_data_report.name
  target_id = local.channel_data_report_topic_name
  arn       = aws_sns_topic.channel_report_report_topic.arn
}
