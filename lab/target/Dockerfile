# Replica minima del entorno de la VPS para medir el riesgo real:
# Ubuntu 24.04, usuario 'ubuntu' con sudo SIN contrasena (igual que cloud-init), motor y canarios.
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git sudo nodejs npm inotify-tools bubblewrap socat jq \
    && rm -rf /var/lib/apt/lists/*
# Igual que produccion (docs/Despliegue en la VPS.md, seccion 17: es lo que se quiere medir y luego quitar).
RUN id ubuntu >/dev/null 2>&1 || useradd -m -s /bin/bash ubuntu; \
    echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-lab-ubuntu && chmod 440 /etc/sudoers.d/90-lab-ubuntu
WORKDIR /home/ubuntu/BaweStudiosLinux
# El codigo del laboratorio y el motor se copian al construir (nada se monta desde la PC).
COPY canaries /lab/canaries
RUN bash /lab/canaries/plant.sh
USER ubuntu
CMD ["bash", "-c", "sudo inotifywait -m -r -e modify,create,delete,move,access --format '%T %w%f %e' --timefmt '%F %T' /etc /root /srv /home/ubuntu /tmp 2>/dev/null | tee /tmp/lab-fs-events.log"]
