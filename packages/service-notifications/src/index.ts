import express, { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import onError from "./middlewares/onError";
import logger, { stream } from "./lib/logger";
import traceId from "./middlewares/traceId";
import mongoose from "./lib/db";
import jwt from "./middlewares/jwt";
import webPushSubscriptionsController from "./controllers/webPushSubscriptions";
import "./lib/queue";

const app: any = express();
const port = process.env.PORT || 3000;
const apmUrl = process.env.APM_URL;
const router: Router = Router();
let startTime: Date;

if (apmUrl) {
  const path = require("path");
  const info = require(path.resolve(path.join(__dirname, "../package.json")));

  require("elastic-apm-node").start({
    serviceName: info.name,
    secretToken: process.env.APM_TOKEN || "",
    serverUrl: apmUrl
  });
}

mongoose.connection.on("error", err => {
  logger.error(`${err}`);
  process.exit(1);
});

router.get("/managment/heath", (req: Request, res: Response) => {
  res.status(200).json({
    startTime,
    status: "up"
  });
});

router.post("/web-push", webPushSubscriptionsController.create);
router.delete("/web-push/:hash", webPushSubscriptionsController.deleteRecord);
router.get("/web-push/:hash", webPushSubscriptionsController.checkIfExists);

router.all("*", (req: Request, res: Response) => {
  res.status(404).json({ status: "not found" });
});

app.use(jwt);
app.use(onError);
app.use(traceId);
app.use(
  morgan(
    (tokens, req, res) => {
      return [
        res.get("x-traceid"),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, "content-length"),
        "-",
        tokens["response-time"](req, res),
        "ms"
      ].join(" ");
    },
    { stream }
  )
);
app.use(bodyParser.json());
app.use("/", router);

const server = app.listen(port, () => {
  logger.info(`Notifications service started on port ${port}`);
  startTime = new Date();
});

app.close = () => server.close();

export default app;
