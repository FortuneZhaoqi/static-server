# 🔥 Serve Lite

A lightweight, production-ready static file server CLI built with Node.js.  
Supports SPA fallback, gzip compression, directory listing, markdown rendering, basic auth, HTTPS, and caching with ETag.

---

## 🚀 Features

- ✅ Static file serving with MIME types
- ✅ SPA routing fallback (`index.html`)
- ✅ Directory listing for folders
- ✅ Gzip compression support
- ✅ HTTP caching (`Cache-Control`, `ETag`, `Last-Modified`)
- ✅ Basic HTTP Authentication
- ✅ Markdown file rendering (like GitHub)
- ✅ HTTPS with custom cert/key
- ✅ CLI flags or `server.config.js`

---

## 📦 Installation

### Option 1: Global Install

```bash
npm install -g serve-lite
```

### Option 2: Run Directly

```bash
npx serve-lite --root ./dist
```

---

## 🧪 Usage

```bash
serve-lite [options]
```

### CLI Options

| Flag             | Description                                  | Default      |
|------------------|----------------------------------------------|--------------|
| `--port <n>`     | Port to start the server                     | `3000`       |
| `--spa`          | Enable SPA fallback routing (`index.html`)   | `false`      |
| `--root <dir>`   | Root directory to serve                      | `public`     |
| `--https`        | Enable HTTPS mode                            | `false`      |
| `--key <path>`   | SSL key file path (with `--https`)           |              |
| `--cert <path>`  | SSL cert file path (with `--https`)          |              |
| `--auth <u:p>`   | Enable basic auth: format `user:pass`        |              |

---

## 📄 Markdown Support

Requesting a `.md` file renders it as HTML by default:

```
http://localhost:3000/README.md
```

Want the raw file?

```
http://localhost:3000/README.md?raw=true
```

---

## ⚙️ Optional: `server.config.js`

You can define settings in a local `server.config.js` file:

```js
// server.config.js
export default {
  port: 8080,
  root: './dist',
  spa: true,
  https: true,
  sslKeyPath: './cert/key.pem',
  sslCertPath: './cert/cert.pem',
  auth: {
    username: 'admin',
    password: 'secret123'
  }
};
```

CLI args override config file values.

---

## 🔐 HTTPS for Local Dev

Generate a self-signed cert:

```bash
mkdir cert
openssl req -x509 -newkey rsa:2048 -nodes -keyout cert/key.pem -out cert/cert.pem -days 365
```

Then run:

```bash
serve-lite --https --key cert/key.pem --cert cert/cert.pem
```

---

## ✅ Example

```bash
serve-lite --spa --auth dev:1234 --root ./build --port 5000
```

---

## 📤 Deployment Tip

Use this as a static backend for:
- React/Vite/Angular builds
- Markdown preview sites
- Internal documentation dashboards

---

## 🧱 Built With

- Node.js (native `http`, `https`, `zlib`, `fs`)
- [`commander`](https://npmjs.com/package/commander)
- [`mime-types`](https://npmjs.com/package/mime-types)
- [`marked`](https://npmjs.com/package/marked)

---

## 📃 License

MIT

## 📖 Author

Jason Zhao