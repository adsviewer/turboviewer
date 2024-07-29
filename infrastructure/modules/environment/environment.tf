locals {
  error_namespace = "${var.environment}-error-namespace"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.58.0"
      configuration_aliases = [aws.us_east_1]
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.12.0"
    }
  }
}

module "ses" {
  source      = "../../modules/ses"
  domain      = aws_route53_zone.zone.name
  environment = var.environment
  zone_id     = aws_route53_zone.zone.zone_id
}

data "aws_iam_policy_document" "sqs_policy_document" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = module.environment_potentially_local.channel_report_arns
  }
}

resource "aws_iam_policy" "sqs_policy" {
  name   = "${var.environment}-sqs-policy"
  policy = data.aws_iam_policy_document.sqs_policy_document.json
}

data "aws_iam_policy_document" "sns_policy_document" {
  statement {
    actions = ["sns:Subscribe", "sns:Unsubscribe"]
    resources = [
      aws_sns_topic.channel_data_refresh_topic.arn,
    ]
  }
}

resource "aws_iam_policy" "sns_policy" {
  name   = "${var.environment}-sns-policy"
  policy = data.aws_iam_policy_document.sns_policy_document.json
}

data "aws_iam_policy_document" "lambda_invoke_policy_document" {
  statement {
    actions = ["lambda:InvokeFunction"]
    resources = [
      aws_lambda_function.channel_ingress_lambda.arn,
    ]
  }
}

resource "aws_iam_policy" "lambda_invoke_policy" {
  name   = "${var.environment}-lambda-invoke-policy"
  policy = data.aws_iam_policy_document.lambda_invoke_policy_document.json
}

locals {
  server_domain_prefix = "api"
  server_api_endpoint  = "https://${local.server_domain_prefix}.${local.domain}/${local.api_path}"
}
module "server" {
  source          = "../service"
  certificate_arn = aws_acm_certificate.wildcard.arn
  domain_name     = aws_route53_zone.zone.name
  domain_prefix   = local.server_domain_prefix
  domain_zone_id  = aws_route53_zone.zone.id
  environment     = var.environment
  environment_variables = {
    API_ENDPOINT = local.server_api_endpoint
    PORT         = 4000,
    PUBLIC_URL   = local.full_domain
  }
  github_role_name   = var.github_role_name
  mapped_secrets     = local.server_secrets
  service_name       = "server"
  service_subnet_ids = var.service_subnet_ids
  instance_role_policies = {
    "ses"    = module.ses.send_email_policy_arn
    "sns"    = aws_iam_policy.sns_policy.arn
    "sqs"    = aws_iam_policy.sqs_policy.arn
    "lambda" = aws_iam_policy.lambda_invoke_policy.arn
  }
  vpc_id = var.vpc_id
}

module "environment_potentially_local" {
  source = "../environment_potentially_local"

  channel_report_lambda_name = local.channel_report_lambda
  environment                = var.environment
}
