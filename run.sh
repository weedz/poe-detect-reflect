#!/usr/bin/env bash
set -euxo pipefail

wl-paste --watch deno run --allow-run=notify-send,play detect_reflect.ts
