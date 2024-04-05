output "prod_assume_role_arn" {
  sensitive = true
  value     = "arn:aws:iam::${aws_organizations_account.prod.id}:role/${local.prod_assume_role}"
}

output "dev_assume_role_arn" {
  sensitive = true
  value     = "arn:aws:iam::${aws_organizations_account.dev.id}:role/${local.dev_assume_role}"
}
