locals {
  organization   = "adsviewer"
  domain         = "adsviewer.io"
  git_repository = "${local.organization}/turboviewer"
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

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  assume_role {
    role_arn = data.tfe_outputs.management_outputs.values.prod_assume_role_arn
  }
  default_tags {
    tags = var.default_tags
  }
}

module "workspace" {
  source = "../../modules/workspace"

  base_tags      = var.default_tags
  environment    = var.environment
  git_repository = local.git_repository
  organization   = local.organization
}

module "environment" {
  source = "../../modules/environment"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  amplify_token      = var.amplify_token
  domain             = local.domain
  environment        = var.environment
  git_repository     = local.git_repository
  github_role_name   = module.workspace.github_role_name
  organization       = local.organization
  service_subnet_ids = module.workspace.private_subnet_ids
  vpc_id             = module.workspace.vpc_id
  slack_webhook_url  = var.slack_webhook_url
  vercel_api_token   = var.vercel_api_token
  vercel_team        = var.vercel_team
}
