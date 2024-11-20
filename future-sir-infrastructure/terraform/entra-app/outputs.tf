output "application_details" {
  description = "Comprehensive details about the registered Entra ID app."
  value = {
    app_name        = var.app_name
    client_id       = azuread_application.main.client_id
    object_id       = azuread_application.main.object_id
    identifier_uris = try(flatten(azuread_application.main.identifier_uris), [])
  }
}

output "client_id" {
  description = "The unique identifier (client ID) for the app, used in authentication configurations."
  value       = azuread_application.main.client_id
}

output "client_secrets" {
  # Note: fetch secrets using `terragrunt output client_secrets`
  description = "App client secrets with their names, values, and expiration dates."
  value = [for secret in azuread_application_password.main : {
    name       = secret.display_name
    secret     = secret.value
    expires_at = secret.end_date
  }]
  sensitive = true
}

# output "service_principal_details" {
#   description = "Details of the service principal associated with the app."
#   value = {
#     object_id    = azuread_service_principal.main.object_id
#     client_id    = azuread_service_principal.main.client_id
#     display_name = azuread_service_principal.main.display_name
#   }
# }

# output "role_groups" {
#   description = "Security groups created for each app role with their object IDs."
#   value = {
#     for role, group in azuread_group.main :
#     role => {
#       group_name    = group.display_name
#       group_id      = group.id
#       group_members = length(azuread_group_member.main[*]) # Count of assigned members
#     }
#   }
# }

output "app_roles" {
  description = "Defined app roles with their details."
  value = [
    for role in azuread_application.main.app_role : {
      id           = role.id
      display_name = role.display_name
      value        = role.value
      description  = role.description
    }
  ]
}
