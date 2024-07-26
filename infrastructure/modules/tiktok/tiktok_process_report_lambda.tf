/// Lambda function to check the status of a report


/// Lambda function to process the report, triggered by completed report queue
resource "aws_ecr_repository" "tiktok_process_report_ecr_repo" {
  count                = strcontains(var.environment, "local") ? 0 : 1
  name                 = local.tiktok_process_report
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "tiktok_process_report_role" {
  count              = strcontains(var.environment, "local") ? 0 : 1
  name               = local.tiktok_process_report
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "tiktok_process_report_basic_policy_attachment" {
  count      = strcontains(var.environment, "local") ? 0 : 1
  role       = aws_iam_role.tiktok_process_report_role[0].id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "tiktok_process_report_policy_document" {
  statement {
    actions = concat(local.tiktok_lambda_queue_actions, ["sqs:GetQueueAttributes"])
    resources = [
      aws_sqs_queue.tiktok_completed_reports.arn
    ]
  }
}
resource "aws_iam_policy" "tiktok_process_report_policy" {
  count  = strcontains(var.environment, "local") ? 0 : 1
  name   = local.tiktok_process_report
  policy = data.aws_iam_policy_document.tiktok_process_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "tiktok_process_report_policy_attachment" {
  count      = strcontains(var.environment, "local") ? 0 : 1
  role       = aws_iam_role.tiktok_process_report_role[0].id
  policy_arn = aws_iam_policy.tiktok_process_report_policy[0].arn
}

resource "aws_lambda_function" "tiktok_process_report_lambda" {
  count         = strcontains(var.environment, "local") ? 0 : 1
  architectures = ["arm64"]
  description   = "TikTok process report"
  environment {
    variables = merge({
      TIKTOK_COMPLETE_REPORTS_QUEUE_URL = aws_sqs_queue.tiktok_completed_reports.url
      IS_LAMBDA                         = true
    })
  }
  function_name = local.tiktok_process_report
  image_config {
    command = ["apps/${local.tiktok_process_report-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.tiktok_process_report_ecr_repo[0].repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.tiktok_process_report_role[0].arn
  timeout      = 899
}

resource "aws_lambda_event_source_mapping" "tiktok_process_report_event_source_mapping" {
  count            = strcontains(var.environment, "local") ? 0 : 1
  event_source_arn = aws_sqs_queue.tiktok_completed_reports.arn
  function_name    = aws_lambda_function.tiktok_process_report_lambda[0].arn
}
