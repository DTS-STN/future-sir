output "app_details" {
  value = {
    name            = azuread_application.main.display_name
    id              = azuread_application.main.id
    client_id       = azuread_application.main.client_id
    identifier_uris = try(flatten(azuread_application.main.identifier_uris), [])
  }
}

output "app_roles" {
  value = [
    for role in azuread_application.main.app_role : {
      name        = role.display_name
      id          = role.id
      value       = role.value
      description = role.description
    }
  ]
}

output "app_secrets" {
  # Note: fetch secrets using `terragrunt output app_secrets`
  value = [for secret in azuread_application_password.main : {
    name       = secret.display_name
    id         = secret.id
    secret     = secret.value
    expires_at = secret.end_date
  }]
  sensitive = true
}

output "security_groups" {
  value = {
    for role, group in azuread_group.main :
    role => {
      name    = group.display_name
      id      = group.id
      members = length(azuread_group_member.main[*])
    }
  }
}

output "service_principal_details" {
  value = {
    name = azuread_service_principal.main.display_name
    id   = azuread_service_principal.main.id
  }
}
