variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for applications"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of the AWS SSH key pair to attach to EC2 instances"
  type        = string
}


variable "domain_name" {
  description = "Subdomain name for frontend routing"
  type        = string
  default     = "project.girishchiluveru.me"
}
