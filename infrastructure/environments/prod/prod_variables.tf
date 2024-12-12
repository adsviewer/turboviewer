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

variable "emailable_api_key" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "exchange_rates_api_key" {
  type = string
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

variable "google_channel_application_id" {
  type = string
}
variable "google_channel_application_secret" {
  type = string
}
variable "google_channel_developer_token" {
  type = string
}

variable "linkedin_application_id" {
  type = string
}
variable "linkedin_application_secret" {
  type = string
}

variable "pinterest_app_id" {
  type = string
}
variable "pinterest_app_secret" {
  type = string
}

variable "posthog_api_key" {
  type = string
}

variable "redis_url" {
  type = string
}

variable "slack_webhook_url_public_feedback" {
  type = string
}
variable "slack_webhook_url_errors" {
  type = string
}
variable "slack_workspace_id" {
  type = string
}

variable "stripe_public_key" {
  type = string
}
variable "stripe_private_key" {
  type = string
}

variable "tiktok_application_id" {
  type = string
}
variable "tiktok_application_secret" {
  type = string
}

variable "vercel_api_token" {
  type = string
}
variable "vercel_team" {
  type = string
}
