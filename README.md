# eta-calculator

Estimate ETA for Twiage Cases!

## Getting started

TBD

## Environment variables

Environment variables are stored in encrypted files under [env](lambda/env) directory. CircleCI decrypts them to create a ECS task definition.
We use [AWS Key Management Service](https://console.aws.amazon.com/kms/home?region=us-east-1#/kms/keys) to manage encryption keys.

### How to encrypt file

CD to [env](env) directory

```shell script
cd ./env
```

Copy example

```shell script
cp example.json {staging|demo|production}.json
```

Put your variables

Encrypt staging and demo files with [non-prod key](https://console.aws.amazon.com/kms/home?region=us-east-1#/kms/keys/745402c3-8c6e-4855-a396-9b87c9f3d7f9) or use [prod key]() to encrypt .env.production

```shell script
aws kms encrypt --key-id alias/twiage-env-vars-[non]-prod --plaintext fileb://{staging|demo|production}.json --output text --query CiphertextBlob | base64 --decode > encrypted.{staging|demo|production}.json
# choose your enviroment
```

**Make sure that unencrypted files are under [.gitignore](.gitignore) before push**

### How to decrypt files

If you need to decrypt file you can use similar decrypt KMS command. Note that you don't have to specify key to decrypt a file, KMS already knows which key to use. [deployment-nonprod](https://console.aws.amazon.com/iam/home?region=us-east-1#/users/deployment-nonprod) needs to have access to the key to decrypt files on CircleCI.

```shell script
aws kms decrypt --ciphertext-blob fileb://encrypted.staging --output text --query Plaintext | base64 --decode
```
