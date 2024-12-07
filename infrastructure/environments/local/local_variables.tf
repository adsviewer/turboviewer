variable "aws_region" {
  type = string
}

variable "developers" {
  type = map(object({
    stripe_bus = optional(string)
  }))
  default = {
    aaryan = {
    }
    dennis = {
    }
    giorgos = {
      stripe_bus = "aws.partner/stripe.com/ed_test_61Rd3Acj5TrfcW1Wx16Rd35wUILJ1UPPMONDwSKy8TU8"
    }
    lefteris = {
    }
    vlad = {
    }
  }
  description = "List of developers to be added to the team. This should be a list of aws usernames"
}

variable "default_tags" {
  default = {

    Environment = "Local"
    ManagedBy   = "Terraform"
    Project     = "AdsViewer"

  }
  type = map(string)
}

variable "environment" {
  type    = string
  default = "local"
}
