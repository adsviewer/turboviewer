output "app_runner_arn" {
  value = aws_apprunner_service.server.arn
}

output "sns_app_runner_error_topic_arn" {
  value = aws_sns_topic.app_runner_error_topic.arn
}
