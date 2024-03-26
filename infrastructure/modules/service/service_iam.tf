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

data "aws_iam_policy_document" "service_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution_role" {
  name               = "${local.name}-execution-role"
  assume_role_policy = data.aws_iam_policy_document.service_assume_role_policy.json
}

resource "aws_iam_role" "task_role" {
  name               = "${local.name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.service_assume_role_policy.json
}

data "aws_iam_policy_document" "execution_policy_document" {
  statement {
    actions = ["ssm:DescribeParameters", "ssm:GetParameters"]
    resources = concat([
      "arn:aws:secretsmanager:*:${data.aws_caller_identity.current.account_id}:secret:${var.environment}/${var.service_name}/*"
    ])
  }
}

resource "aws_iam_policy" "execution_policy" {
  name   = "${local.name}-execution-policy"
  policy = data.aws_iam_policy_document.execution_policy_document.json
}

resource "aws_iam_role_policy_attachment" "execution_role_attachment" {
  role       = aws_iam_role.execution_role.name
  policy_arn = aws_iam_policy.execution_policy.arn
}

data "aws_iam_policy_document" "github_operating" {
  statement {
    actions   = local.ecr_actions
    effect    = "Allow"
    resources = [aws_ecr_repository.ecr_repo.arn]
  }

  statement {
    actions   = ["iam:PassRole"]
    effect    = "Allow"
    resources = [aws_iam_role.task_role.arn, aws_iam_role.execution_role.arn]
  }
}

resource "aws_iam_policy" "ecs_deploying_policy" {
  name   = "${local.name}-github-operating"
  policy = data.aws_iam_policy_document.github_operating.json
}

resource "aws_iam_role_policy_attachment" "github_operating" {
  role       = var.github_role_name
  policy_arn = aws_iam_policy.ecs_deploying_policy.arn
}

resource "aws_iam_role_policy_attachment" "task_role_attachment" {
  for_each   = var.task_role_policies
  role       = aws_iam_role.task_role.name
  policy_arn = each.value
}
