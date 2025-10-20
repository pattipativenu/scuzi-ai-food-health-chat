import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getAWSCredentials } from "./aws-secrets";

const region = process.env.AWS_REGION || "us-east-1";

// Configure Bedrock client with bearer token authentication (SECURE - no exposed keys)
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (bearerToken) {
    // Use bearer token authentication for AWS Bedrock serverless
    const client = new BedrockRuntimeClient({
      region,
    });

    // Add middleware to inject bearer token in Authorization header
    client.middlewareStack.add(
      (next: any) => async (args: any) => {
        args.request.headers.Authorization = `Bearer ${bearerToken}`;
        return next(args);
      },
      {
        step: "build",
        name: "addBearerToken",
      }
    );

    return client;
  } else {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required for Bedrock access");
  }
};

export const bedrockClient = getBedrockClient();

// Lazy initialization for S3 client with credentials from Secrets Manager
let s3ClientInstance: S3Client | null = null;

export async function getS3Client(): Promise<S3Client> {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const credentials = await getAWSCredentials();

  s3ClientInstance = new S3Client({
    region,
    credentials: {
      accessKeyId: credentials.AWS_ACCESS_KEY_ID,
      secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY,
    },
  });

  return s3ClientInstance;
}

// Lazy initialization for DynamoDB client with credentials from Secrets Manager
let docClientInstance: DynamoDBDocumentClient | null = null;

export async function getDynamoDBClient(): Promise<DynamoDBDocumentClient> {
  if (docClientInstance) {
    return docClientInstance;
  }

  const credentials = await getAWSCredentials();

  const dynamoClient = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: credentials.AWS_ACCESS_KEY_ID,
      secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY,
    },
  });

  docClientInstance = DynamoDBDocumentClient.from(dynamoClient);

  return docClientInstance;
}

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || "scuzi-ai-recipes";
export const DYNAMODB_TABLE = "ScuziRecipes";

// Export legacy named exports for backwards compatibility (will be removed in future)
// IMPORTANT: These are deprecated - use getS3Client() and getDynamoDBClient() instead
export const s3Client = null as any;
export const docClient = null as any;