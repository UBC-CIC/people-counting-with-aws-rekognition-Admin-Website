#!/bin/bash

envName=$1
echo "envName : ${envName}"
# Create SSM parameters to prepare for backend deployment
admintableName=$( aws resourcegroupstaggingapi get-resources --tag-filters Key=user:Application,Values="admintest1" Key=user:Stack,Values=${envName} --resource-type-filters dynamodb --query 'ResourceTagMappingList[*].[ResourceARN]' --output text | awk -F'table/' '{print $2}')
echo "Parameter1 : ${admintableName}"
aws ssm put-parameter \
    --name "peopleCountingAmplifyAdminTable" \
    --type "String" \
    --value "${admintableName}" \
    --overwrite
controlBucketName=$( aws resourcegroupstaggingapi get-resources --tag-filters Key=user:Application,Values="admintest1" Key=aws:cloudformation:logical-id,Values="S3Bucket" Key=user:Stack,Values=${envName} --resource-type-filters s3 --query 'ResourceTagMappingList[*].[ResourceARN]' --output text | awk -F':::' '{print $2}')
aws ssm put-parameter \
    --name "controlBucketNameAmplifyAdmin" \
    --type "String" \
    --value "${controlBucketName}" \
    --overwrite
echo "Parameter2 : ${controlBucketName}"

# Create an IoT thing for RaspberryPi deployment
aws iot create-thing-type --thing-type-name "RPI"

# Create the layer for the image processing function
cd ../backend/lambda-transform-s3
mkdir -p lib/nodejs
rm -rf node_modules lib/nodejs/node_modules
npm install
npm uninstall sharp
npm install --arch=x64 --platform=linux sharp
mv node_modules lib/nodejs/

