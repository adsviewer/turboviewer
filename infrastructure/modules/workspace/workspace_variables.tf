variable "base_tags" {
  type = map(string)
}

variable "environment" {
  type = string
}

variable "multi_nat" {
  type    = bool
  default = false
}

variable "organization" {
  type = string
}

variable "project" {
  type    = string
  default = "Default Project"
}
