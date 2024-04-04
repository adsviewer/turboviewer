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

locals {

  common_secrets = {
    AUTH_SECRET    = aws_ssm_parameter.auth_secret.arn
    REFRESH_SECRET = aws_ssm_parameter.refresh_secret.arn
  }

  server_secrets = merge(local.common_secrets, {
    DATABASE_URL = aws_ssm_parameter.database_url.arn
  })

  fe_secrets = merge(local.common_secrets, {
    NEXT_PUBLIC_GRAPHQL_ENDPOINT = local.graphql_endpoint
    NEXT_PUBLIC_ENDPOINT         = local.full_domain
  })
}
