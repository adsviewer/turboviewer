variable "amplify_token" {
  type = string
}

variable "base_tags" {
  type = map(string)
}

variable "domain" {
  type = string
}

variable "emailable_api_key" {
  type = string
}

variable "endpoint_interface_security_group_id" {
  type = string
}

variable "environment" {
  type = string
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

variable "git_repository" {
  type = string
}

variable "github_role_name" {
  type = string
}

variable "linkedin_application_id" {
  type = string
}
variable "linkedin_application_secret" {
  type = string
}

variable "organization" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "redis_url" {
  type = string
}

variable "service_subnet_ids" {
  type = list(string)
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

variable "tiktok_application_id" {
  type = string
}
variable "tiktok_application_secret" {
  type = string
}

variable "vercel_team" {
  type = string
}
variable "vercel_region" {
  type = map(string)
  default = {
    "us-east-1"    = "sfo1"
    "us-west-1"    = "lax1"
    "us-west-2"    = "lax1"
    "us-east-2"    = "ewr"
    "eu-central-1" = "fra1"
  }
}
variable "vercel_api_token" {
  type = string
}

variable "vpc_id" {
  type = string
}
