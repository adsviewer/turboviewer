output "database_subnet_ids" {
  value = aws_subnet.database.*.id
}

output "github_role_name" {
  value = aws_iam_role.github_role.name
}

output "public_subnet_ids" {
  value = aws_subnet.public.*.id
}

output "private_subnet_ids" {
  value = aws_subnet.private.*.id
}

output "vpc_id" {
  value = aws_vpc.vpc.id
}
