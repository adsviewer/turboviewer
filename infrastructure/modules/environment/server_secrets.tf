locals {
  server_secrets_map = {
    "fb_application_id" : var.fb_application_id, "fb_application_secret" : var.fb_application_secret
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

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.environment}/server/database_url"
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
    DATABASE_URL = aws_ssm_parameter.database_url.arn
  })

  fe_environment_variables = merge({
    for k, v in local.common_secrets : k => v.value
    }, {
    NEXT_PUBLIC_GRAPHQL_ENDPOINT = local.graphql_endpoint
    NEXT_PUBLIC_ENDPOINT         = local.full_domain
  })
}
