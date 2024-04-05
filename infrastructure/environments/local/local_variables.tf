variable "aws_region" {
  type = string
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
