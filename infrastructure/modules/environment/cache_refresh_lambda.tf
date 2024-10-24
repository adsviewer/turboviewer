locals {
  cache_refresh_name-no-env = "cache-refresh"
  cache_refresh_name        = "${var.environment}-${local.cache_refresh_name-no-env}"
  cache_refresh_alarm_name  = "${local.cache_refresh_name}-error-alarm"
}

resource "aws_ecr_repository" "cache_refresh_ecr_repo" {
  name                 = local.cache_refresh_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "cache_refresh_role" {
  name               = local.cache_refresh_name
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "cache_refresh_basic_policy_attachment" {
  role       = aws_iam_role.cache_refresh_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "cache_refresh_lambda" {
  architectures = ["arm64"]
  description   = "Refreshing insights cache."
  environment {
    variables = merge({
      for k, v in local.common_secrets : k => v.value
      }, {
      for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
      }, {
      AWS_ACCOUNT_ID  = data.aws_caller_identity.current.account_id
      CHANNEL_SECRET  = aws_ssm_parameter.channel_secret.value
      DATABASE_URL    = aws_ssm_parameter.database_url.value
      DATABASE_RO_URL = aws_ssm_parameter.database_ro_url.value
      IS_LAMBDA       = true
      MODE            = var.environment
    })
  }
  function_name = local.cache_refresh_name
  image_config {
    command = ["apps/${local.cache_refresh_name-no-env}/dist/index.handler"]
  }
  image_uri = "${aws_ecr_repository.cache_refresh_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.cache_refresh_role.arn
  timeout      = 900

  lifecycle {
    ignore_changes = [image_uri]
  }
}

resource "aws_cloudwatch_event_rule" "cache_refresh" {
  description         = "Fires to trigger a cache refresh."
  name                = "cache-refresh"
  schedule_expression = "cron(0 2/8 * * ? *)"
}

resource "aws_cloudwatch_event_target" "trigger_cache_refresh" {
  rule      = aws_cloudwatch_event_rule.cache_refresh.name
  target_id = "trigger_cache_refresh"
  arn       = aws_lambda_function.cache_refresh_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_cache_refresh" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cache_refresh_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cache_refresh.arn
}
