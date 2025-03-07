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
  app_name            = "Future SIR: Frontend Service Principal (nonprod)"
  app_identifier_uris = ["api://nonprod.future-sir.esdc-edsc.gc.ca/frontend"]
  app_passwords       = ["Default secret"]
  app_public          = true # TODO ::: GjB ::: temporarily enabled to help 'CC' on the power-platform team... disable at a later date
  app_web_redirect_uris = [
    "http://localhost:3000/auth/callback/azuread",
    "https://future-sir-dev.dev-dp-internal.dts-stn.com/auth/callback/azuread",
    "https://future-sir-int.dev-dp-internal.dts-stn.com/auth/callback/azuread",
  ]

  app_owners = [
    "gregory.j.baker@hrsdc-rhdcc.gc.ca",
    "guillaume.liddle@hrsdc-rhdcc.gc.ca",
    "sebastien.comeau@hrsdc-rhdcc.gc.ca",
  ]

  app_required_resource_accesses = [{
    resource_app_id = local.msgraph_api.id

    resource_accesses = [
      {
        id   = local.msgraph_api.roles["User.Read.All"]
        type = "Role",
      },
    ]
  }]

  app_roles = [
    {
      display_name = "Administrator"
      description  = "Administrator"
      group_name   = "Future SIR Administrators (nonprod)"
      id           = "e3aee262-c099-d315-0457-f7857d318dbf"
      value        = "admin"
    },
    {
      display_name = "Tester"
      description  = "Tester"
      group_name   = "Future SIR Tester (nonprod)"
      id           = "cb95be59-f560-4f87-881e-fe0355d9afd8"
      value        = "tester"
    },
    {
      display_name = "User"
      description  = "User"
      group_name   = "Future SIR Users (nonprod)"
      id           = "53ef4c5d-c933-89b1-bfa6-73cd4a497d0a"
      value        = "user"
    }
  ]

  role_assignments = {
    admin = [
      "gregory.j.baker@hrsdc-rhdcc.gc.ca",
      "guillaume.liddle@hrsdc-rhdcc.gc.ca",
      "sebastien.comeau@hrsdc-rhdcc.gc.ca",
    ]
    tester = [
      /* placeholder */
    ]
    user = [
      "dario.au@hrsdc-rhdcc.gc.ca",
      "faiza.jahanzeb@hrsdc-rhdcc.gc.ca",
      "gregory.j.baker@hrsdc-rhdcc.gc.ca",
      "guillaume.liddle@hrsdc-rhdcc.gc.ca",
      "sebastien.comeau@hrsdc-rhdcc.gc.ca",
    ]
  }

  service_principal_group_memberships = ["admin"]
}
