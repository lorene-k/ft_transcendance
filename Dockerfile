FROM node:20

# Installer curl et unzip pour ngrok
RUN apt-get update && apt-get install -y curl unzip

# Ajouter la clé GPG et le dépôt ngrok
RUN curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
    | tee /etc/apt/trusted.gpg.d/ngrok.asc > /dev/null
RUN echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
    | tee /etc/apt/sources.list.d/ngrok.list

RUN apt-get update && apt-get install ngrok


# Installer ngrok
RUN apt-get install -y ngrok

# Exposer les ports
EXPOSE 8080
EXPOSE 4040

# Donner les droits au script
COPY start.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 8080
EXPOSE 4040

# Lancer le script au démarrage du conteneur
ENTRYPOINT ["./entrypoint.sh"]

CMD ["npm", "run", "prod"]
