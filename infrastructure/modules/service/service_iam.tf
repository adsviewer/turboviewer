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
  inline_policy {
    name = "ecr-access-policy"
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

data "aws_iam_policy_document" "parameters_access_policy_document" {
  statement {
    actions = ["ssm:DescribeParameters", "ssm:GetParameters"]
    resources = concat([
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment}/${var.service_name}/*"
    ])
  }
}

resource "aws_iam_policy" "parameters_access_policy" {
  name   = "${local.name}-parameters-access-policy"
  policy = data.aws_iam_policy_document.parameters_access_policy_document.json
}

resource "aws_iam_role_policy_attachment" "parameter_access_role_attachment" {
  role       = aws_iam_role.instance_role.name
  policy_arn = aws_iam_policy.parameters_access_policy.arn
}

data "aws_iam_policy_document" "github_operating" {
  statement {
    actions   = local.ecr_actions
    effect    = "Allow"
    resources = [aws_ecr_repository.ecr_repo.arn, "${aws_ecr_repository.ecr_repo.arn}/*"]
  }
}

resource "aws_iam_policy" "ecr_policy" {
  name   = "${local.name}-github-operating"
  policy = data.aws_iam_policy_document.github_operating.json
}

resource "aws_iam_role_policy_attachment" "github_operating" {
  role       = var.github_role_name
  policy_arn = aws_iam_policy.ecr_policy.arn
}

#resource "aws_iam_role_policy_attachment" "instance_role_attachments" {
#  for_each   = var.task_role_policies
#  role       = aws_iam_role.instance_role.name
#  policy_arn = each.value
#}
