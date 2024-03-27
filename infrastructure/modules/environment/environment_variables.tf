variable "amplify_token" {
  type = string
}

variable "domain" {
  type = string
}

variable "environment" {
  type = string
}

variable "git_repository" {
  type = string
}

variable "github_role_name" {
  type = string
}

variable "organization" {
  type = string
}

variable "service_subnet_ids" {
  type = list(string)
}

variable "slack_webhook_url" {
  type = string
}

variable "vercel_team" {
  type = string
}
variable "vercel_api_token" {
  type = string
}

variable "vpc_id" {
  type = string
}
