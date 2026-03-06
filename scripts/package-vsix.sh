#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NAME="confluence-copilot-tools"
VERSION=$(node -p "require('./package.json').version")
OUT="${NAME}-${VERSION}.vsix"
TMPDIR=".vsix-tmp"
rm -rf "$TMPDIR" "$OUT"
mkdir -p "$TMPDIR/extension"
cp -r package.json README.md media dist src "$TMPDIR/extension/"
cat > "$TMPDIR/[Content_Types].xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="md" ContentType="text/markdown"/>
  <Default Extension="svg" ContentType="image/svg+xml"/>
  <Default Extension="ts" ContentType="text/plain"/>
  <Default Extension="js" ContentType="application/javascript"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="txt" ContentType="text/plain"/>
</Types>
XML
cat > "$TMPDIR/extension.vsixmanifest" <<XML
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="local.${NAME}" Version="${VERSION}" Publisher="local"/>
    <DisplayName>Confluence Copilot Tools</DisplayName>
    <Description xml:space="preserve">Confluence Data Center tools for GitHub Copilot Chat</Description>
    <Tags>confluence,copilot,chat</Tags>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json"/>
  </Assets>
</PackageManifest>
XML
(cd "$TMPDIR" && zip -qr "../$OUT" .)
rm -rf "$TMPDIR"
echo "Created $OUT"
