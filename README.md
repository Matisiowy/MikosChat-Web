# MikosChat Web

![Version](https://img.shields.io/badge/version-0.8.0-7367f0)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)

The official open-source web client for MikosChat,
a self-hosted real-time messaging platform.

## Features

- Modern dark user interface
- Direct and group conversations
- Real-time messaging
- Friend management
- Online presence and typing indicators
- Message reactions and replies
- Message editing and deletion
- Multimedia attachments
- Profile customization
- Group administration
- Conversation muting
- Delivery and read receipts

## Technology stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Socket.IO Client
- Axios
- Nginx

## Development

Requirements:

- Node.js 24
- A running MikosChat Server instance

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173 in your browser.

Configure API_PROXY_TARGET in .env to point
to your backend instance.

## Production build

```sh
npm run build
```

The compiled application is available in the dist directory.

Production deployments must route /api/ and /socket.io/
to a running MikosChat Server instance.

## Docker deployment

Clone both repositories into sibling directories:

    MikosChat/
    |-- MikosChat-Server/
    |-- MikosChat-Web/

Configure the backend according to its README.

Set CORS_ORIGINS=http://localhost:8080 in the backend .env file.

From the MikosChat-Server directory, run:

```sh
docker compose -f compose.yaml -f compose.web.yaml up -d --build
```

Open http://localhost:8080 in your browser.

Docker deployment is currently experimental.

## Project status

MikosChat is currently in early development.
Features and APIs may change between releases.

Messages are not end-to-end encrypted.

## Contributing

Contributions, bug reports and feature suggestions are welcome.

## License

GNU Affero General Public License v3.0 only.
See LICENSE for details.
