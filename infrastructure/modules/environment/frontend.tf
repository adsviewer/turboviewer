locals {
  api_path         = "api"
  graphql_path     = "graphql"
  prefix           = "app"
  full_domain      = "https://${local.prefix}.${local.domain}"
  graphql_endpoint = "${local.full_domain}/${local.graphql_path}"
}

data "aws_iam_policy_document" "service_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "service_role" {
  name               = "${var.environment}-frontend-service-role"
  assume_role_policy = data.aws_iam_policy_document.service_assume_role_policy.json
}

data "aws_iam_policy_document" "service_policy_document" {
  statement {
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    effect  = "Allow"
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/*:log-stream:*"
    ]
  }

  statement {
    actions = ["logs:CreateLogGroup"]
    effect  = "Allow"
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/*"
    ]
  }

  statement {
    actions = ["logs:DescribeLogGroups"]
    effect  = "Allow"
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
    ]
  }
}

resource "aws_iam_policy" "service_policy" {
  name   = "${var.environment}-frontend-service-policy"
  policy = data.aws_iam_policy_document.service_policy_document.json
}

resource "aws_iam_role_policy_attachment" "execution_role_attachment" {
  role       = aws_iam_role.service_role.name
  policy_arn = aws_iam_policy.service_policy.arn
}

resource "aws_amplify_app" "webapp" {
  name       = "${var.environment}-webapp"
  repository = "https://github.com/${var.git_repository}"
  environment_variables = {
    AMPLIFY_DIFF_DEPLOY          = "false"
    AMPLIFY_MONOREPO_APP_ROOT    = "apps/web"
    AUTH_SECRET                  = aws_ssm_parameter.auth_secret.value
    NEXT_PUBLIC_GRAPHQL_ENDPOINT = local.graphql_endpoint
    NEXT_PUBLIC_ENDPOINT         = local.full_domain
    _CUSTOM_IMAGE                = "amplify:al2023"
    TURBO_TOKEN                  = var.vercel_api_token
    TURBO_TEAM                   = var.vercel_team
  }
  access_token         = var.amplify_token
  iam_service_role_arn = aws_iam_role.service_role.arn
  platform             = "WEB_COMPUTE"

  custom_rule {
    source = "https://www.app.${local.domain}"
    target = "https://app.${local.domain}"
    status = "302"
  }

  custom_rule {
    source = "/${local.graphql_path}"
    target = "https://api.${local.domain}/${local.graphql_path}"
    status = "200"
  }

  custom_rule {
    source = "/${local.api_path}/<*>"
    target = "https://api.${local.domain}/${local.api_path}/<*>"
    status = "200"
  }

  enable_auto_branch_creation = true
  enable_branch_auto_deletion = true

  auto_branch_creation_patterns = [
    "env/${var.environment}**",
  ]

  auto_branch_creation_config {
    enable_auto_build = true
    framework         = "Next.js - SSR"
    stage             = "PRODUCTION"
  }
}

resource "aws_amplify_branch" "main" {
  count                   = (var.environment == "prod" || var.environment == "demo") ? 1 : 0
  app_id                  = aws_amplify_app.webapp.id
  branch_name             = "main"
  enable_notification     = true
  enable_performance_mode = var.environment == "prod" ? true : false

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"
}

resource "aws_amplify_domain_association" "domain_association" {
  app_id      = aws_amplify_app.webapp.id
  domain_name = local.domain

  sub_domain {
    branch_name = aws_amplify_app.webapp.production_branch[0].branch_name
    prefix      = local.prefix
  }

  lifecycle {
    ignore_changes = [sub_domain]
  }
}
