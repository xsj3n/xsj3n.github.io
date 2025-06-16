{
  description = "Next.js development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        nodejs = pkgs.nodejs_24;  # Use Node.js 20
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            pkgs.yarn  # or pkgs.pnpm
            pkgs.nodePackages.typescript
            pkgs.nodePackages.typescript-language-server
          ];

          shellHook = ''
            echo "Node.js $(node --version)"
            echo "npm $(npm --version)"
          '';
        };
      }
    );
}
