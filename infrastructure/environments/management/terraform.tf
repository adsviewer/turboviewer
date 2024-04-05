locals {
  terraform_provider_url = "app.terraform.io"
  terraform_audience     = "aws.workload.identity"
  workspaces             = [var.environment, "prod", "local", "dev"]
}

resource "aws_iam_role" "terraform_role" {
  name        = "${local.organization}-terraform"
  description = "Terraform role for managing ${local.organization} resources"

  max_session_duration = 43200
  assume_role_policy   = data.aws_iam_policy_document.terraform_assume_role_policy.json
}

data "aws_iam_policy_document" "terraform_assume_role_policy" {
  version = "2012-10-17"
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.terraform_openid_connect_provider.arn]
    }
    condition {
      test     = "StringEquals"
      values   = [local.terraform_audience]
      variable = "${local.terraform_provider_url}:aud"
    }
    condition {
      test     = "StringLike"
      values   = [for workspace in local.workspaces : "organization:${local.organization}:project:${var.terraform_project}:workspace:${workspace}:*"]
      variable = "${local.terraform_provider_url}:sub"
    }
  }
}

resource "aws_iam_role_policy_attachment" "terraform_admin_policy_attach" {
  role       = aws_iam_role.terraform_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

data "external" "terraform_thumbprint" {
  program = ["${path.module}/../../modules/thumbprint.sh", local.terraform_provider_url]
}

resource "aws_iam_openid_connect_provider" "terraform_openid_connect_provider" {
  url = "https://${local.terraform_provider_url}"

  client_id_list = [
    local.terraform_audience,
  ]

  thumbprint_list = [data.external.terraform_thumbprint.result.thumbprint]
}
