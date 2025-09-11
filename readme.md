build image:
    docker build -f Dockerfile . -t transcendance:latest 


run: 
    docker run -it --rm -p 8080:8080 transcendance:latest /bin/bash
