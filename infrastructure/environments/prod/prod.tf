locals {
  organization = "adsviewer"
}

data "aws_caller_identity" "current" {}

terraform {
  cloud {
    organization = "adsviewer"
    workspaces {
      name = "prod"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.42.0"
    }
  }

  required_version = ">= 1.6.6"
}

data "tfe_outputs" "management_outputs" {
  organization = local.organization
  workspace    = "management"
}

provider "aws" {
  assume_role {
    role_arn = data.tfe_outputs.management_outputs.values.prod_assume_role_arn
  }
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

module "workspace" {
  source = "../../modules/workspace"

  base_tags    = var.default_tags
  environment  = var.environment
  organization = local.organization
}
