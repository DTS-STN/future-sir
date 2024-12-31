variable "app_name" {
  type        = string
  description = "The name to use for this Entra ID app."
}

variable "app_owners" {
  description = "User principal names (ie: email addresses) of users who own Entra ID app."
  type        = set(string)
  default     = []
}

variable "app_public" {
  description = "Specifies whether the app is a public client. Enable for apps using token grant flows without a redirect URI (e.g., mobile or desktop apps)."
  type        = bool
  default     = false
}

variable "app_identifier_uris" {
  description = "A set of unique URIs that identify this app within the Entra ID tenant."
  type        = set(string)
  default     = null
}

variable "app_oauth2_permission_scopes" {
  description = "Delegated permissions exposed by the web API, defining how other app can interact with this app."
  type = set(object({
    id                         = string # The unique identifier of the delegated permission. Must be a valid UUID.
    admin_consent_display_name = string # Display name for the delegated permission, intended to be read by an administrator granting the permission on behalf of all users.
    admin_consent_description  = string # Delegated permission description that appears in all tenant-wide admin consent experiences, intended to be read by an administrator granting the permission on behalf of all users.
    user_consent_display_name  = string # Display name for the delegated permission that appears in the end user consent experience.
    user_consent_description   = string # Delegated permission description that appears in the end user consent experience, intended to be read by a user consenting on their own behalf.
    value                      = string # The value that is used for the scp claim in OAuth 2.0 access tokens.
  }))
  default = []
}

variable "app_passwords" {
  description = "Set of descriptive names for password credentials (client secrets) associated with this app."
  type        = set(string)
  default     = []
}

variable "app_required_resource_accesses" {
  description = "API Permissions (ie: required_resource_accesses) are used to control access to Azure resources via APIs. They define what actions a user or application can perform on a specific resource."
  type = set(object({
    resource_app_id = string
    resource_accesses = list(object({
      id   = string
      type = string
    }))
  }))
  default = []
}

variable "app_roles" {
  description = "Defines app roles for role-based access control (RBAC)."
  type = list(object({
    allowed_member_types = optional(set(string), ["Application", "User"])
    id                   = string
    description          = string
    display_name         = string
    group_name           = string
    value                = string
  }))
}

variable "app_web_redirect_uris" {
  description = "OAuth 2.0 redirect URIs for authentication response handling (e.g., authorization codes, access tokens)."
  type        = set(string)
  default     = []
}

variable "app_web_implicit_grants_access_token_issuance_enabled" {
  description = "Enable access token issuance using OAuth 2.0 implicit flow. Use cautiously due to potential security risks."
  type        = bool
  default     = false
}

variable "app_web_implicit_grants_id_token_issuance_enabled" {
  description = "Enable ID token issuance using OAuth 2.0 implicit flow. Recommended only for specific authentication scenarios."
  type        = bool
  default     = false
}

variable "role_assignments" {
  description = "Map of role values to lists of user email addresses to be assigned to those roles."
  type        = map(list(string))
}

variable "service_principal_group_memberships" {
  description = "List of group values (roles) that the service principal should be added to"
  type        = list(string)
  default     = []
}
