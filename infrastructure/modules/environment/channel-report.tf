locals {
  channel_report_name-no-env = "channel-report"
  channel_process_report     = "${var.environment}-${local.channel_report_name-no-env}"
}

resource "aws_iam_role" "batch_service_role" {
  name               = "${var.environment}-batch-service-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["batch.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "batch_service_role_policy_attachment" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

resource "aws_batch_compute_environment" "channel_report_process" {
  compute_environment_name = local.channel_process_report

  compute_resources {
    max_vcpus = 16

    security_group_ids = [var.endpoint_interface_security_group_id]

    subnets = var.service_subnet_ids

    type = "FARGATE_SPOT"
  }

  service_role = aws_iam_role.batch_service_role.arn
  type         = "MANAGED"
  depends_on   = [aws_iam_role_policy_attachment.batch_service_role_policy_attachment]
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

resource "aws_iam_role" "channel_report_task_execution_role" {
  name               = "${local.channel_process_report}-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role_policy.json
}

data "aws_iam_policy_document" "ecs_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "channel_report_execution_role_policy" {
  role       = aws_iam_role.channel_report_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_batch_job_definition" "channel_report_process" {
  name = local.channel_process_report
  type = "container"

  platform_capabilities = [
    "FARGATE",
  ]

  container_properties = jsonencode({
    image = "${aws_ecr_repository.channel_report_process_ecr_repo.repository_url}:amd-latest"

    fargatePlatformConfiguration = {
      platformVersion = "LATEST"
    }

    resourceRequirements = [
      {
        type  = "VCPU"
        value = "0.25"
      },
      {
        type  = "MEMORY"
        value = "512"
      }
    ]

    executionRoleArn = aws_iam_role.channel_report_task_execution_role.arn
  })
}
