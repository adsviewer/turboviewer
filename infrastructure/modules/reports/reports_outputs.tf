output "report_requests_queue_arns" {
  value = [for o in aws_sqs_queue.channel_report_requests : o.arn]
}
