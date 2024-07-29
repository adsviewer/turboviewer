locals {
  organization   = "adsviewer"
  domain         = "${var.environment}.${data.tfe_outputs.prod_outputs.values.domain}"
  git_repository = "${local.organization}/turboviewer"
}

data "aws_caller_identity" "current" {}

terraform {
  cloud {
    organization = "adsviewer"
    workspaces {
      name = "local"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.58.0"
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
    role_arn = data.tfe_outputs.management_outputs.values.dev_assume_role_arn
  }
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

data "tfe_outputs" "prod_outputs" {
  organization = local.organization
  workspace    = "prod"
}

provider "aws" {
  alias = "prod"

  assume_role {
    role_arn = data.tfe_outputs.management_outputs.values.prod_assume_role_arn
  }
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}
resource "aws_acm_certificate" "wildcard" {
  domain_name               = local.domain
  validation_method         = "DNS"
  subject_alternative_names = ["*.${local.domain}", local.domain]
}

resource "aws_route53_zone" "zone" {
  name = local.domain
}

resource "aws_route53_record" "nameservers_to_parent" {
  count    = var.environment != "prod" ? 1 : 0
  provider = aws.prod
  zone_id  = data.tfe_outputs.prod_outputs.values.zone_id
  name     = var.environment
  type     = "NS"
  ttl      = "172800"
  records  = aws_route53_zone.zone.name_servers
}

resource "aws_route53_record" "wildcard_records" {
  for_each = {
    for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.zone.zone_id
}

resource "aws_acm_certificate_validation" "wildcard_validation" {
  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.wildcard_records : record.fqdn]
}

module "ses" {
  source      = "../../modules/ses"
  domain      = aws_route53_zone.zone.name
  environment = var.environment
  zone_id     = aws_route53_zone.zone.zone_id
}

resource "aws_s3_bucket" "local_bucket" {
  bucket        = "${var.environment}-${local.organization}"
  force_destroy = var.environment == "prod" ? false : true
}

module "workspace" {
  source = "../../modules/workspace"

  base_tags      = var.default_tags
  environment    = var.environment
  git_repository = local.git_repository
  organization   = local.organization
}

module "environment_potentially_local" {
  for_each = var.developers
  source   = "../../modules/environment_potentially_local"

  channel_ingress_lambda_name = "not_applicable"
  channel_report_lambda_name  = "not_applicable"
  environment                 = "${var.environment}-${each.key}"
}
