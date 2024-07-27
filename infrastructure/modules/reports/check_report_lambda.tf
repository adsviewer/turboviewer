resource "aws_ecr_repository" "channel_report_requests_ecr_repo" {
  name                 = local.check_report_lambda
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "channel_check_report_role" {
  name               = local.check_report_lambda
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_check_report_basic_policy_attachment" {
  role       = aws_iam_role.channel_check_report_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "channel_check_report_policy_document" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [for o in aws_sqs_queue.channel_completed_reports : o.arn]
  }

  statement {
    actions   = local.channel_lambda_queue_actions
    resources = [for o in aws_sqs_queue.channel_report_requests : o.arn]
  }
}
resource "aws_iam_policy" "channel_check_report_policy" {
  name   = local.check_report_lambda
  policy = data.aws_iam_policy_document.channel_check_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "channel_check_report_policy_attachment" {
  role       = aws_iam_role.channel_check_report_role.id
  policy_arn = aws_iam_policy.channel_check_report_policy.arn
}

resource "aws_lambda_function" "channel_check_report_lambda" {
  architectures = ["arm64"]
  description   = "Channel async report request check"
  environment {
    variables = merge({
      for v in local.channels : "${upper(v)}_REPORT_REQUESTS_QUEUE_URL" =>
      aws_sqs_queue.channel_report_requests[v].url
      },
      {
        for v in local.channels : "${upper(v)}_COMPLETE_REPORTS_QUEUE_URL" =>
        aws_sqs_queue.channel_completed_reports[v].url
        }, {
        IS_LAMBDA = true
    }, )
  }
  function_name = local.check_report_lambda
  image_config {
    command = ["apps/${local.check_report-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.channel_report_requests_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.channel_check_report_role.arn
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
  arn       = aws_lambda_function.channel_check_report_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_invoke_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.channel_check_report_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_one_minute.arn
}
