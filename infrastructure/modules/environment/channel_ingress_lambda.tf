locals {
  channel_ingress_name = "${var.environment}-channel-ingress"
}

resource "aws_ecr_repository" "channel_ingress_ecr_repo" {
  name                 = local.channel_ingress_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

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
    effect    = "Allow"
    resources = [aws_ecr_repository.channel_ingress_ecr_repo.arn]
  }
  statement {
    actions = [
      "lambda:UpdateFunctionCode"
    ]
    effect    = "Allow"
    resources = [aws_lambda_function.channel_ingress_lambda.arn]
  }
}

resource "aws_iam_policy" "ecr_policy" {
  name   = "${local.channel_ingress_name}-github-operating"
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

resource "aws_iam_role" "channel_ingress_role" {
  name               = "${var.environment}-iam-for-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_ingress_logging_policy_attachment" {
  role       = aws_iam_role.channel_ingress_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "channel_ingress_lambda" {
  architectures = ["arm64"]
  description   = "Ingests channel data"
  environment {
    variables = merge({
      for k, v in local.common_secrets : k => v.value
      }, {
      for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.value
      }, {
      CHANNEL_SECRET  = aws_ssm_parameter.channel_secret.value
      DATABASE_URL    = aws_ssm_parameter.database_url.value
      DATABASE_RO_URL = aws_ssm_parameter.database_ro_url.value
      IS_LAMBDA       = true
    })
  }
  function_name = local.channel_ingress_name
  image_uri     = "${aws_ecr_repository.channel_ingress_ecr_repo.repository_url}:arm-latest"
  logging_config {
    log_format = "JSON"
  }
  memory_size  = 3008
  package_type = "Image"
  role         = aws_iam_role.channel_ingress_role.arn
  timeout      = 900
}
