locals {
  channel_report_name-no-env = "channel-report"
  channel_process_report     = "${var.environment}-${local.channel_report_name-no-env}"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "${var.environment}-batch-exec-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "batch_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["batch.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "aws_batch_service_role" {
  name               = "${var.environment}-batch-service-role"
  assume_role_policy = data.aws_iam_policy_document.batch_assume_role.json
}

resource "aws_iam_role_policy_attachment" "aws_batch_service_role" {
  role       = aws_iam_role.aws_batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_security_group" "batch_security_group" {
  name   = "${var.environment}-aws-batch-compute-environment-security-group"
  vpc_id = var.vpc_id
}

resource "aws_batch_compute_environment" "channel_report_process" {
  compute_environment_name = local.channel_process_report

  compute_resources {
    max_vcpus = 16

    security_group_ids = [
      aws_security_group.batch_security_group.id
    ]

    subnets = var.service_subnet_ids

    type = "FARGATE_SPOT"
  }

  service_role = aws_iam_role.ecs_task_execution_role.arn
  type         = "MANAGED"
  depends_on   = [aws_iam_role_policy_attachment.aws_batch_service_role]
}

resource "aws_batch_job_queue" "channel_report_process" {
  name     = local.channel_process_report
  state    = "ENABLED"
  priority = 1

  compute_environment_order {
    order               = 1
    compute_environment = aws_batch_compute_environment.channel_report_process.arn
  }
}

resource "aws_ecr_repository" "channel_report_process_ecr_repo" {
  name                 = local.channel_process_report
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}
