module "tiktok" {
  source           = "../../modules/tiktok"
  environment      = var.environment
  github_role_name = var.github_role_name
}
