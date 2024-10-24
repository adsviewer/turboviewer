locals {
  organization     = "adsviewer"
  prod_assume_role = "ProdAdminRoleAssumedByManagement"
  dev_assume_role  = "DevAdminRoleAssumedByManagement"
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
      version = "~> 5.72.1"
    }
  }

  required_version = ">= 1.9.2"
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

resource "aws_organizations_organization" "org" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "sso.amazonaws.com"
  ]

  feature_set = "ALL"
}

resource "aws_organizations_organizational_unit" "workload" {
  name      = "workload"
  parent_id = aws_organizations_organization.org.roots[0].id
}

resource "aws_organizations_account" "prod" {
  name      = "production account"
  email     = "prod-aws@adsviewer.io"
  role_name = local.prod_assume_role
  parent_id = aws_organizations_organizational_unit.workload.id
}

resource "aws_organizations_account" "dev" {
  name      = "development account"
  email     = "dev-aws@adsviewer.io"
  role_name = local.dev_assume_role
  parent_id = aws_organizations_organizational_unit.workload.id
}
