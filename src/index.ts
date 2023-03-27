import express, { Request, Response } from 'express';
import bodyParser from 'express'
import path from 'node:path';
import { constants } from "http2";
import cors from 'cors';
import cookieParser from "cookie-parser";
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
    origin: ['http://127.0.0.1:8080'
    , 'http://127.0.0.1:3000'
    , 'http://localhost:8080'
    , 'http://localhost:3000'
  ]}));
app.use(cookieParser());

app.get('/css/colors.css', function (req:Request, res:Response){
  res.setHeader("Content-Type", "text/css; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/css/colors.css'));
});
app.get('/css/menu.css', function (req:Request, res:Response){
  res.setHeader("Content-Type", "text/css; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/css/menu.css'));
});
app.get('/css/style.css', function (req:Request, res:Response){
  res.setHeader("Content-Type", "text/css; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/css/style.css'));
});
app.get('/dist/client-board.js', function (req:Request, res:Response){
  res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/dist/client-board.js'));
});

app.get('/dist/login.js', function (req:Request, res:Response){
  res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/dist/login.js'));
});

app.get('/dist/register.js', function (req:Request, res:Response){
  res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/dist/register.js'));
});

/** return the login unless there is a valid token, then go straight in to the game */
app.get('/', function (req: Request, res: Response): void {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/login.html'));
});

/** return page with form to register new user */
app.get('/registration', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/register.html'));
});

app.get('/game', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/game.html'));
});

app.get('/favicon.ico', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "image/x-icon");
  res.status(200).sendFile(path.join(path.resolve() + '/static/favicon.ico'));
});

app.listen(3000);
