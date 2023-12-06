# Bundle static assets with nginx
FROM nginx:1.23.2-alpine as react-fan-answer
ENV NODE_ENV production
# Copy built assets from `builder` image
COPY /dist /usr/share/nginx/html
# Add your nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 80
# Start nginx
CMD ["nginx", "-g", "daemon off;"]