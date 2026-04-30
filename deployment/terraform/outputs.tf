output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.ec2.alb_dns_name
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host"
  value       = module.ec2.bastion_public_ip
}

output "s3_tf_state_bucket" {
  description = "Name of the S3 bucket for Terraform state"
  value       = module.s3.bucket_id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.lambda_sns.sns_topic_arn
}
