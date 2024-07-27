/// Lambda function to check the status of a report


/// Lambda function to process the report, triggered by completed report queue
resource "aws_ecr_repository" "channel_process_report_ecr_repo" {
  count                = strcontains(var.environment, "local") ? 0 : 1
  name                 = local.process_report_lambda
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "channel_process_report_role" {
  count              = strcontains(var.environment, "local") ? 0 : 1
  name               = local.process_report_lambda
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_process_report_basic_policy_attachment" {
  count      = strcontains(var.environment, "local") ? 0 : 1
  role       = aws_iam_role.channel_process_report_role[0].id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "channel_process_report_policy_document" {
  statement {
    actions   = concat(local.channel_lambda_queue_actions, ["sqs:GetQueueAttributes"])
    resources = [for o in aws_sqs_queue.channel_completed_reports : o.arn]
  }
}
resource "aws_iam_policy" "channel_process_report_policy" {
  count  = strcontains(var.environment, "local") ? 0 : 1
  name   = local.process_report_lambda
  policy = data.aws_iam_policy_document.channel_process_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "channel_process_report_policy_attachment" {
  count      = strcontains(var.environment, "local") ? 0 : 1
  role       = aws_iam_role.channel_process_report_role[0].id
  policy_arn = aws_iam_policy.channel_process_report_policy[0].arn
}

resource "aws_lambda_function" "channel_process_report_lambda" {
  count         = strcontains(var.environment, "local") ? 0 : 1
  architectures = ["arm64"]
  description   = "Channel process report"
  environment {
    variables = merge({
      for v in local.channels : "${upper(v)}_COMPLETE_REPORTS_QUEUE_URL" =>
      aws_sqs_queue.channel_completed_reports[v].url
      }, {
      IS_LAMBDA = true
    }, )
  }
  function_name = local.process_report_lambda
  image_config {
    command = ["apps/${local.process_report-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.channel_process_report_ecr_repo[0].repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.channel_process_report_role[0].arn
  timeout      = 899
}

resource "aws_lambda_event_source_mapping" "channel_process_report_event_source_mapping" {
  for_each         = strcontains(var.environment, "local") ? [] : toset(local.channels)
  event_source_arn = aws_sqs_queue.channel_completed_reports[each.key].arn
  function_name    = aws_lambda_function.channel_process_report_lambda[0].arn
}
