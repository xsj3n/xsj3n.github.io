Striving to replicate modern administration practices, this post focuses on laying the groundwork for a fully automated home lab deployment. Early on in the series, there will be a focus on Proxmox, Terraform, and Ansible.
---
6/30/2025
---
There are a lot of technologies for an admin to learn, especially if you'd like to be professionally versatile. Networking, infrastructure (as code), cloud providers, MDM platforms, and all of the minute details involved with running an Active Directory/Entra based environment. Naturally, this leaves one with the question on how to efficiently fit experience with all these technologies in- especially as the privilege of on the job training is a thing of the past. 

What I personally opted for, as many do, is a home lab. One which will touch upon all of these things at once, or in time. 

First, the focus will be on the work which would be done to support a company internally, then it will shift to the work would serve to support an external offering, such as a SaaS application. 

As for the software choices, the following will be used:

- **Type-I hypervisor**: Proxmox, as it offers most of the features ESXi (ESXi is free to use for personal usage, so feel free to use that instead). We will start with one node, default install settings, and advance to clustering. 

- **Infrastructure automation**: Terraform will handle the automation of deploying virtual machines to Proxmox. 

- **Configuration automation**: Ansible will automate the configuration of the virtual machines deployed via Terraform.

**Note**: In this writing, I will be assuming the reader possesses some knowledge of operating systems, scripting, and virtualization.



Before we can get to setting up the domain controllers for AD, Proxmox will need to be configured for Terraform. In order to do this, we will need to configure the our Terraform Provider for Proxmox, after installing the tools we need.

I am a proponent of Nix, so I will supply the development shell `flake.nix` that I will be using for this project here(TODO:link here!).

If you do use Nix, then just know you'll want to install the following before proceeding:

- Python

- Ansible

- Terraform
 
- Terraform LSP

- sshpass

Once that is all installed, we'll make a new directory for this project, `AD-IaC-Lab`, and then `git init && git branch -M main` within the director to setup the local git repository. 

The documentation for Terraform providers states the following:

>Terraform relies on plugins called providers to interact with cloud providers, SaaS providers, and other APIs.
>
>Terraform configurations must declare which providers they require so that Terraform can install and use them. Additionally, some providers require configuration (like endpoint URLs or cloud regions) before they can be used.

So, we must refer to the [documentation](https://registry.terraform.io/providers/bpg/proxmox/latest/docs#table-of-contents) for the Proxmox provider to ascertain what needs to be done. There are a few options available for getting the provider to authenticate to our Proxmox instance, but we will use an API token as it is recommended for production systems. 

There are instructions included in the aforementioned documentation for setting up an API token. We must add a PVE user for terraform to use, assign that user the permissions required to manage the environment, and finally create the API token for the `terraform` user.

In this series, we will strive to make all parts of this process reproducible. So, we will turn the instructions into a script that will be ran over SSH to automate the configuration:

```bash
proxmox_ip="$1"
ssh root@"$proxmox_ip" "bash -s" << "ENDSSH"


if ! dpkg -s uuid-runtime &>/dev/null; then
  apt update -qq &>/dev/null
  apt install -y uuid-runtime
fi

terraform_pwd=$(uuidgen)
terraform_pwd=${terraform_pwd:0:28}

pveum user add terraform@pve --password "$terraform_pwd"
useradd -m terraform

pveum user add terraform@pve --password "$terraform_pwd"
pveum role add Terraform -privs "Datastore.Allocate Datastore.AllocateSpace Datastore.AllocateTemplate Datastore.Audit Pool.Allocate Sys.Audit Sys.Console Sys.Modify SDN.Use VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.Monitor VM.PowerMgmt User.Modify"
pveum aclmod / -user terraform@pve -role Terraform


pveum user token add terraform@pve provider --privsep=0
printf "┌────────────────────────────────────────────────────────────────┐\n"
printf "│ Terraform SSH Password: $terraform_pwd                         |\n"                         
printf "└────────────────────────────────────────────────────────────────┘\n"

printf "IMPORTANT: These credentials will only be viewable once! Record them now!\n"
ENDSSH
```

This will produce two secrets; one will be the required API token, and the other will serve as password for the provider's Linux user account, so it may access Proxmox via SSH. Record the secrets, as they will be needed shortly.

There may be some confusion regarding why the provider requires SSH access, and why we create two accounts for terraform:

- a) The documentation states the provider may use access via SSH to "...execute commands on the node to perform actions that are not supported by Proxmox API."

