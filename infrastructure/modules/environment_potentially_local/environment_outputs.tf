output "channel_report_arns" {
  value = [for o in aws_sqs_queue.channel_report_requests : o.arn]
}

output "channel_report_urls" {
  value = {
    for k, v in aws_sqs_queue.channel_report_requests : k => v.url
  }
}
