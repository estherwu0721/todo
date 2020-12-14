docker stop some-nginx
docker run --rm --name some-nginx -v `pwd`:/usr/share/nginx/html:ro -p 80:80 -d nginx
