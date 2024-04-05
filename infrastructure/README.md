# Infrastructure

Deploying infrastructure is done using Terraform. The Terraform configuration is located in the `infrastructure`
directory. The deployment is done through terraform cloud. The `infrastructure` folder has two main
directories: `modules` and `environments`. The `modules` directory contains the reusable modules, while
the `environments` directory contains the environments that are deployed. `prod` is the production, `local` contains all
the necessary infrastructure to run the application locally.
Lastly the `management` directory contains the infrastructure for the management of all the aws accounts and users.

## Prerequisites

- install [terraform-cli](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) if you have
  not already
- run `terraform login`

## Flow

- create a branch
- change something in the `infrastructure/**/*` directory
- (optionally) run `terraform plan` to see the changes
- push
- create a pull request targeting `main`
- you should see a check from terraform cloud in the pull request. By opening it you will be redirected to terrafrom
  where you will see the plan along with any cost changes.
- merge the pull request. Changes will be applied automatically.

This is a "with great power comes great responsibility" flow. Be careful when changing infrastructure.
