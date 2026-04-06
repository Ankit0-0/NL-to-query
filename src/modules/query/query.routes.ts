import { Router } from "express";
import { QueryController } from "./query.controller";

const queryRouter = Router();

queryRouter.post("/", QueryController.handleQuery);

export default queryRouter;