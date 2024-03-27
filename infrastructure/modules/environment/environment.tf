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

module "ses" {
  source      = "../../modules/ses"
  domain      = aws_route53_zone.zone.name
  environment = var.environment
  zone_id     = aws_route53_zone.zone.zone_id
}

module "server" {
  source          = "../service"
  certificate_arn = "" // aws_acm_certificate.wildcard.arn
  domain_name     = aws_route53_zone.zone.name
  domain_zone_id  = aws_route53_zone.zone.id
  environment     = var.environment
  environment_variables = {
    API_ENDPOINT = "https://api.${local.domain}/${local.api_path}"
    PORT         = 4000,
    PUBLIC_URL   = local.full_domain
  }
  github_role_name   = var.github_role_name
  mapped_secrets     = local.server_secrets
  route53_endpoint   = "api"
  secrets            = []
  service_name       = "server"
  service_subnet_ids = var.service_subnet_ids
  task_role_policies = {
    "ses" = module.ses.send_email_policy_arn
  }
  vpc_id = var.vpc_id
}
