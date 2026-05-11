{
  description = "Development shell for costeer.dev Astro site using Bun";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              nodejs_24
              git
              cacert
            ];

            # Keep Bun's cache inside the project so the shell is reproducible-ish and
            # does not depend on a user-global cache path.
            shellHook = ''
              export BUN_INSTALL="$PWD/.bun"
              export BUN_CACHE_DIR="$PWD/.bun/cache"
              export PATH="$BUN_INSTALL/bin:$PATH"

              echo "Astro + Bun development shell"
              echo "  bun:  $(bun --version)"
              echo "  node: $(node --version)"
              echo ""
              echo "Common commands:"
              echo "  bun install"
              echo "  bun run dev"
              echo "  bun run build"
            '';
          };
        });
    };
}
