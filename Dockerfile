FROM nginx:alpine

# Enable gzip compression
RUN echo 'gzip on;' > /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_vary on;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_proxied any;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_comp_level 6;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;' >> /etc/nginx/conf.d/gzip.conf

# Custom nginx config with caching rules inside server block
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location ~* \\.(html)$ {\n\
        expires 1h;\n\
        add_header Cache-Control "public, max-age=3600";\n\
    }\n\
    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 30d;\n\
        add_header Cache-Control "public, max-age=2592000";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html

EXPOSE 80