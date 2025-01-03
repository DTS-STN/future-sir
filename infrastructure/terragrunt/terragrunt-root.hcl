# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT BASE CONFIGURATION
#
# Terragrunt is a thin wrapper for Terraform that provides extra tools for working with multiple
# Terraform modules, remote state, and locking: https://github.com/gruntwork-io/terragrunt
# ---------------------------------------------------------------------------------------------------------------------

locals {
  common_vars   = read_terragrunt_config(find_in_parent_folders("common-vars.hcl"))
  env_vars      = read_terragrunt_config(find_in_parent_folders("env-vars.hcl"))
  merged_config = merge(local.common_vars.locals, local.env_vars.locals)
}

# ---------------------------------------------------------------------------------------------------------------------
# GLOBAL RESOURCES
#
# These resources are used by all environments in this project.
# ---------------------------------------------------------------------------------------------------------------------

remote_state {
  backend = "azurerm"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }

  config = {
    container_name       = "terraform-state"
    key                  = "${path_relative_to_include("root")}.tfstate"
    resource_group_name  = "${local.env_vars.locals.backend_resource_group_name}"
    storage_account_name = "${local.env_vars.locals.backend_storage_account_name}"
    subscription_id      = "${local.env_vars.locals.backend_subscription_id}"
  }
}
