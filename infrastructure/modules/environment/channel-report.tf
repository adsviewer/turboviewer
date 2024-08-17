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

resource "aws_iam_role_policy_attachment" "parameter_access_role_attachment" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = aws_iam_policy.server_parameters_access_policy.arn
}

resource "aws_security_group" "batch_security_group" {
  name        = "${var.environment}-batch-security-group"
  description = "egress for channel report"
  vpc_id      = var.vpc_id
  tags        = { Name = "${var.environment}-batch-security-group" }
}

resource "aws_vpc_security_group_egress_rule" "egress_ports" {
  for_each = toset(["5432", "6379"])

  security_group_id = aws_security_group.batch_security_group.id

  from_port   = each.key
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"
  to_port     = each.key
}

resource "aws_batch_compute_environment" "channel_report_process" {
  compute_environment_name = local.channel_process_report

  compute_resources {
    max_vcpus = 16

    security_group_ids = [var.endpoint_interface_security_group_id, aws_security_group.batch_security_group.id]

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


resource "aws_iam_role_policy_attachment" "channel_report_ssm_role_policy_attachment" {
  role       = aws_iam_role.channel_report_task_execution_role.name
  policy_arn = aws_iam_policy.server_parameters_access_policy.arn
}


resource "aws_batch_job_definition" "channel_report_process" {
  name = local.channel_process_report
  type = "container"

  platform_capabilities = [
    "FARGATE",
  ]

  container_properties = jsonencode({

    environment = [
      {
        name  = "AWS_ACCOUNT_ID"
        value = data.aws_caller_identity.current.account_id
      },
      {
        name  = "AWS_REGION"
        value = data.aws_region.current.name
      },
      {
        name  = "MODE"
        value = var.environment
      }
    ]

    executionRoleArn = aws_iam_role.channel_report_task_execution_role.arn

    fargatePlatformConfiguration = {
      platformVersion = "LATEST"
    }

    image = "${aws_ecr_repository.channel_report_process_ecr_repo.repository_url}:amd-latest"

    resourceRequirements = [
      {
        type  = "VCPU"
        value = "1"
      },
      {
        type  = "MEMORY"
        value = "2048"
      }
    ]

    secrets : [
      for k, v in local.server_secrets : {
        name      = k
        valueFrom = v
      }
    ]
  })
}
