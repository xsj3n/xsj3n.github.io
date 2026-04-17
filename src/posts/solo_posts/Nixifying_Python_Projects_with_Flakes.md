Going over the basics of making pure Nix Python projects, as well as a few tid bits for impure Python development on NixOS.
---
8/7/2025|Python,Nix
---
Among new adopters of Nix, Python is often cited as a pain point. Just like many other favored technologies, translating them over to Nix can initially be an annoyance. A lot of this pain comes from trying to do things the "old way"; operating fully within Nix's paradigm tends to make things simple, especially once you're acquainted with writing Nix flakes. Truthfully, Nix can make certain things more difficult, such as when you want to use a python module that is not within Nixpkgs. Due to this, we'll go over impure development scenarios as well. 
As you likely know, Nix's primary benefit is reproducibility, which the usage of flakes strengthens immensely. It's important to understand exactly what Nix is doing to accomplish this, as it makes resolving issues with more complex builds much easier. So, briefly we'll go over one of the largest barriers to entry when it comes to learning Nix: libraries & modules.
Both interpreted and compiled languages have predefined processes for not only *where* to search for these shared libraries/modules, but also *how* they search for them. On Unix systems, `/usr/lib` and `/lib` are the default locations searched for dependencies on Unix systems. 
Though these are the default locations, they are **not** the first locations searched. According to the [ld.so manual](https://man7.org/linux/man-pages/man8/ld.so.8.html), they're actually the last locations searched. This is primarily done to allow for other search paths to be used, if the developer or user desires. If virtual environments are not used, python modules are kept under one of the aforementioned directories as well.
Nix uses the `/nix/store` for dependencies, it lacks a `/usr/lib` or `/lib` directory (`lib` is technically present but it will be empty). As a result, a common method for directing non-nix built programs to the right search paths is via the `$LD_LIBRARY_PATH` and `$PYTHON_PATH`. 

- `$PYTHON_PATH` defines the path Python will search for modules and packages.

- `$LD_LIBRARY_PATH` defines a list of search paths delimited by a `:` character. It's the second set of search paths considered by ld-linux.so. 

- Binaries built with Nix typically set the `RPATH` attribute with the header of the elf/exe to include the exact Nix store paths. This is less applicable to Python but it's still good to keep in mind. 

So, nix-built binaries either have the correct path embedded set within the `.dynamic` section, or are supplied dependency paths via environmental variables. It's not terribly complicated. Sometimes you'll have to manually provide dependency paths in more complex builds, but this realistically shouldn't occur too often.
The [nixpkgs reference manual](https://nixos.org/manual/nixpkgs/stable/#python) provides a section detailing an assortment of tools to assist with pure Nix python projects. First, let us consider the development of a Python application. Depending on the complexity of your application, you'll likely want to use `pkgs.mkShell`, `pkgs.python3XX.withPackages.env`, potentially even along with `pkgs.python3XX.mkPythonEditablePackage`.

```nix 
{
  description = "Python example flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
    pyPkgs = pkgs.python314.withPackages (p: [
      p.numpy
      p.python-lsp-server
    ]);
 in 
  {
    devShells."${system}".default = pyPkgs.env; 
  };
}
```

The above is a bare-bones example of utilizing `pkgs.python3XX.withPackages` to provide the primitives for a working development environment. It is a simpler interface to the `pkgs.python3XX.buildEnv` function that exposes a few more options. `pkgs.mkShell` is also viable for development due to the setup hooks of included packages running. However, the derivation it produces cannot be used for actually building applications so its not recommended.
It is common practice to use [editable mode](https://setuptools.pypa.io/en/latest/userguide/development_mode.html) to produce a mutable install when developing python packages. This speeds up development by not forcing developers to rebuild the project to test each code change. Nix supports this via the `pkgs.mkPythonEditablePackage` function. The derivation produced is linked to an impure location outside of the Nix store, allowing for modifications without rebuilds. Do keep in mind that `pkgs.mkPythonEditablePackage` is intended to be used for python projects which have a `pyproject.toml`. The [documentation](https://nixos.org/manual/nixpkgs/stable/#mkpythoneditablepackage-function) for the function illustrates that `pkgs.python` to be overridden to include the editable package so it can be used within the development shell.
If you're doing development and require a dependency that hasn't been packaged yet, it's often more efficient to simply use virtual environments until the need to produce a production build comes up. This *can* be one of the simplest options for python development in general: 

```nix
let 
  buildInputs = with pkgs; [ openssl ];
in 
pkgs.mkShell {
 packages = with pkgs; [
   python314
   python314Packages.pip  
 ];
 
 inherit buildInputs;
 
 shellHook = ''
   if [ -d .venv ]; then 
     source .venv/bin/activate 
   else
     python -m venv .venv --copies
   fi
 '';
 
 LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath buildInputs;
};
```

A simple `shellHook` can be added to take care of activation of the virtual environment upon `nix develop`. Certain modules may depend on C libraries, and they can be supplied through the `buildInputs` and `LD_LIBRARY_PATH` as shown in the prior example. You may notice `LD_LIBRARY_PATH` is not listed as a parameter for `mkShell`. This is because within `mkShell`, any parameters passed that do not match predefined attributes are interpreted as environmental variables.
Impure development aside, producing an actual build isn't hard. You'll want to use `python.buildPythonApplication` for applications and `python.buildPythonPackage` for modules: 

```nix
 ...
  packages."${system}".default = pkgs.python314.buildPythonApplication {
    pname = "example";
    version = "0.0.1";
    pyproject = false;
    
	build-system = [ setuptools setuptools-scm ];
	
	dependencies = [ attrs py setuptools six pluggy ];
	
	src = fetchPypi { 
	  inherit pname version; 
	  hash = "sha256-z4Q23FnYaVNG/NOrKW3kZCXsqwDWQJbOvnn7Ueyy65M="; 
	};
	
  };
...
```

Both `buildPythonApplication` and `buildPythonPackage` support all the same parameters as `mkDerivation`. Some of the important flags specific to the Python builders are:

- `build-system`: build-time only Python dependencies. List items from `build-system.requires` from `pyproject.toml`. 

- `dependencies`: python modules needed at runtime by the project. List items specified in `install_requires` from `pyproject.toml`.

- `src`: used to specify information for Pypi.

There an explanation of the phases and some more niceties specified in the [buildPythonPackage](https://nixos.org/manual/nixpkgs/stable/#buildpythonpackage-parameters) documentation, but what is listed above is generally the bare minimum. 