- b) Proxmox has multiple authentication realms. The `@pve` realm is an entirely Proxmox managed form of authentication. Users within this realm are synced across all nodes in the cluster, and it lets Proxmox allow RBAC (role-based authentication). So, we create one account in the `@pve` realm and one normal Linux account, referenced as the `@pam` realm (PAM is the standard form of Linux authentication).

As stated before, the purpose of scripting this was so I would not have to manually do so if I had to set up a PVE instance again. This will need to be modified later to accommodate additional nodes. For now, let's make a `bin/` directory and store our script in it.

At this point, we can begin writing the Terraform files. The structure of a Terraform project is flexible; there is no specific names you must use for `.tf` files. However, there are conventions, and we will be using them.

First, let us define a `versions.tf` file. Within the file, we will specify the the versions of the providers & of Terraform required to run the Terraform project. We will need the `bpg/proxmox` & `ansible/ansible` providers.

```hcl
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.76.0"
    }
    ansible = {
      version = "~> 1.3.0"
      source  = "ansible/ansible"
    }
  }
}
```

After that, we will define two important files: `variables.tf` & `secrets.auto.tfvars`. Just as the names suggest, we will be defining some sensitive variables in these files. 

In `variables.tf`, we will specify the following:
```hcl
variable "api_token" {
  type      = string
  sensitive = true
}
variable "pve_ssh_passwd" {
  type      = string
  sensitive = true
}
variable "ve_endpoint" {
  type    = string
  default = "https://192.168.0.86:8006/"
}
```

Note that we do not actually provide a value for `api_token` and `pve_ssh_passwd`. This is because we will be providing the definition in a separate file, `secrets.auto.tfvars` (`.tfvars` are variable definition files). 

```hcl
api_token = "xxxxxxxx"
pve_ssh_passwd = "xxxxxxxx"
```

The actual definitions are separated into `secrets.auto.tfvars` so that we may encrypt our secrets while they are at rest. When we upload our repository into GitHub, we want to have our secrets encrypted without obfuscating the logic of our Terraform deployment. 

Additionally, there is a reason for the `.auto` in the filename. If we just defined a `secrets.tfvars` and left the `.auto` out, then Terraform would not automatically load the variable definition file whenever we ran our deployment. This prevents us from having to append `-var-file=secrets.tfvars` every time we run `terraform apply`. 

In an enterprise environment, secrets would need to be secured without inhibiting collaboration, so a secrets manager such as Hashicorp Vault would be used to inject the secrets at runtime. 

However, since there is no need for collaboration, I will personally be using gpg & a Yubikey to handle the encryption of my files via some scripts I made. I recommend using git-secret, as I will be using something very similar. 

Now that we have our secrets defined, and secured, we can make our `providers.tf` file. The purpose of this file is to define config info for the providers which require configuration. 

```hcl
provider "proxmox" {
  endpoint  = var.ve_endpoint
  api_token = var.api_token
  insecure  = true
  ssh {
    username = "terraform"
    password = var.pve_ssh_passwd
  }
}
```

As you can see, the variables we defined in `variables.tf` are accessible under the `var` namespace. The `insecure` option is set to `true` due to the self-signed TLS certificate Proxmox uses by default. 

We are just about ready to deploy VMs, but since we are deploying Windows VMs, there is quite a few additional steps to fully automate this. A Windows VM will have to be deployed, prepared, and then sysprep'd.

At this point, our project directory should have the following structure:

```bash
├── bin
│   └── proxmox_terraform_setup.sh
├── flake.nix
├── providers.tf
├── variables.tf
└── versions.tf
```

In the following post, we will prepare the windows image and deploy our  first VMs on Proxmox.
