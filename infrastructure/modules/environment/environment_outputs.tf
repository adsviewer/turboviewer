output "domain_name" {
  value = aws_route53_zone.zone.name
}

output "zone_id" {
  value = aws_route53_zone.zone.id
}

output "zone_name_servers" {
  value = aws_route53_zone.zone.name_servers
}
