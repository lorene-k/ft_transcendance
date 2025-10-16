FROM node:20

RUN apt-get update && apt-get install -y curl unzip

RUN curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
    | tee /etc/apt/trusted.gpg.d/ngrok.asc > /dev/null
RUN echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
    | tee /etc/apt/sources.list.d/ngrok.list

RUN apt-get update && apt-get install -y ngrok

EXPOSE 8080
EXPOSE 4040

COPY start.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 8080
EXPOSE 4040

ENTRYPOINT ["./entrypoint.sh"]

CMD ["npm", "run", "prod"]
