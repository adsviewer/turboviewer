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

resource "aws_route53_record" "github_pages" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "_github-pages-challenge-adsviewer"
  type    = "CNAME"
  ttl     = "300"
  records = ["1270166284b655e77717434e2d8714"]
}

resource "aws_route53_record" "github_domain" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "_github-challenge-adsviewer-org"
  type    = "CNAME"
  ttl     = "300"
  records = ["a39e0597d2"]
}

resource "aws_route53_record" "google_dkim" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "google._domainkey"
  type    = "TXT"
  ttl     = "300"
  records = [
    "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlUCgdzxGAoTZBIlDhfq9EzVhmx3dataG70JQnvn98gV3HQg1z3sWkVpoP6HZlnJIrpn7WbB8GBwgvaGowJDKRiFsmaluPe4R+iHV5Ar/7IdKUA1WY/eM+1Vg8Ou12TXzgxniEBRD1LDh8D8Vyo1eRKsL1xi2HSBtWDN/jE3yYjKapXimdkTfvLP7lE9EXNgn\"\"ePn9J76CSzld7/wRJwJgcqHPA/+YxxEOZMp8N10izNQnEkDrWt2IoWMA5YMm10Cm9L6e2KWnPYwfjdn0a3EJQAbmaZ4OX9EWinxIWUh4IWMhqkVA+buH+cKHXume2pJ1qqLD+ZLjCKsfEQPbrVStowIDAQAB"
  ]
}

resource "aws_route53_record" "google_verification" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = ""
  type    = "TXT"
  ttl     = "300"
  records = [
    "v=spf1 include:_spf.google.com ~all",
    "tiktok-developers-site-verification=jXaq05M1uPB5S5GMgUus2mGxzv5siSYu"
  ]
}

resource "aws_route53_record" "dmarc" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = "_dmarc"
  type    = "TXT"
  ttl     = "300"
  records = [
    "v=DMARC1;p=quarantine;rua=mailto:tech@adsviewer.io;pct=100"
  ]
}
