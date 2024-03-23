locals {
  organization       = "adsviewer"
  organization_short = "av"
  prod_assume_role   = "ProdAdminRoleAssumedByManagement"
}

data "aws_caller_identity" "current" {}

terraform {
  cloud {
    organization = "adsviewer"
    workspaces {
      name = "management"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.42.0"
    }
  }

  required_version = ">= 1.6.6"
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

module "iam" {
  source = "../../modules/iam"

  environment  = var.environment
  organization = local.organization
}

resource "aws_organizations_organization" "org" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "sso.amazonaws.com"
  ]

  feature_set = "ALL"
}

resource "aws_organizations_account" "prod" {
  name      = "production account"
  email     = "prod-aws@adsviewer.io"
  role_name = local.prod_assume_role
}

# Data block to fetch the SSO admin instance. Once you enabled SSO admin from console, you need data block to fetch this in your code.

data "aws_ssoadmin_instances" "this" {}
#data "aws_organizations_organization" "this" {}



############################## Users,Group,Group's Membership #########################################
# Create SSO user1
resource "aws_identitystore_user" "giorgos" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]

  display_name = "Giorgos Trichopoulos"
  user_name    = "giorgos"

  name {
    given_name  = "Giorgos"
    family_name = "Trichopoulos"
  }

  emails {
    value = "giorgos@adsviewer.io"
  }
}


############################ Groups #################################################
## Create Group
#resource "aws_identitystore_group" "prod_admin_group" {
#  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
#  display_name      = "ProdAdministrators"
#  description       = "Admin rights for Production Account"
#}
#
#resource "aws_identitystore_group" "management_admin_group" {
#  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
#  display_name      = "ProdAdministrators"
#  description       = "Admin rights for Production Account"
#}
#
#
######################## Group Membership ############################################
## Create Group Membership for the user
#resource "aws_identitystore_group_membership" "giorgos_prod_admin" {
#  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
#  group_id          = aws_identitystore_group.prod_admin_group.group_id
#  member_id         = aws_identitystore_user.giorgos.user_id
#}
#resource "aws_identitystore_group_membership" "giorgos_managment_admin" {
#  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
#  group_id          = aws_identitystore_group.management_admin_group.group_id
#  member_id         = aws_identitystore_user.giorgos.user_id
#}
#
###################### Permission Sets #######################################
#
## Create Custom Permission Set for S3 Read only
#resource "aws_ssoadmin_permission_set" "admin" {
#  name         = "AdministratorAccess"
#  instance_arn = tolist(data.aws_ssoadmin_instances.this.arns)[0]
#}
#
#resource "aws_ssoadmin_managed_policy_attachment" "admin_policy_attachment" {
#  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
#  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
#  permission_set_arn = aws_ssoadmin_permission_set.admin.arn
#}
#
#
########################### AWS Account/OU Assignment ###################################
#
#
## Create Account Assignment to the group with Custom permission sets  --> Production Account
#resource "aws_ssoadmin_account_assignment" "prod_admin" {
#  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
#  permission_set_arn = aws_ssoadmin_permission_set.admin.arn # Custom Permission set
#
#  principal_id   = aws_identitystore_group.prod_admin_group.group_id # Group
#  principal_type = "GROUP"
#
#  target_id   = aws_organizations_account.prod.id   # Production Account
#  target_type = "AWS_ACCOUNT"
#  # target_type = "AWS_OU"      #incase you want to target OU.
#}
#
#resource "aws_ssoadmin_account_assignment" "management_admin" {
#  instance_arn       = tolist(data.aws_ssoadmin_instances.this.arns)[0]
#  permission_set_arn = aws_ssoadmin_permission_set.admin.arn # Custom Permission set
#
#  principal_id   = aws_identitystore_group.management_admin_group.group_id # Group
#  principal_type = "GROUP"
#
#  target_id   = data.aws_caller_identity.current.account_id   # Production Account
#  target_type = "AWS_ACCOUNT"
#  # target_type = "AWS_OU"      #incase you want to target OU.
#}


# Bonus Tips: if you already created permission sets in AWS Console, you can retreive
# the permission sets and refer into your Account Assignment resource block.here is the data block for your ref.
# Feel free to use it for another account or OU.

# Create Permission set READOnly Access data block
# data "aws_ssoadmin_permission_set" "permissionset" {
# instance_arn = tolist(data.aws_ssoadmin_instances.example.arns)[0]
# name         = "ViewOnlyAccess"
# }

# Create Permission set system Admin Access data block
# data "aws_ssoadmin_permission_set" "permissionset" {
# instance_arn = tolist(data.aws_ssoadmin_instances.example.arns)[0]
# name         = "SystemAdministrator"
# }
