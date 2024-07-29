locals {
  channel_report-no-env = "channel-report"
  channel_report_lambda = "${var.environment}-${local.channel_report-no-env}"
}

resource "aws_ecr_repository" "channel_report_ecr_repo" {
  name                 = local.channel_report_lambda
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "channel_report_role" {
  name               = local.channel_report_lambda
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_report_basic_policy_attachment" {
  role       = aws_iam_role.channel_report_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "channel_report_policy_document" {
  statement {
    actions   = module.environment_potentially_local.channel_lambda_queue_actions
    resources = module.environment_potentially_local.channel_report_arns
  }
}
resource "aws_iam_policy" "channel_report_policy" {
  name   = local.channel_report_lambda
  policy = data.aws_iam_policy_document.channel_report_policy_document.json
}
resource "aws_iam_role_policy_attachment" "channel_report_policy_attachment" {
  role       = aws_iam_role.channel_report_role.id
  policy_arn = aws_iam_policy.channel_report_policy.arn
}

# resource "aws_lambda_function" "channel_report_lambda" {
#   architectures = ["arm64"]
#   description   = "Check status of async reports, start new if within concurrency limits and process the finished"
#   environment {
#     variables = merge(
#       {
#         for k, v in local.common_secrets : k => v.value
#         }, {
#         for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
#         }, {
#         AWS_REGION      = data.aws_region.current.name
#         AWS_ACCOUNT_ID  = data.aws_caller_identity.current.account_id
#         CHANNEL_SECRET  = aws_ssm_parameter.channel_secret.value
#         DATABASE_URL    = aws_ssm_parameter.database_url.value
#         DATABASE_RO_URL = aws_ssm_parameter.database_ro_url.value
#         IS_LAMBDA       = true
#       }
#     )
#   }
#   function_name = local.channel_report_lambda
#   image_config {
#     command = ["apps/${local.channel_report-no-env}/dist/index.handler"]
#   }
#   image_uri = "${aws_ecr_repository.channel_report_ecr_repo.repository_url}:arm-latest"
#   logging_config {
#     log_format = "JSON"
#   }
#   memory_size  = 3008
#   package_type = "Image"
#   role         = aws_iam_role.channel_report_role.arn
#   timeout      = 900
# }

resource "aws_cloudwatch_event_rule" "every_one_minute" {
  name                = "${var.environment}-every-twenty-seconds"
  description         = "Fires every twenty minutes"
  schedule_expression = "rate(1 minute)"
}

# resource "aws_cloudwatch_event_target" "invoke_lambda_every_one_minute" {
#   rule      = aws_cloudwatch_event_rule.every_one_minute.name
#   target_id = "${var.environment}-invoke-lambda"
#   arn       = aws_lambda_function.channel_report_lambda.arn
# }
#
# resource "aws_lambda_permission" "allow_cloudwatch_to_invoke_lambda" {
#   statement_id  = "AllowExecutionFromCloudWatch"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.channel_report_lambda.function_name
#   principal     = "events.amazonaws.com"
#   source_arn    = aws_cloudwatch_event_rule.every_one_minute.arn
# }

