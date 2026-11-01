# RAISE

RAISE is a platform designed to to collect and achive data from multiple external platorms:

- GitHub
- JIRA
- StackOverflow

## Running the application

### 1. Install Docker Desktop

1. Go to the [Docker Desktop download page](https://www.docker.com/products/docker-desktop/).
2. Download the installer for your operating system (Windows, macOS, or Linux).
3. Run the installer and follow the on-screen instructions to complete the installation.
4. After installation, launch Docker Desktop and ensure it is running.

### 2. Clone the Repository

Open a terminal and run:

```sh
git clone https://github.com/aisepucrio/raise.git
cd raise
```

### 3. Prepare your .env file

Copy the example environment file:

```sh
cp .env.example .env
```

Then generate a credential encryption key and paste it into `ENCRYPTION_KEYS`
in `.env`:

```sh
docker compose run --rm migrate raisectl keygen
```

Back this key up: the platform tokens stored in the database can't be
decrypted without it.

Also set `ADMIN_PASSWORD` (at least 12 characters; `ADMIN_USERNAME` defaults
to `admin`). On its first start the API creates this admin account, which you
log in with in step 5. The API refuses to start with a username and no
password. The other values in `.env.example` work as they are for local use;
each one is described in the file.

Platform tokens (GitHub, Jira, Stack Overflow) don't go in `.env`. You add them
in the web interface once it is running (step 5).

### 4. Build and Start the Containers

In the root directory of the project (where the `docker-compose.yaml` file is located), run:

```sh
docker compose up --build
```

This starts PostgreSQL, the [Go backend](backend-go/README.md) (database
migrations, the API and the mining worker) and the frontend. To also serve
the frontend build through nginx on port 8080, set `IS_DEBUG=False` in `.env`
and run:

```sh
docker compose --profile production up --build
```

`docker-compose.yaml` is meant for development. For production settings
(HTTPS, secrets, reverse proxy), see the
[production section of the backend README](backend-go/README.md#production).

### 5. Log in and add tokens

Log in to the web interface (step 6) with `ADMIN_USERNAME` and
`ADMIN_PASSWORD` from `.env`, then change the password under **Change
password** (the lock next to **Log out**). The `.env` values only matter while
the database has no users, so editing them later changes nothing.

Add a GitHub token under **Credentials**, or through the API as described in
[Adding platform credentials](backend-go/README.md#adding-platform-credentials-admin).

Without `ADMIN_USERNAME`/`ADMIN_PASSWORD`, create the first admin with:

```sh
docker compose run --rm -it migrate raisectl user create -username admin -role admin
```

### 6. Access the Application

The web interface runs at <http://localhost:5173>: log in with the user from
step 5. Admins register further users under **Users** (there is no
self-signup). The dev server proxies `/api/` to the API, so the
browser only ever talks to `:5173`.

The API runs at <http://localhost:8000>, with interactive docs at
<http://localhost:8000/api/docs>.

> **Note:** the web interface covers git and GitHub. Jira and Stack Overflow
> are shown as unavailable until their mining is ported to the Go backend
> ([backend-go/architecture.md](backend-go/architecture.md) §12).

---
If you encounter any issues, please open an issue in the repository.

## Citations

To cite this tool in your work, use the following bibtex:

```
@inproceedings{neves2025raise,
  title={RAISE: A Self-Hosted Platform for Mining and Managing Data from GitHub and Jira},
  author={Neves, Breno and Coutinho, Daniel and Sardenberg, Eduardo and Alesi, Arthur and Machado, Marcelo and Arriel, Johny and Cavalvante, Ana Lu{\'\i}sa and Carvalho, Robbie and Pereira, Juliana Alves},
  booktitle={Simp{\'o}sio Brasileiro de Componentes, Arquiteturas e Reutiliza{\c{c}}{\~a}o de Software (SBCARS)},
  pages={112--122},
  year={2025},
  organization={SBC}
}
```