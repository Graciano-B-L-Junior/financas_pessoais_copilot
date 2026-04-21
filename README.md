# Finanças Pessoais - Scaffold inicial

Este repositório contém um scaffold mínimo para o backend Django/DRF do sistema de finanças pessoais.

Arquivos criados:
- `api/` - projeto Django mínimo (settings, apps, models)

Como usar (dev local com Docker Compose):

```bash
docker-compose up --build
```

Para desenvolvimento local sem Docker:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r api/requirements.txt
python api/manage.py migrate
python api/manage.py runserver
```
