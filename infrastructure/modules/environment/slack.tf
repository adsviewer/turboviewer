resource "awscc_chatbot_slack_channel_configuration" "error_slack_channel_configuration" {
  configuration_name = "${var.environment}-slack-channel-config"
  iam_role_arn       = awscc_iam_role.slack_assume_role.arn
  logging_level      = "ERROR"
  slack_channel_id   = "errors"
  slack_workspace_id = var.slack_workspace_id
  sns_topic_arns     = concat([module.server.sns_app_runner_error_topic_arn], values(aws_sns_topic.lambda_error_topics)[*].arn)

  tags = [
    for key, value in var.base_tags : {
      key   = key
      value = value
    }
  ]
}

data "aws_iam_policy_document" "logs_policy" {
  statement {
    actions   = ["cloudwatch:ListDashboards"]
    resources = ["arn:aws:cloudwatch::${data.aws_caller_identity.current.account_id}:dashboard/*"]
  }
  statement {
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }
}

resource "awscc_iam_role" "slack_assume_role" {
  role_name = "${var.environment}-chatBot-channel-role"
  assume_role_policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "chatbot.amazonaws.com"
        }
      },
    ]
  })
  managed_policy_arns = ["arn:aws:iam::aws:policy/AWSResourceExplorerReadOnlyAccess"]
  policies = [
    {
      #   remove jsonencode/jsondecode when https://github.com/hashicorp/terraform-provider-awscc/issues/750 is fixed
      policy_document = jsonencode(jsondecode(data.aws_iam_policy_document.logs_policy.json))
      policy_name     = "logs_policy"
    }
  ]
}
