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

resource "aws_lambda_function" "tiktok_check_report_lambda" {
  architectures = ["arm64"]
  description   = "TikTok async report request check"
  environment {
    variables = merge({
      TIKTOK_REPORT_REQUESTS_QUEUE_URL  = aws_sqs_queue.tiktok_report_requests.url
      TIKTOK_COMPLETE_REPORTS_QUEUE_URL = aws_sqs_queue.tiktok_completed_reports.url
      IS_LAMBDA                         = true
    })
  }
  function_name = local.tiktok_check_report
  image_config {
    command = ["apps/${local.tiktok_check_report-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.tiktok_report_requests_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.tiktok_check_report_role.arn
  timeout      = 900
}

resource "aws_cloudwatch_event_rule" "every_one_minute" {
  name                = "${var.environment}-every-twenty-seconds"
  description         = "Fires every twenty minutes"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "invoke_lambda_every_one_minute" {
  rule      = aws_cloudwatch_event_rule.every_one_minute.name
  target_id = "${var.environment}-invoke-lambda"
  arn       = aws_lambda_function.tiktok_check_report_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_invoke_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tiktok_check_report_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_one_minute.arn
}
