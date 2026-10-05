# Zane GNOME indicator

`extension/` preserves the installed Zane GNOME indicator for package migration.
It requires the existing external Zane agent/workspace process. Agent sources,
models, credentials and session data are not copied here. The extension retains
its source shell-version declaration; validate it against the selected shell.

ZenPkgs consumes this package from its GitHub repository. Releases are
preferred; until a suitable release exists, ZenPkgs pins the latest commit.
Implementation and assets stay here, outside the package catalog.
