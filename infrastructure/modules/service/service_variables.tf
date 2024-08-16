variable "environment" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "service_subnet_ids" {
  type = list(string)
}

variable "service_name" {
  type = string
}

variable "service_parameters_access_policy_arn" {
  type = string
}

variable "certificate_arn" {
  type = string
}

variable "domain_zone_id" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "domain_prefix" {
  type = string
}

variable "github_role_name" {
  type = string
}

variable "mapped_secrets" {
  type    = map(string)
  default = {}
}

variable "instance_role_policies" {
  type = map(string)
}

variable "vpc_id" {
  type = string
}
