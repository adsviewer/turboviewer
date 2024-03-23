output "prod_assume_role_arn" {
  sensitive = true
  value     = "arn:aws:iam::${aws_organizations_account.prod.id}:role/${local.prod_assume_role}"
}
