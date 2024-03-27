locals {
  domain = var.environment == "prod" ? var.domain : "${var.environment}.${var.domain}"
}

resource "aws_route53_zone" "zone" {
  name          = local.domain
  force_destroy = var.environment != "prod" ? true : false
}

resource "aws_acm_certificate" "wildcard" {
  provider                  = aws.us_east_1
  domain_name               = local.domain
  validation_method         = "DNS"
  subject_alternative_names = ["*.${local.domain}", local.domain]
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
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.wildcard_records : record.fqdn]
}

resource "aws_route53_record" "website_a" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = ""
  type    = "A"
  ttl     = "300"
  records = ["168.119.246.178"]
}

resource "aws_route53_record" "website_www" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "www"
  type    = "CNAME"
  ttl     = "300"
  records = ["adsviewer.io."]
}

resource "aws_route53_record" "fivetran" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "fivetran"
  type    = "A"
  ttl     = "300"
  records = ["168.119.246.178"]
}

resource "aws_route53_record" "domain_connect" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "_domainconnect"
  type    = "CNAME"
  ttl     = "300"
  records = ["_domainconnect.gd.domaincontrol.com."]
}

resource "aws_route53_record" "mx" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = ""
  type    = "MX"
  ttl     = "1800"
  records = [
    "1 aspmx.l.google.com", "5 alt1.aspmx.l.google.com", "5 alt2.aspmx.l.google.com", "10 alt3.aspmx.l.google.com",
    "10 alt4.aspmx.l.google.com"
  ]
}

