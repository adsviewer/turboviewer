locals {
  ecr_actions = [
    "ecr:BatchGetImage",
    "ecr:BatchCheckLayerAvailability",
    "ecr:CompleteLayerUpload",
    "ecr:GetDownloadUrlForLayer",
    "ecr:InitiateLayerUpload",
    "ecr:GetDownloadUrlForLayer",
    "ecr:PutImage",
    "ecr:UploadLayerPart"
  ]
}

data "aws_iam_policy_document" "ecr_access_role_assume_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "ecr_access_role" {
  name               = "${local.name}-ecr-access-role"
  assume_role_policy = data.aws_iam_policy_document.ecr_access_role_assume_policy.json
}

resource "aws_iam_role_policy" "ecr_access_policy" {
  name = "${local.name}-ecr-access-policy"
  role = aws_iam_role.ecr_access_role.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
          "ecr:GetAuthorizationToken",
          "ecr:GetDownloadUrlForLayer"
        ],
        Resource = ["*"]
      }
    ]
  })
}

data "aws_iam_policy_document" "service_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance_role" {
  name               = "${local.name}-instance-role"
  assume_role_policy = data.aws_iam_policy_document.service_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "parameter_access_role_attachment" {
  role       = aws_iam_role.instance_role.name
  policy_arn = var.service_parameters_access_policy_arn
}

data "aws_iam_policy_document" "github_operating" {
  statement {
    actions   = local.ecr_actions
    effect    = "Allow"
    resources = [aws_ecr_repository.ecr_repo.arn]
  }
}

resource "aws_iam_policy" "ecr_policy" {
  name   = "${local.name}-github-operating"
  policy = data.aws_iam_policy_document.github_operating.json
}

resource "aws_iam_role_policy_attachment" "parameter_access_github_attachment" {
  role       = var.github_role_name
  policy_arn = var.service_parameters_access_policy_arn
}

resource "aws_iam_role_policy_attachment" "github_operating" {
  role       = var.github_role_name
  policy_arn = aws_iam_policy.ecr_policy.arn
}

resource "aws_iam_role_policy_attachment" "instance_role_attachments" {
  for_each   = var.instance_role_policies
  role       = aws_iam_role.instance_role.name
  policy_arn = each.value
}
