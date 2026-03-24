FROM nginx:alpine

# Enable gzip compression and optimize caching
RUN echo 'gzip on;' > /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_vary on;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_proxied any;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_comp_level 6;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;' >> /etc/nginx/conf.d/gzip.conf && \
    echo 'expires 30d;' > /etc/nginx/conf.d/cache.conf && \
    echo 'add_header Cache-Control "public, max-age=2592000";' >> /etc/nginx/conf.d/cache.conf && \
    echo 'location ~* \.(html)$ { expires 1h; add_header Cache-Control "public, max-age=3600"; }' >> /etc/nginx/conf.d/cache.conf

COPY . /usr/share/nginx/html

EXPOSE 80