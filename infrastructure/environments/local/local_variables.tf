variable "aws_region" {
  type = string
}

variable "developers" {
  type        = set(string)
  default     = ["giorgos", "lefteris", "aaryan", "dennis", "iresha"]
  description = "List of developers to be added to the team. This should be a list of aws usernames"
}

variable "default_tags" {
  default = {

    Environment = "Local"
    ManagedBy   = "Terraform"
    Project     = "AdsViewer"

  }
  type = map(string)
}

variable "environment" {
  type    = string
  default = "local"
}
