########################### Groups #################################################
# Create Group
resource "aws_identitystore_group" "prod_admin_group" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  display_name      = "ProdAdministrators"
  description       = "Admin rights for Production Account"
}

resource "aws_identitystore_group" "management_admin_group" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  display_name      = "ManagementAdministrators"
  description       = "Admin rights for Production Account"
}

resource "aws_identitystore_group" "business_users" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  display_name      = "BusinessUsers"
  description       = "Read only rights for Production Account"
}

resource "aws_identitystore_group" "developers" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  display_name      = "Developers"
  description       = "Read rights to everything in production account, admin access in dev accounts"
}


##################### Permission Sets #######################################

resource "aws_ssoadmin_permission_set" "admin" {
  name             = "AdministratorAccess"
  instance_arn     = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  session_duration = "PT12H"
}

resource "aws_ssoadmin_managed_policy_attachment" "admin_policy_attachment" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
  permission_set_arn = aws_ssoadmin_permission_set.admin.arn
}

resource "aws_ssoadmin_permission_set" "read_only" {
  name             = "ReadOnlyAccess"
  instance_arn     = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  session_duration = "PT12H"
}

resource "aws_ssoadmin_managed_policy_attachment" "read_only_policy_attachment" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
  permission_set_arn = aws_ssoadmin_permission_set.read_only.arn
}


########################## AWS Account/OU Assignment ###################################


# Create Account Assignment to the group with Custom permission sets  --> Production Account
resource "aws_ssoadmin_account_assignment" "prod_admin" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  permission_set_arn = aws_ssoadmin_permission_set.admin.arn # Custom Permission set

  principal_id   = aws_identitystore_group.prod_admin_group.group_id # Group
  principal_type = "GROUP"

  target_id   = aws_organizations_account.prod.id # Production Account
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_account_assignment" "prod_developers" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  permission_set_arn = aws_ssoadmin_permission_set.read_only.arn # Custom Permission set

  principal_id   = aws_identitystore_group.developers.group_id # Group
  principal_type = "GROUP"

  target_id   = aws_organizations_account.prod.id # Production Account
  target_type = "AWS_ACCOUNT"
}

resource "aws_ssoadmin_account_assignment" "management_admin" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
  permission_set_arn = aws_ssoadmin_permission_set.admin.arn # Custom Permission set

  principal_id   = aws_identitystore_group.management_admin_group.group_id # Group
  principal_type = "GROUP"

  target_id   = data.aws_caller_identity.current.account_id # Production Account
  target_type = "AWS_ACCOUNT"
}
