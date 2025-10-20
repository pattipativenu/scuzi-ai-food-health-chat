import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const region = process.env.AWS_REGION || "us-east-1";

// Create Secrets Manager client with minimal temporary credentials
// These will be rotated and are only used to fetch the actual secrets
const secretsClient = new SecretsManagerClient({
  region,
});

interface AWSCredentials {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

let cachedCredentials: AWSCredentials | null = null;

/**
 * Fetches AWS credentials from AWS Secrets Manager
 * Uses caching to avoid repeated API calls
 */
export async function getAWSCredentials(): Promise<AWSCredentials> {
  // Return cached credentials if available
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const secretName = process.env.AWS_SECRET_NAME || "awskeys";

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await secretsClient.send(command);

    if (!response.SecretString) {
      throw new Error("Secret value is empty");
    }

    const secret = JSON.parse(response.SecretString);

    // Validate required fields
    if (!secret.AWS_ACCESS_KEY_ID || !secret.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing required credentials in secret");
    }

    cachedCredentials = {
      AWS_ACCESS_KEY_ID: secret.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: secret.AWS_SECRET_ACCESS_KEY,
    };

    return cachedCredentials;
  } catch (error) {
    console.error("Failed to retrieve AWS credentials from Secrets Manager:", error);
    throw new Error("Unable to fetch AWS credentials. Please check Secrets Manager configuration.");
  }
}

/**
 * Clears the credentials cache
 * Useful for credential rotation scenarios
 */
export function clearCredentialsCache(): void {
  cachedCredentials = null;
}