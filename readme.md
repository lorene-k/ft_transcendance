build image:
    docker build -f Dockerfile . -t transcendance:latest 


run 
    docker run -it --rm -p 8080:8080 transcendance:latest /bin/bash


si le tsc pete dans le build: build manuellement et relancer le build
    npx tsc --build