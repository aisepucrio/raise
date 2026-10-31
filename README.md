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
decrypted without it. The other values in `.env.example` work as they are for
local use; each one is described in the file.

Platform tokens (GitHub, Jira, Stack Overflow) don't go in `.env`. You add them
through the API once it is running (step 5).

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

### 5. Create an admin and add tokens

Create the first user:

```sh
docker compose run --rm -it migrate raisectl user create -username admin -role admin
```

Then log in and add a GitHub token as described in
[Adding platform credentials](backend-go/README.md#adding-platform-credentials-admin) in the backend README.

### 6. Access the Application

The API runs at <http://localhost:8000>, with interactive docs at
<http://localhost:8000/api/docs>. The web interface runs at
<http://localhost:5173>.

> **Note:** the web interface still targets the previous Django API and has
> not been migrated to the Go backend yet, so its pages can't load data. Use
> the API directly in the meantime. The migration is tracked in
> [backend-go/architecture.md](backend-go/architecture.md) §12.

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