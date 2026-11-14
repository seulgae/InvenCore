# Source viewer imports selected backend files, so the context must be the repo root.
FROM node:22-alpine AS build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY backend/src/main/java/ /workspace/backend/src/main/java/
COPY backend/src/main/resources/mappers/ /workspace/backend/src/main/resources/mappers/
COPY backend/build.gradle /workspace/backend/build.gradle
COPY docs/AWS_CICD.md /workspace/docs/AWS_CICD.md
COPY deployment/templates/ /workspace/deployment/templates/
RUN npm run lint && npm test && npm run build

FROM nginx:stable-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist/ /usr/share/nginx/html/
EXPOSE 80
