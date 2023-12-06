import fastify from "fastify";
import path from "path";

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "dist"),
  prefix: "/",
});

fastify.setNotFoundHandler(function (request, reply) {
  reply.sendFile("index.html");
});

fastify.listen(
  { port: process.env.PORT || 3000, host: process.env.HOST || "0.0.0.0" },
  (err, address) => {
    if (err) throw err;
  }
);