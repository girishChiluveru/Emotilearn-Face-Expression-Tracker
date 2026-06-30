terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. VPC Module (Handles VPC, subnets, IGW, NAT Gateway, EIP)
module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# 2. EC2 Module (Handles Public EC2, Private EC2, Security Groups, Elastic IPs)
module "ec2" {
  source                = "./modules/ec2"
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  public_instance_type  = var.public_instance_type
  private_instance_type = var.private_instance_type
  key_name              = var.key_name
}

# 3. ECR Repositories for Docker images
resource "aws_ecr_repository" "backend" {
  name                 = "${var.environment}-emotilearn-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "ml" {
  name                 = "${var.environment}-emotilearn-ml"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}
