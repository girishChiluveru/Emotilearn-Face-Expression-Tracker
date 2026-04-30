provider "aws" {
  region = var.aws_region
}

# 1. VPC Module
module "vpc" {
  source = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# 2. EC2 Module (Backend)
module "ec2" {
  source = "./modules/ec2"
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  instance_type      = var.instance_type
  key_name           = var.key_name
}

# 3. S3 Module (Terraform State only as per requirements)
module "s3" {
  source = "./modules/s3"
  environment = var.environment
  bucket_name = "${var.environment}-emotilearn-tf-state"
}

# 4. Lambda + SNS Module (Developer Deployment Alerts)
module "lambda_sns" {
  source = "./modules/lambda_sns"
  environment = var.environment
  alert_email = var.alert_email
}
