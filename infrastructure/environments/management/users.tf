# Data block to fetch the SSO admin instance. Once you enabled SSO admin from console, you need data block to fetch this in your code.
data "aws_ssoadmin_instances" "this" {}



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


####################### Group Membership ############################################
# Create Group Membership for the user
resource "aws_identitystore_group_membership" "giorgos_prod_admin" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.prod_admin_group.group_id
  member_id         = aws_identitystore_user.giorgos.user_id
}
resource "aws_identitystore_group_membership" "giorgos_managment_admin" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.management_admin_group.group_id
  member_id         = aws_identitystore_user.giorgos.user_id
}
