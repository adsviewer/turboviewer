data "aws_iam_policy_document" "channel_report_requests_policy_document" {
  dynamic "statement" {
    for_each = toset(local.channels)
    content {
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["build.apprunner.amazonaws.com"]
      }

      actions = ["sqs:SendMessage"]
      resources = [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.report_requests_queue}-${statement.key}"
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
    for_each = toset(local.channels)
    content {
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["sqs.amazonaws.com"]
      }

      actions = local.channel_lambda_queue_actions
      resources = [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.report_requests_queue}-${statement.key}"
      ]

      condition {
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.check_report_lambda}"
        ]
      }
    }
  }
}

resource "aws_sqs_queue" "channel_report_requests" {
  for_each = toset(local.channels)
  name     = "${local.report_requests_queue}-${each.key}"
  policy   = data.aws_iam_policy_document.channel_report_requests_policy_document.json
}
