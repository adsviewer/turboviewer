# Data block to fetch the SSO admin instance. Once you enabled SSO admin from console, you need data block to fetch this in your code.
data "aws_ssoadmin_instances" "this" {}



############################## Users,Group,Group's Membership #########################################
resource "aws_identitystore_user" "giorgos" {
  display_name      = "Giorgos Trichopoulos"
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  name {
    given_name  = "Giorgos"
    family_name = "Trichopoulos"
  }
  user_name = "giorgos"

  emails {
    value = "giorgos@adsviewer.io"
  }
}
resource "aws_identitystore_group_membership" "giorgos_prod_admin" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.prod_admin_group.group_id
  member_id         = aws_identitystore_user.giorgos.user_id
}
resource "aws_identitystore_group_membership" "giorgos_developer" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.developers.group_id
  member_id         = aws_identitystore_user.giorgos.user_id
}
resource "aws_identitystore_group_membership" "giorgos_managment_admin" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.management_admin_group.group_id
  member_id         = aws_identitystore_user.giorgos.user_id
}


resource "aws_identitystore_user" "dennis" {
  display_name      = "Dennis Kreeft"
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  name {
    given_name  = "Dennis"
    family_name = "Kreeft"
  }
  user_name = "dennis"

  emails {
    value = "dennis@adsviewer.io"
  }
}
resource "aws_identitystore_group_membership" "dennis_business" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.business_users.group_id
  member_id         = aws_identitystore_user.dennis.user_id
}
resource "aws_identitystore_group_membership" "dennis_developer" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.developers.group_id
  member_id         = aws_identitystore_user.dennis.user_id
}


resource "aws_identitystore_user" "lefteris" {
  display_name      = "Lefteris Hytiroglou"
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  name {
    given_name  = "Lefteris"
    family_name = "Hytiroglou"
  }
  user_name = "lefteris"

  emails {
    value = "lehy64@gmail.com"
  }
}
resource "aws_identitystore_group_membership" "lefteris_developer" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.developers.group_id
  member_id         = aws_identitystore_user.lefteris.user_id
}

resource "aws_identitystore_user" "aaryan" {
  display_name      = "Aaryan Sinha"
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  name {
    given_name  = "Aaryan"
    family_name = "Sinha"
  }
  user_name = "aaryan"

  emails {
    value = "aaryansinha16@gmail.com"
  }
}
resource "aws_identitystore_group_membership" "aaryan_developer" {
  identity_store_id = tolist(data.aws_ssoadmin_instances.this.identity_store_ids)[0]
  group_id          = aws_identitystore_group.developers.group_id
  member_id         = aws_identitystore_user.aaryan.user_id
}
