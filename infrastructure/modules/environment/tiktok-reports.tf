locals {
  tiktok_report_requests      = "${var.environment}-tiktok-report-requests"
  tiktok_check_report         = "${var.environment}-tiktok-check-report"
  tiktok_completed_reports    = "${var.environment}-tiktok-completed-reports"
  tiktok_process_report       = "${var.environment}-tiktok-process-report"
  tiktok_lambda_queue_actions = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:DeleteMessageBatch"]
}

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
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_report_requests}"
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
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.tiktok_report_requests}"
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
  name   = local.tiktok_completed_reports
  policy = data.aws_iam_policy_document.tiktok_completed_reports_policy_document.json
}

/// Lambda function to check the status of a report
resource "aws_ecr_repository" "tiktok_report_requests_ecr_repo" {
  name                 = local.tiktok_check_report
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "tiktok_check_report_role" {
  name               = local.tiktok_check_report
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "tiktok_check_report_basic_policy_attachment" {
  role       = aws_iam_role.tiktok_check_report_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "tiktok_check_report_policy_document" {
  statement {
    actions = ["sqs:SendMessage"]
    resources = [
      aws_sqs_queue.tiktok_completed_reports.arn
    ]
  }

  statement {
    actions = local.tiktok_lambda_queue_actions
    resources = [
      aws_sqs_queue.tiktok_report_requests.arn
    ]
  }
}
resource "aws_iam_policy" "tiktok_check_report_policy" {
  name   = local.tiktok_check_report
  policy = data.aws_iam_policy_document.tiktok_check_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "tiktok_check_report_policy_attachment" {
  role       = aws_iam_role.tiktok_check_report_role.id
  policy_arn = aws_iam_policy.tiktok_check_report_policy.arn
}

# resource "aws_lambda_function" "tiktok_check_report_lambda" {
#   architectures = ["arm64"]
#   description = "TikTok async report request check"
#   environment {
#     variables = merge(
# #       {
# #       for k, v in local.common_secrets : k => v.value
# #     }, {
# #       for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
# #     },
#       {
# #       CHANNEL_SECRET                    = aws_ssm_parameter.channel_secret.value
# #       DATABASE_URL                      = aws_ssm_parameter.database_url.value
# #       DATABASE_RO_URL                   = aws_ssm_parameter.database_ro_url.value
#       TIKTOK_REPORT_REQUESTS_QUEUE_URL  = aws_sqs_queue.tiktok_report_requests.url
#       TIKTOK_COMPLETE_REPORTS_QUEUE_URL = aws_sqs_queue.tiktok_completed_reports.url
#       IS_LAMBDA                         = true
#     })
#   }
#   function_name = local.tiktok_check_report
#   image_uri     = "${aws_ecr_repository.tiktok_report_requests_ecr_repo.repository_url}:arm-latest"
#   logging_config {
#     log_format = "JSON"
#   }
#   memory_size  = 3008
#   package_type = "Image"
#   role         = aws_iam_role.tiktok_check_report_role.arn
#   timeout      = 900
# }

resource "aws_cloudwatch_event_rule" "every_twenty_seconds" {
  name                = "every-twenty-seconds"
  description         = "Fires every twenty minutes"
  schedule_expression = "rate(1 minute)"
}

# resource "aws_cloudwatch_event_target" "check_foo_every_five_minutes" {
#   rule      = aws_cloudwatch_event_rule.every_twenty_seconds.name
#   target_id = "check_foo"
#   arn       = aws_lambda_function.tiktok_check_report_lambda.arn
# }
#
# resource "aws_lambda_permission" "allow_cloudwatch_to_call_check_foo" {
#   statement_id  = "AllowExecutionFromCloudWatch"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.tiktok_check_report_lambda.function_name
#   principal     = "events.amazonaws.com"
#   source_arn    = aws_cloudwatch_event_rule.every_twenty_seconds.arn
# }


/// Lambda function to process the report, triggered by completed report queue
resource "aws_ecr_repository" "tiktok_process_report_ecr_repo" {
  name                 = local.tiktok_process_report
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "tiktok_process_report_role" {
  name               = local.tiktok_process_report
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "tiktok_process_report_basic_policy_attachment" {
  role       = aws_iam_role.tiktok_process_report_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "tiktok_process_report_policy_document" {
  statement {
    actions = ["sqs:ReceiveMessage"]
    resources = [
      aws_sqs_queue.tiktok_completed_reports.arn
    ]
  }
}
resource "aws_iam_policy" "tiktok_process_report_policy" {
  name   = local.tiktok_process_report
  policy = data.aws_iam_policy_document.tiktok_process_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "tiktok_process_report_policy_attachment" {
  role       = aws_iam_role.tiktok_process_report_role.id
  policy_arn = aws_iam_policy.tiktok_process_report_policy.arn
}

# resource "aws_lambda_function" "tiktok_process_report_lambda" {
#   architectures = ["arm64"]
#   description = "TikTok process report"
#   environment {
#     variables = merge(
# #       {
# #       for k, v in local.common_secrets : k => v.value
# #     }, {
# #       for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
# #     },
#       {
# #       CHANNEL_SECRET                    = aws_ssm_parameter.channel_secret.value
# #       DATABASE_URL                      = aws_ssm_parameter.database_url.value
# #       DATABASE_RO_URL                   = aws_ssm_parameter.database_ro_url.value
#       TIKTOK_COMPLETE_REPORTS_QUEUE_URL = aws_sqs_queue.tiktok_completed_reports.url
#       IS_LAMBDA                         = true
#     })
#   }
#   function_name = local.tiktok_process_report
#   image_uri     = "${aws_ecr_repository.tiktok_process_report_ecr_repo.repository_url}:arm-latest"
#   logging_config {
#     log_format = "JSON"
#   }
#   memory_size  = 3008
#   package_type = "Image"
#   role         = aws_iam_role.tiktok_process_report_role.arn
#   timeout      = 900
# }

# resource "aws_lambda_event_source_mapping" "tiktok_process_report_event_source_mapping" {
#   event_source_arn = aws_sqs_queue.tiktok_completed_reports.arn
#   function_name    = aws_lambda_function.tiktok_process_report_lambda.arn
# }
