#!/bin/bash
set -e

# Carrega variáveis de ambiente do arquivo .env.deploy (não versionado)
ENV_FILE="$(dirname "$0")/.env.deploy"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "Erro: arquivo $ENV_FILE não encontrado."
  echo "Crie o arquivo com a variável: NEXT_PUBLIC_API_URL=https://..."
  exit 1
fi

echo "==> git pull"
git pull

echo "==> Parando container antigo (se existir)"
sudo docker stop front-warner 2>/dev/null || true
sudo docker rm   front-warner 2>/dev/null || true

echo "==> Build da imagem"
sudo docker build \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  -t front-warner .

echo "==> Iniciando container"
sudo docker run -d \
  --name front-warner \
  -p 3001:3000 \
  --restart always \
  front-warner

echo "==> Logs (Ctrl+C para sair)"
sudo docker logs -f front-warner
