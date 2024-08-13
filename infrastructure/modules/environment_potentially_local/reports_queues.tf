locals {
  channel_report_queue         = "${var.environment}-report-requests"
  channels                     = toset(["tiktok", "meta"]) # these need to be the same with `IntegrationTypeEnum` if capitalized
  channel_lambda_queue_actions = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:DeleteMessageBatch"]
}

data "aws_iam_policy_document" "channel_report_policy_document" {
  dynamic "statement" {
    for_each = local.channels
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
          "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${var.channel_ingress_lambda_name}"
        ]
      }
    }
  }

  dynamic "statement" {
    for_each = local.channels
    content {
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["sqs.amazonaws.com"]
      }

      actions = local.channel_lambda_queue_actions
      resources = [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.channel_report_queue}-${statement.key}"
      ]

      condition {
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [var.app_runner_arn]
      }
    }
  }
}

resource "aws_sqs_queue" "channel_report_requests" {
  for_each = local.channels
  name     = "${local.channel_report_queue}-${each.key}"
  policy   = data.aws_iam_policy_document.channel_report_policy_document.json
}
