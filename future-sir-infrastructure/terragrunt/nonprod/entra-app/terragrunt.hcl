# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT NONPROD CONFIGURATION
# ---------------------------------------------------------------------------------------------------------------------

terraform {
  source = "../../../terraform//entra-app"
}

include "root" {
  path = "../../terragrunt-root.hcl"
}

locals {
  common_vars = read_terragrunt_config("../env-vars.hcl").locals.common_vars
  msgraph_api = local.common_vars.locals.external_apis["Microsoft Graph"]
}

inputs = {
  app_name            = "Future SIR: Service Principal (nonprod)"
  app_identifier_uris = ["api://nonprod.future-sir.esdc-edsc.gc.ca/frontend"]
  app_passwords       = ["Default secret"]
  app_web_redirect_uris = [
    "http://localhost:3000/auth/callback/azuread",
    "https://future-sir-dev.dev-dp-internal.dts-stn.com/auth/callback/azuread"
  ]

  app_owners = [
    "gregory.j.baker@hrsdc-rhdcc.gc.ca",
    "guillaume.liddle@hrsdc-rhdcc.gc.ca",
    "sebastien.comeau@hrsdc-rhdcc.gc.ca",
  ]

  app_required_resource_accesses = [{
    resource_app_id = local.msgraph_api.id

    resource_accesses = [
      { type = "Role", id = local.msgraph_api.roles["User.Read.All"] },
    ]
  }]

  app_roles = [{
    display_name = "Administrator"
    description  = "Administrator"
    group_name   = "Future SIR Administrators (nonprod)"
    value        = "admin"
  }]

  role_assignments = {
    admin = [
      "gregory.j.baker@hrsdc-rhdcc.gc.ca",
      "guillaume.liddle@hrsdc-rhdcc.gc.ca",
      "sebastien.comeau@hrsdc-rhdcc.gc.ca",
    ]
  }
}
