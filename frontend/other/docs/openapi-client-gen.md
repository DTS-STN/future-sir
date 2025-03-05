# Updating FSIR API Client with @hey-api/openapi-ts

This guide provides the simple steps to update your existing FSIR API client when the API specification changes.

## Update Procedure

1. **Update the OpenAPI specification file**

   Replace or update the contents of your existing OpenAPI specification file:

   ```bash
   # Replace the existing specification with the updated version
   cp /path/to/new/fsir-openapi.yml ./fsir-openapi.yml
   ```

2. **Run the generation commands**

   Execute the following commands in your project directory:

   ```bash
   npm i
   npm run openapi-ts
   ```

3. **Verify the generated client**

   After running the commands, check that the API client was regenerated correctly by examining the output files in `./app/.server/shared/api`.

## Configuration File

The package configuration is stored in the `./openapi-ts.config.ts` file in your project root. This file contains settings that control how your API client is generated, including:

- Input/output paths
- Client name and options
- Type generation settings
- Component handling

If you need to modify the client generation behavior, you can edit this configuration file.

## Potential Issues and Solutions

- **Generation failures**: If the new specification contains structural changes that break compatibility, you may need to check the console output for specific errors.

- **Breaking changes**: Be aware that significant API changes may require updates to your existing code that uses the client.

## Testing the Updated Client

After regeneration, it's recommended to:

1. Build your project to verify there are no TypeScript errors
2. Run your test suite if available
3. Test critical API endpoints manually to ensure they work as expected

## Resources

- [@hey-api/openapi-ts Documentation](https://github.com/hey-api/openapi-ts)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
