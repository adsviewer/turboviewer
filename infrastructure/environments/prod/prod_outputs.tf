output "domain" {
  value = local.domain
}

output "git_repository" {
  value = local.git_repository
}

output "zone_id" {
  value = module.environment.zone_id
}
