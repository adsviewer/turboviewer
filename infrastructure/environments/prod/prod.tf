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
      version = "~> 5.58.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.12.0"
    }
    awscc = {
      source  = "hashicorp/awscc"
      version = "0.77.0"
    }
  }

  required_version = ">= 1.9.2"
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

provider "awscc" {
  assume_role = {
    role_arn = data.tfe_outputs.management_outputs.values.prod_assume_role_arn
  }
  region = var.aws_region
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

  amplify_token               = var.amplify_token
  domain                      = local.domain
  environment                 = var.environment
  emailable_api_key           = var.emailable_api_key
  fb_application_id           = var.fb_application_id
  fb_application_secret       = var.fb_application_secret
  google_application_id       = var.google_application_id
  google_application_secret   = var.google_application_secret
  linkedin_application_id     = var.linkedin_application_id
  linkedin_application_secret = var.linkedin_application_secret
  git_repository              = local.git_repository
  github_role_name            = module.workspace.github_role_name
  organization                = local.organization
  redis_url                   = var.redis_url
  service_subnet_ids          = module.workspace.private_subnet_ids
  slack_webhook_url           = var.slack_webhook_url
  slack_workspace_id          = var.slack_workspace_id
  vercel_api_token            = var.vercel_api_token
  vercel_team                 = var.vercel_team
  vpc_id                      = module.workspace.vpc_id
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team
}
