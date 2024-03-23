locals {
  organization       = "adsviewer"
  organization_short = "av"
  prod_assume_role   = "ProdAdminRoleAssumedByManagement"
}

data "aws_caller_identity" "current" {}

terraform {
  cloud {
    organization = "adsviewer"
    workspaces {
      name = "management"
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

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

module "iam" {
  source = "../../modules/iam"

  environment  = var.environment
  organization = local.organization
}

resource "aws_organizations_organization" "org" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "sso.amazonaws.com"
  ]

  feature_set = "ALL"
}

resource "aws_organizations_account" "prod" {
  name      = "production account"
  email     = "prod-aws@adsviewer.io"
  role_name = local.prod_assume_role
}
