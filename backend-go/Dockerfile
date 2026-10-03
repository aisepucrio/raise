FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/ ./cmd/...

FROM alpine:3.22
# git is required by the worker for local repository mining.
RUN apk add --no-cache git ca-certificates \
 && adduser -D -u 10001 raise \
 && mkdir -p /data/mirrors && chown raise:raise /data/mirrors
COPY --from=build /out/ /usr/local/bin/
USER raise
ENV GIT_MIRROR_DIR=/data/mirrors
CMD ["api"]
