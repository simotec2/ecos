#!/usr/bin/env bash

apt-get update
apt-get install -y chromium

cd apps/api

npm install
npm run build