variable "channels" {
  type = set(string)
}

variable "channel_lambda_queue_actions" {
  type = set(string)
}

variable "channel_report_lambda_name" {
  type = string
}

variable "environment" {
  type = string
}
