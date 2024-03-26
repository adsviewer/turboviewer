output "domain" {
  value = local.domain
}

output "organization_name" {
  value = local.organization
}

output "zone_id" {
  value = module.environment.zone_id
}
