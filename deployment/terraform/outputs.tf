output "bastion_public_ip" {
  description = "Public IP of the public EC2 instance (which acts as frontend server and bastion)"
  value       = module.ec2.bastion_public_ip
}

output "public_ec2_public_ip" {
  description = "Public IP of the frontend Nginx EC2 instance"
  value       = module.ec2.public_ec2_public_ip
}

output "private_ec2_private_ip" {
  description = "Private IP of the backend and ML EC2 instance"
  value       = module.ec2.private_ec2_private_ip
}
