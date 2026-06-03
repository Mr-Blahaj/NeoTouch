#!/bin/zsh
cd "$(dirname "$0")"
/usr/bin/swiftc system-overlay.swift -o .cogniplay-overlay || exit 1
./.cogniplay-overlay
