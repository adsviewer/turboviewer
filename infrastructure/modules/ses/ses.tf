data "aws_region" "current" {}

resource "aws_ses_domain_identity" "ses_domain_identity" {
  domain = var.domain
}

resource "aws_ses_domain_dkim" "ses_domain_dkim" {
  domain = aws_ses_domain_identity.ses_domain_identity.domain
}

resource "aws_route53_record" "amazonses_dkim_record" {
  count   = 3
  zone_id = var.zone_id
  name    = "${aws_ses_domain_dkim.ses_domain_dkim.dkim_tokens[count.index]}._domainkey"
  type    = "CNAME"
  ttl     = "600"
  records = ["${aws_ses_domain_dkim.ses_domain_dkim.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.ses_domain_identity.domain
  mail_from_domain = "bounce.${aws_ses_domain_identity.ses_domain_identity.domain}"
}

resource "aws_route53_record" "ses_domain_mail_from_mx" {
  zone_id = var.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "MX"
  ttl     = "600"
  records = ["10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"]
}

resource "aws_route53_record" "ses_domain_mail_from_txt" {
  zone_id = var.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com -all"]
}

data "aws_iam_policy_document" "server_task_role_policy_document" {
  statement {
    actions   = ["ses:SendEmail", "ses:SendTemplatedEmail", "ses:SendRawEmail", "ses:SendBulkTemplatedEmail", "ses:SendBounce"]
    effect    = "Allow"
    resources = [aws_ses_domain_identity.ses_domain_identity.arn]
  }
}

resource "aws_iam_policy" "ses_policy" {
  name   = "${var.environment}-ses-policy"
  policy = data.aws_iam_policy_document.server_task_role_policy_document.json
}

resource "aws_ses_email_identity" "ses_email_identity" {
  email = "hello@${var.domain}"
}
