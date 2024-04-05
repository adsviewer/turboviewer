locals {
  api_path         = "api"
  graphql_path     = "graphql"
  prefix           = "app"
  full_domain      = "https://${local.prefix}.${local.domain}"
  graphql_endpoint = "https://${local.api_path}.${local.domain}/${local.graphql_path}"
}

###### Vercel ######
resource "vercel_project" "frontend" {
  build_command = "turbo run build --filter=web"
  environment = [
    for k, v in local.fe_environment_variables : {
      key    = k
      value  = v
      target = ["production", "preview", "development"]
    }
  ]
  framework = "nextjs"
  git_repository = {
    repo = var.git_repository
    type = "github"
  }
  name                       = "${var.environment}-webapp"
  root_directory             = "apps/web"
  serverless_function_region = var.vercel_region[data.aws_region.current.name]
}

resource "vercel_project_domain" "frontend_domain" {
  project_id = vercel_project.frontend.id
  domain     = "${local.prefix}.${local.domain}"
}

resource "aws_route53_record" "frontend_domain_record" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone.zone_id
  name    = local.prefix
  type    = "CNAME"
  ttl     = "300"
  records = ["cname.vercel-dns.com."]
}
