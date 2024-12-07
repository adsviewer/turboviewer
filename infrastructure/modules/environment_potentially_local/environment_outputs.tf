output "channels" {
  value = local.channels
}

output "channel_lambda_queue_actions" {
  value = local.queue_actions
}

output "channel_report_arns" {
  value = [for o in aws_sqs_queue.channel_report_requests : o.arn]
}

output "stripe_queue_arn" {
  value = length(aws_sqs_queue.stripe) > 0 ? aws_sqs_queue.stripe[0].arn : null
}

output "channel_report_urls" {
  value = {
    for k, v in aws_sqs_queue.channel_report_requests : k => v.url
  }
}
