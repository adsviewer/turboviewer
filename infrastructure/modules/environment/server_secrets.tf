locals {
  server_secrets_map = {
    "emailable_api_key" : var.emailable_api_key
    "exchange_rates_api_key" : var.exchange_rates_api_key
    "fb_application_id" : var.fb_application_id, "fb_application_secret" : var.fb_application_secret,
    "linkedin_application_id" : var.linkedin_application_id,
    "linkedin_application_secret" : var.linkedin_application_secret,
    "redis_url" : var.redis_url, "slack_webhook_url_errors" : var.slack_webhook_url_errors,
    "slack_webhook_url_public_feedback" : var.slack_webhook_url_public_feedback,
    "google_application_id" : var.google_application_id, "google_application_secret" : var.google_application_secret,
    "tiktok_application_id" : var.tiktok_application_id, "tiktok_application_secret" : var.tiktok_application_secret
  }
}

resource "aws_ssm_parameter" "auth_secret" {
  name  = "/${var.environment}/server/auth_secret"
  type  = "SecureString"
  value = random_string.auth_secret_random_string.result
}

resource "random_string" "auth_secret_random_string" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "refresh_secret" {
  name  = "/${var.environment}/server/refresh_secret"
  type  = "SecureString"
  value = random_string.refresh_secret_random_string.result
}

resource "random_string" "refresh_secret_random_string" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "channel_secret" {
  name  = "/${var.environment}/server/channel_secret"
  type  = "SecureString"
  value = random_string.channel_secret_random_string.result
}

resource "random_string" "channel_secret_random_string" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.environment}/server/database_url"
  type  = "SecureString"
  value = "fill_me_in"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "database_ro_url" {
  name  = "/${var.environment}/server/database_ro_url"
  type  = "SecureString"
  value = "fill_me_in"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "server_secrets" {
  for_each = local.server_secrets_map
  name     = "/${var.environment}/server/${each.key}"
  type     = "SecureString"
  value    = each.value
}

locals {
  common_secrets = {
    AUTH_SECRET    = aws_ssm_parameter.auth_secret
    REFRESH_SECRET = aws_ssm_parameter.refresh_secret
  }

  server_secrets = merge({
    for k, v in local.common_secrets : k => v.arn
    }, {
    for k, v in aws_ssm_parameter.server_secrets : upper(k) => v.arn
    }, {
    CHANNEL_SECRET  = aws_ssm_parameter.channel_secret.arn
    DATABASE_URL    = aws_ssm_parameter.database_url.arn
    DATABASE_RO_URL = aws_ssm_parameter.database_ro_url.arn
  })

  fe_environment_variables = merge({
    for k, v in local.common_secrets : k => v.value
    }, {
    GRAPHQL_ENDPOINT = local.graphql_endpoint
    PUBLIC_ENDPOINT  = local.full_domain
  })
}
