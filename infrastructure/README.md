# Future SIR infrastructure-as-code

This project provides a basic infrastructure-as-code setup for managing Azure resources using Terragrunt and Terraform.
It currently creates the following resources:

- Future SIR Entra ID service principal (aka *app registration*)

## Requirements

This project has been tested with the following toolchain:

| Tool       | Version          |
| ---------- | ---------------- |
| [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)   | ≥ 2.60.x          |
| [Terraform](https://www.terraform.io/downloads.html)                        | ≥ 1.10.x, < 2.0.x |
| [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/install/) | ≥ 0.65.x          |

## Running

**Important:** to run this project, you must be assigned the *Application Administrator* role in Azure Active Directory,
either directly or through a PIM request.

**Important:** to run this project, you must be connected to the DTS-STN Azure VPN (nonprod).

Before you begin, make sure that you have logged in to Azure CLI by running the az login command.

1. Clone this repository to your local development environment.
1. Run the following command to initialize Terraform and download the required modules:

    ``` shell
    terragrunt init --terragrunt-working-dir terragrunt/{target-environment}/{target-module}
    ```

1. Run the following command to view the change plan:

    ``` shell
    terragrunt plan --terragrunt-working-dir terragrunt/{target-environment}/{target-module}
    ```

1. If the plan looks good, apply the changes by running the following command:

    ``` shell
    terragrunt apply --terragrunt-working-dir terragrunt/{target-environment}/{target-module}
    ```

## Getting the App Registration ID (also known as OAuth Client ID)

The App Registration ID is configured a Terraform an output variable, so it will always be printed whenever you perform
a `terragrunt apply`. However, if you need to get the client id **without running** `terragrunt apply`, you can use
the following command:

``` shell
terragrunt output --terragrunt-working-dir terragrunt/{target-environment}/{target-module}
```

## Getting App Registration secrets (also known as OAuth Client Secrets)

For security reasons, the OAuth client secrets are configured as a sensitive output variables. If you need the OAuth
client secrets, you can get them by using the following command:

``` shell
terragrunt output app_secrets --terragrunt-working-dir terragrunt/{target-environment}/{target-module}
```
