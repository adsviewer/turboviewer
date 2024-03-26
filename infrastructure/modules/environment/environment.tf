data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.42.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}
