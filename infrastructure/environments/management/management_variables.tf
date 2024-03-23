variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "default_tags" {
  default = {

    Environment = "Management"
    ManagedBy   = "Terraform"
    Project     = "AdsViewer"

  }
  type = map(string)
}

variable "environment" {
  type    = string
  default = "management"
}
