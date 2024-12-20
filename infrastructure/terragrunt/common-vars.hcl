# ---------------------------------------------------------------------------------------------------------------------
# COMMON TERRAGRUNT VARIABLES
#
# Variables that are common to all environments.
# Usage: common_vars = read_terragrunt_config(find_in_parent_folders("common-vars.hcl"))
# ---------------------------------------------------------------------------------------------------------------------

locals {
  aad_tenants = {
    "ESDC/EDSC" = {
      domain = "014gc.onmicrosoft.com"
      id     = "9ed55846-8a81-4246-acd8-b1a01abfc0d1"
    }
  }

  external_apis = {
    "Microsoft Graph" = {
      id = "00000003-0000-0000-c000-000000000000"

      roles = {
        # see: https://learn.microsoft.com/en-us/graph/permissions-reference#all-permissions-and-ids
        "Directory.Read.All" = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
        "Group.Read.All"     = "5b567255-7703-4780-807c-7be8301ae99b"
        "User.Read.All"      = "df021288-bdef-4463-88db-98f22de89214"
      }

      scopes = {
        # see: https://learn.microsoft.com/en-us/graph/permissions-reference#all-permissions-and-ids
        "Directory.AccessAsUser.All" = "0e263e50-5827-48a4-b97c-d940288653c7"
        "Directory.Read.All"         = "06da0dbc-49e2-44d2-8312-53f166ab848a"
        "Group.Read.All"             = "5f8c59db-677d-491f-a6b8-5f174b11ec1d"
        "User.Read"                  = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"
        "User.Read.All"              = "a154be20-db9c-4678-8ab7-66f6cc099a59"
        "User.ReadBasic.All"         = "b340eb25-3456-403f-be2f-af7a0d370277"
        # standard OpenID scopes
        "openid"  = "37f7f235-527c-4136-accd-4a02d197296e"
        "email"   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0"
        "profile" = "14dad69e-099b-42c9-810b-d002981feec1"
      }
    }
  }

  tags = {
    "Branch"         = "Innovation, Information and Technology"
    "Classification" = "Protected B / Medium integrity / Medium availability"
    "Department"     = "Employment and Social Development Canada"
    "Directorate"    = "Business Solutions and Information Management"
    "Division"       = "Digital Technology Solutions"
    "IaCToolChain"   = "Terragrunt/Terraform"
    "ProjectName"    = "Future SIR"
    "ProductOwner"   = "Guillaume Liddle <guillaume.liddle@hrsdc-rhdcc.gc.ca>"
    "Purpose"        = "Identity Management"

    # core_it_points_of_contact is required by CloudOps
    "core_it_points_of_contact" = "Greg Baker <gregory.j.baker@hrsdc-rhdcc.gc.ca>; Guillaume Liddle <guillaume.liddle@hrsdc-rhdcc.gc.ca>; Sébastien Comeau <sebastien.comeau@hrsdc-rhdcc.gc.ca>"
  }
}
