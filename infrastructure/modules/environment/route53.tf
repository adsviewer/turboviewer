locals {
  domain = var.environment == "prod" ? var.domain : "${var.environment}.${var.domain}"
}

resource "aws_route53_zone" "zone" {
  name          = local.domain
  force_destroy = var.environment != "prod" ? true : false
}

#resource "aws_acm_certificate" "wildcard" {
#  domain_name               = local.domain
#  validation_method         = "DNS"
#  subject_alternative_names = ["*.${local.domain}", local.domain]
#}
#
#resource "aws_route53_record" "wildcard_records" {
#  for_each = {
#    for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
#      name   = dvo.resource_record_name
#      record = dvo.resource_record_value
#      type   = dvo.resource_record_type
#    }
#  }
#
#  allow_overwrite = true
#  name            = each.value.name
#  records         = [each.value.record]
#  ttl             = 60
#  type            = each.value.type
#  zone_id         = aws_route53_zone.zone.zone_id
#}
#
#resource "aws_acm_certificate_validation" "wildcard_validation" {
#  certificate_arn         = aws_acm_certificate.wildcard.arn
#  validation_record_fqdns = [for record in aws_route53_record.wildcard_records : record.fqdn]
#}
