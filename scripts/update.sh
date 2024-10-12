#!/bin/bash
set -e
# 自动提交并推送 GitHub Pages 更新

git add .
echo "Enter commit message: "
read commit_message
git commit -m "$commit_message"
git push origin main

echo "Blog updated successfully!"
