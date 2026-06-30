# Production Frontend Dockerfile
# Serves static React assets built in CI/CD pipeline (GitHub Actions)
FROM nginx:alpine

# Copy pre-built dist folder to default nginx public path
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
