resource "aws_sqs_queue" "stripe" {
  count = var.stripe_bus != null ? 1 : 0

  name = "${var.environment}-stripe"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.stripe_dlq[0].arn
    maxReceiveCount     = 15
  })
}

resource "aws_sqs_queue" "stripe_dlq" {
  count = var.stripe_bus != null ? 1 : 0

  name = "${var.environment}-stripe-dlq"
}

resource "aws_sqs_queue_redrive_allow_policy" "strip_redrive_allow_policy" {
  count = var.stripe_bus != null ? 1 : 0

  queue_url = aws_sqs_queue.stripe_dlq[0].id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.stripe[0].arn]
  })
}

resource "aws_cloudwatch_event_rule" "stripe" {
  count = var.stripe_bus != null ? 1 : 0

  description    = "Capture stripe events"
  event_bus_name = var.stripe_bus
  event_pattern  = jsonencode({ "source" : [{ "prefix" : "aws.partner/stripe.com" }] })
  name           = "${var.environment}-capture-stripe-events"
}

resource "aws_cloudwatch_event_target" "stripe_sns" {
  count = var.stripe_bus != null ? 1 : 0

  arn            = aws_sqs_queue.stripe[0].arn
  event_bus_name = var.stripe_bus
  rule           = aws_cloudwatch_event_rule.stripe[0].name
  target_id      = "SendToStripeSqs"
}

resource "aws_sqs_queue_policy" "stripe_sqs_policy" {
  count     = var.stripe_bus != null ? 1 : 0
  policy    = data.aws_iam_policy_document.stripe_sqs_policy[0].json
  queue_url = aws_sqs_queue.stripe[0].id
}

data "aws_iam_policy_document" "stripe_sqs_policy" {
  count = var.stripe_bus != null ? 1 : 0
  statement {
    effect  = "Allow"
    actions = ["sqs:SendMessage"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    resources = [aws_sqs_queue.stripe[0].arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/${var.stripe_bus}/local-giorgos-capture-stripe-events"
      ]
    }
  }

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }

    actions = local.queue_actions
    resources = [
      "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${var.environment}-stripe"
    ]

    dynamic "condition" {
      for_each = var.app_runner_arn != "not_applicable" ? [var.app_runner_arn] : []
      content {
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [condition.value]
      }
    }
  }
}
