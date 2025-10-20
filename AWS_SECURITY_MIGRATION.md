# AWS Security Migration Guide

## ⚠️ Security Issue Resolved

AWS credentials have been migrated from environment files to AWS Secrets Manager to prevent exposure.

## What Changed

### Before (Insecure)
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xyz123...
```

### After (Secure)
- Credentials stored in AWS Secrets Manager: `awskeys`
- Retrieved dynamically at runtime
- No sensitive keys in `.env` files

## Configuration Required

### 1. Update Your `.env` File

Remove these lines if they exist:
```bash
# ❌ REMOVE THESE
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Keep only these:
```bash
# ✅ KEEP THESE
AWS_REGION=us-east-1
AWS_SECRET_NAME=awskeys
AWS_BEARER_TOKEN_BEDROCK=your_bedrock_token
AWS_S3_BUCKET_NAME=scuzi-ai-recipes
```

### 2. AWS Secrets Manager Setup

Your credentials are already stored in:
- **Secret Name**: `awskeys`
- **Secret ARN**: `arn:aws:secretsmanager:us-east-1:639261426100:secret:awskeys-VUPUDx`

The secret should contain:
```json
{
  "AWS_ACCESS_KEY_ID": "AKIA...",
  "AWS_SECRET_ACCESS_KEY": "xyz123..."
}
```

### 3. IAM Permissions Required

Your application needs these permissions to access Secrets Manager:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:639261426100:secret:awskeys-VUPUDx"
    }
  ]
}
```

## Updated Code Usage

### S3 Client
```typescript
// OLD (Deprecated)
import { s3Client } from "@/lib/aws-config";

// NEW (Secure)
import { getS3Client } from "@/lib/aws-config";

const s3 = await getS3Client();
```

### DynamoDB Client
```typescript
// OLD (Deprecated)
import { docClient } from "@/lib/aws-config";

// NEW (Secure)
import { getDynamoDBClient } from "@/lib/aws-config";

const dynamo = await getDynamoDBClient();
```

### Bedrock Client (Unchanged)
```typescript
// Still uses bearer token (secure)
import { bedrockClient } from "@/lib/aws-config";
```

## Security Benefits

✅ **No credentials in source code**  
✅ **No credentials in environment files**  
✅ **Centralized credential management**  
✅ **Easy credential rotation**  
✅ **AWS audit logs via CloudTrail**  
✅ **Bedrock uses bearer token (already secure)**  

## Immediate Actions Required

1. ✅ **Rotate compromised keys in AWS IAM**
   - Go to AWS Console → IAM → Users → Security Credentials
   - Delete the exposed access keys
   - Generate new keys and update Secrets Manager

2. ✅ **Update Secrets Manager**
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id awskeys \
     --secret-string '{"AWS_ACCESS_KEY_ID":"NEW_KEY","AWS_SECRET_ACCESS_KEY":"NEW_SECRET"}'
   ```

3. ✅ **Remove old keys from `.env`**
   - Delete AWS_ACCESS_KEY_ID
   - Delete AWS_SECRET_ACCESS_KEY
   - Keep only AWS_BEARER_TOKEN_BEDROCK

4. ✅ **Restart your application**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Error: "Unable to fetch AWS credentials"
- Check AWS_SECRET_NAME environment variable
- Verify IAM permissions for Secrets Manager
- Ensure the secret exists in the correct region

### Error: "Missing required credentials in secret"
- Verify secret contains both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check JSON format in Secrets Manager

### Performance Note
- Credentials are cached after first fetch
- No performance impact on subsequent requests
- Cache cleared on credential rotation

## Questions?

Contact your AWS administrator or refer to:
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)