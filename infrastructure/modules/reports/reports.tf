locals {
  report_requests_queue        = "${var.environment}-report-requests"
  check_report-no-env          = "check-report"
  check_report_lambda          = "${var.environment}-${local.check_report-no-env}"
  completed_reports_queue      = "${var.environment}-completed-reports"
  process_report-no-env        = "process-report"
  process_report_lambda        = "${var.environment}-${local.process_report-no-env}"
  channel_lambda_queue_actions = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:DeleteMessageBatch"]
  channels                     = ["tiktok", "meta"] # these need to be the same with `IntegrationTypeEnum` if capitalized
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

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
    resources = flatten([
      length(aws_ecr_repository.channel_process_report_ecr_repo) > 0 ?
      [aws_ecr_repository.channel_process_report_ecr_repo[0].arn] : [],
      aws_ecr_repository.channel_report_requests_ecr_repo.arn
    ])
  }
  #   statement {
  #     actions = [
  #       "lambda:UpdateFunctionCode"
  #     ]
  #     effect = "Allow"
  #     resources = flatten([
  #       aws_lambda_function.channel_check_report_lambda.arn,
  #       length(aws_lambda_function.channel_process_report_lambda) > 0 ?
  #       [aws_lambda_function.channel_process_report_lambda[0].arn] : []
  #     ])
  #   }
}

resource "aws_iam_policy" "ecr_policy" {
  name   = "${var.environment}-channel-github-operating"
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
