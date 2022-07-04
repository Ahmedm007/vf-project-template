import { config, SharedIniFileCredentials, SecretsManager, AWSError } from 'aws-sdk';

export async function getSecrets({
  secretName,
  keyNames,
  profile,
  region
}: {
  secretName: string;
  keyNames?: string[];
  region?: string;
  profile?: string;
}) {
  if (profile) {
    config.credentials = new SharedIniFileCredentials({ profile });
  }
  const secretsManager = new SecretsManager({ region });

  const parseAndSelectKey = (secret: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any>;
    try {
      // eslint-disable-next-line prefer-const
      parsed = JSON.parse(secret);
    } catch (err) {
      throw new Error('Could not parse secret, improper JSON format');
    }

    if (!keyNames) {
      return parsed;
    }

    const secrets = {} as { [key in typeof keyNames[number]]: string };
    for (const key of keyNames) {
      if (!parsed.hasOwnProperty(key)) {
        throw new Error(`${key} doesn't exist on ${secretName}`);
      }
      secrets[key] = parsed[key];
    }
    return secrets;
  };

  try {
    const secrets = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if (secrets.SecretString) {
      return parseAndSelectKey(secrets.SecretString);
    }
    if (secrets.SecretBinary) {
      return parseAndSelectKey(Buffer.from(secrets.SecretBinary.toString('base64')).toString('ascii'));
    }
    throw new Error('secret recovered but did not have a SecretString or SecretBinary');
  } catch (err: unknown) {
    switch ((err as AWSError).code) {
      // case 'InternalServiceErrorException':
      //   // An error occurred on the server side.
      //   // Deal with the exception here, and/or rethrow at your discretion.
      //   break;
      // case 'InvalidParameterException':
      //   // You provided an invalid value for a parameter.
      //   // Deal with the exception here, and/or rethrow at your discretion.
      //   break;
      // case 'InvalidRequestException':
      //   // You provided a parameter value that is not valid for the current state of the resource.
      //   // Deal with the exception here, and/or rethrow at your discretion.
      //   break;
      case 'DecryptionFailureException':
        throw new Error('Secrets Manager cannot decrypt the protected secret text using the provided KMS key');
      case 'ResourceNotFoundException':
        throw new Error('could not locate secret');
      default:
        throw err;
    }
  }
}
