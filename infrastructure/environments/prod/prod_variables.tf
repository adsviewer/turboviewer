variable "amplify_token" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "default_tags" {
  default = {

    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = "AdsViewer"

  }
  type = map(string)
}

variable "fb_application_id" {
  type = string
}
variable "fb_application_secret" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "slack_webhook_url" {
  type = string
}

variable "vercel_api_token" {
  type = string
}
variable "vercel_team" {
  type = string
}
