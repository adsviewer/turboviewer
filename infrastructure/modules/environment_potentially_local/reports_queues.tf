locals {
  channel_report_queue = "${var.environment}-report-requests"
}

data "aws_iam_policy_document" "channel_report_policy_document" {
  dynamic "statement" {
    for_each = var.channels
    content {
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["build.apprunner.amazonaws.com"]
      }

      actions = ["sqs:SendMessage"]
      resources = [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_report_queue}-${statement.key}"
      ]

      condition {
        test     = "ArnLike"
        variable = "aws:SourceArn"
        values = [
          "arn:aws:apprunner:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${var.environment}-server"
        ]
      }
    }
  }

  dynamic "statement" {
    for_each = var.channels
    content {
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["sqs.amazonaws.com"]
      }

      actions = var.channel_lambda_queue_actions
      resources = [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_report_queue}-${statement.key}"
      ]

      condition {
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${var.channel_report_lambda_name}"
        ]
      }
    }
  }
}

resource "aws_sqs_queue" "channel_report_requests" {
  for_each = var.channels
  name     = "${local.channel_report_queue}-${each.key}"
  policy   = data.aws_iam_policy_document.channel_report_policy_document.json
}
