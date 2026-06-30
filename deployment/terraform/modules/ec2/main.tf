variable "environment" {}
variable "vpc_id" {}
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "instance_type" {}
variable "key_name" {}

# Fetch latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# 1. Security Group for Public EC2 (Frontend & SSL Termination)
resource "aws_security_group" "public_sg" {
  name        = "${var.environment}-public-sg"
  description = "Allow HTTP, HTTPS, and SSH inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.environment}-public-sg" }
}

# 2. Security Group for Private EC2 (Backend, ML, DB)
resource "aws_security_group" "private_sg" {
  name        = "${var.environment}-private-sg"
  description = "Allow traffic from Public SG only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow backend API traffic from Public SG"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.public_sg.id]
  }

  ingress {
    description     = "Allow SSH from Public EC2 (Bastion)"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public_sg.id]
  }

  egress {
    description = "Allow all outbound traffic (for docker image pulls via NAT Gateway)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.environment}-private-sg" }
}

# 3. Public EC2 Instance (Frontend + SSL Termination)
resource "aws_instance" "public_frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.public_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.public_sg.id]
  key_name               = var.key_name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = { Name = "${var.environment}-public-frontend" }
}

# 4. Private EC2 Instance (Backend API + ML Service + MongoDB)
resource "aws_instance" "private_backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.private_sg.id]
  key_name               = var.key_name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = { Name = "${var.environment}-private-backend" }
}

# 5. Elastic IP for Public Instance (Frontend / Bastion)
resource "aws_eip" "frontend_eip" {
  domain = "vpc"
}

resource "aws_eip_association" "frontend_eip_assoc" {
  instance_id   = aws_instance.public_frontend.id
  allocation_id = aws_eip.frontend_eip.id
}

# Outputs
output "bastion_public_ip" {
  value = aws_eip.frontend_eip.public_ip
}

output "public_ec2_public_ip" {
  value = aws_eip.frontend_eip.public_ip
}

output "private_ec2_private_ip" {
  value = aws_instance.private_backend.private_ip
}
