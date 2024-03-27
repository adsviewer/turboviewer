locals {
  github_provider_url = "token.actions.githubusercontent.com"
  github_audience     = "sts.amazonaws.com"
}

data "external" "github_thumbprint" {
  program = ["${path.module}/../thumbprint.sh", local.github_provider_url]
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://${local.github_provider_url}"

  client_id_list = [
    local.github_audience,
  ]

  thumbprint_list = [data.external.github_thumbprint.result.thumbprint]
}

resource "aws_iam_role" "github_role" {
  name                 = "${var.environment}-github"
  description          = "CI/CD role for deploying ${var.environment} environment"
  max_session_duration = 43200
  assume_role_policy   = data.aws_iam_policy_document.github_assume_role_policy.json
}

data "aws_iam_policy_document" "github_assume_role_policy" {
  version = "2012-10-17"
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      values   = [local.github_audience]
      variable = "${local.github_provider_url}:aud"
    }
    condition {
      test     = "StringLike"
      values   = ["repo:${var.git_repository}:*"]
      variable = "${local.github_provider_url}:sub"
    }
  }
}

data "aws_iam_policy_document" "services_deploy" {
  statement {
    actions   = ["ecr:GetAuthorizationToken", "ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition"]
    effect    = "Allow"
    resources = ["*"]
  }
}

resource "aws_iam_policy" "service_deploy" {
  name   = "${var.environment}-server-deploy"
  policy = data.aws_iam_policy_document.services_deploy.json
}

resource "aws_iam_role_policy_attachment" "github_server_deploy" {
  role       = aws_iam_role.github_role.name
  policy_arn = aws_iam_policy.service_deploy.arn
}
