resource "aws_ssm_parameter" "auth_secret" {
  name  = "/${var.environment}/server/auth_secret"
  type  = "SecureString"
  value = random_string.auth_secret_random_string.result
}

resource "random_string" "auth_secret_random_string" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.environment}/server/database_url"
  type  = "SecureString"
  value = "fill_me_in"
}

locals {
  server_secrets = [
    {
      name      = "AUTH_SECRET"
      valueFrom = aws_ssm_parameter.auth_secret.arn
    },
    {
      name      = "DATABASE_URL"
      valueFrom = aws_ssm_parameter.database_url.arn
    },
  ]
}
