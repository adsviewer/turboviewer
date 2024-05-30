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

variable "environment" {
  type    = string
  default = "prod"
}

variable "fb_application_id" {
  type = string
}
variable "fb_application_secret" {
  type = string
}

variable "google_application_id" {
  type = string
}
variable "google_application_secret" {
  type = string
}

variable "redis_url" {
  type = string
}

variable "slack_webhook_url" {
  type = string
}

variable "slack_workspace_id" {
  type = string
}

variable "vercel_api_token" {
  type = string
}
variable "vercel_team" {
  type = string
}
