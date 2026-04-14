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

Copy the example environment file and fill in the required values:

```sh
cp .env.example .env
```

Open the newly created `.env` file in a text editor. Replace all placeholder values (such as `<YOUR_GITHUB_TOKEN>` and `<https://your-domain.atlassian.net>`) with your actual credentials and configuration values.

For example:

- `GITHUB_TOKEN`: Replace `<YOUR_GITHUB_TOKEN>` with a valid GitHub personal access token.
- `JIRA_URL`: Replace `<https://your-domain.atlassian.net>` with your actual JIRA instance URL.
- Update any other variables as needed for your environment.

Save the file after making your changes.

### 4. Build and Start the Containers

In the root directory of the project (where the `docker-compose.yaml` file is located), run:

```sh
docker compose up --build
```

If setting up a production environment, run the following command instead:

```sh
docker compose --profile production up --build
```

Changes to `.env` and to `backend/dataminer_api/settings.py` might be needed to adjust security/host/port configurations to your production needs.

### 5. Access the Application

Once the containers are running, you will be able to access our web interface via [http://localhost:5173]() and our API via [http://localhost:8000]().

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