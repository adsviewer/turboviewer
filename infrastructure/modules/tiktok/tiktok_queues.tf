data "aws_iam_policy_document" "tiktok_report_requests_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }

    actions = ["sqs:SendMessage"]
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_report_requests}"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:apprunner:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${var.environment}-server"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }

    actions = local.tiktok_lambda_queue_actions
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_report_requests}"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.tiktok_check_report}"
      ]
    }
  }

}

resource "aws_sqs_queue" "tiktok_report_requests" {
  name   = local.tiktok_report_requests
  policy = data.aws_iam_policy_document.tiktok_report_requests_policy_document.json
}

data "aws_iam_policy_document" "tiktok_completed_reports_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }

    actions = ["sqs:SendMessage"]
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_completed_reports}"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.tiktok_check_report}"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }

    actions = local.tiktok_lambda_queue_actions
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_completed_reports}"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.tiktok_process_report}"
      ]
    }
  }
}

resource "aws_sqs_queue" "tiktok_completed_reports" {
  name                       = local.tiktok_completed_reports
  policy                     = data.aws_iam_policy_document.tiktok_completed_reports_policy_document.json
  visibility_timeout_seconds = 900
}
