# build stage
FROM golang:1.22-alpine AS build-stage
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN go build -o /app/cybertown .

# binarystage
FROM gcr.io/distroless/base-debian11 AS build-release-stage
WORKDIR /app
COPY --from=build-stage /app/cybertown /app/cybertown
EXPOSE 6969
USER nonroot:nonroot
ENTRYPOINT ["/app/cybertown"]
