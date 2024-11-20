###############################################################################
#
# Terraform configuration for Microsoft Entra ID app registration
#
# This module automates the creation of:
#   - app registration (oauth client)
#   - service principal (enterprise application)
#   - app roles
#   - security groups for role-based access control
#
# Key features:
#   - dynamically creates app roles and security groups
#   - assigns users to specific app roles
#   - configures application authentication settings
#
# Resources:
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/data-sources/users
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/application_password
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/group
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/service_principal
#   - https://registry.terraform.io/providers/hashicorp/azuread/latest/docs/resources/app_role_assignment
#
###############################################################################

terraform {
  required_version = ">= 1.7.0, < 2.0.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}



# Data source to retrieve app owners
data "azuread_users" "owners" {
  user_principal_names = var.app_owners
}



# Data source to retrieve user information for role assignments
data "azuread_user" "users" {
  # Flatten and deduplicate user emails across all role assignments
  # Ensures each user is processed only once, even if assigned to multiple roles
  for_each = toset(flatten([
    for role, emails in var.role_assignments : emails
  ]))

  user_principal_name = each.key
}



# Generates unique identifiers for app roles
resource "random_uuid" "app_role" {
  for_each = { for app_role in var.app_roles : app_role.display_name => app_role }
}



# Creates the main Entra ID app registration
resource "azuread_application" "main" {
  # basic application properties
  display_name                   = var.app_name
  fallback_public_client_enabled = var.app_public
  identifier_uris                = var.app_identifier_uris
  owners                         = data.azuread_users.owners.object_ids

  # add a custom logo to the application 👍
  logo_image = filebase64("assets/logo.png")

  api {
    # enables mapped claims for more detailed token information
    mapped_claims_enabled = true

    # specify the access token version (v2 is recommended)
    requested_access_token_version = 2

    # dynamically create OAuth2 permission scopes
    # allows flexible definition of API permissions
    dynamic "oauth2_permission_scope" {
      for_each = var.app_oauth2_permission_scopes

      content {
        id                         = oauth2_permission_scope.value.id
        admin_consent_description  = oauth2_permission_scope.value.admin_consent_description
        admin_consent_display_name = oauth2_permission_scope.value.admin_consent_display_name
        user_consent_description   = oauth2_permission_scope.value.user_consent_description
        user_consent_display_name  = oauth2_permission_scope.value.user_consent_display_name
        value                      = oauth2_permission_scope.value.value
      }
    }
  }

  # dynamically create app roles
  # supports both application and user-level role assignments
  dynamic "app_role" {
    for_each = var.app_roles

    content {
      id = random_uuid.app_role[app_role.value.display_name].result

      allowed_member_types = app_role.value.allowed_member_types
      description          = app_role.value.description
      display_name         = app_role.value.display_name
      value                = app_role.value.value
    }
  }

  # API Permissions (ie: required_resource_access) are used to control access to
  # Azure resources via APIs. They define what actions a user or application can
  # perform on a specific resource.
  dynamic "required_resource_access" {
    for_each = var.app_required_resource_accesses

    content {
      resource_app_id = required_resource_access.value.resource_app_id

      dynamic "resource_access" {
        for_each = required_resource_access.value.resource_accesses

        content {
          id   = resource_access.value.id
          type = resource_access.value.type
        }
      }
    }
  }


  web {
    # define allowed redirect URIs for authentication flows
    redirect_uris = var.app_web_redirect_uris

    implicit_grant {
      # controls access token issuance for web clients
      access_token_issuance_enabled = var.app_web_implicit_grants_access_token_issuance_enabled

      # controls ID token issuance for web clients
      id_token_issuance_enabled = var.app_web_implicit_grants_id_token_issuance_enabled
    }
  }
}



# Create a service principal for the app
# Enables the app to be used for authn/authz
resource "azuread_service_principal" "main" {
  # link this service principal to the app
  client_id = azuread_application.main.client_id

  # inherit the same owners as the app
  owners = azuread_application.main.owners
}



# Generate application passwords.
# Allows for multiple passwords with different names
resource "azuread_application_password" "main" {
  for_each = {
    for app_password in var.app_passwords : app_password => app_password
  }

  application_id = azuread_application.main.id
  display_name   = each.value
  end_date       = "2100-01-01T00:00:00Z"
}



# Create security groups for each application role
# Enables granular role-based access control
resource "azuread_group" "main" {
  for_each = {
    for role in var.app_roles : role.value => role
  }

  display_name     = each.value.group_name
  description      = "Group for users with [${each.key}] role in [${var.app_name}]"
  security_enabled = true

  # inherit the same owners as the app
  owners = azuread_application.main.owners
}



# Assign users to the appropriate security groups based on role
resource "azuread_group_member" "main" {
  for_each = {
    for role_assignment in flatten([
      for role, emails in var.role_assignments : [
        for email in emails : { role = role, email = email }
      ]
    ]) : "${role_assignment.role}:${role_assignment.email}" => role_assignment
  }

  group_object_id  = azuread_group.main[each.value.role].object_id
  member_object_id = data.azuread_user.users[each.value.email].object_id
}



# Assign security groups to corresponding app roles
resource "azuread_app_role_assignment" "main" {
  for_each = {
    for role in var.app_roles : role.value => role
  }

  app_role_id         = azuread_application.main.app_role_ids[each.key]
  principal_object_id = azuread_group.main[each.key].object_id
  resource_object_id  = azuread_service_principal.main.object_id
}
