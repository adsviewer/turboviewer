module "reports" {
  source           = "../reports"
  environment      = var.environment
  github_role_name = var.github_role_name
}
