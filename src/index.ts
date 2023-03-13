import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'express'
import path from 'node:path';
import { constants } from "http2";
import bcrypt from 'bcrypt';
import { Depot } from "depot-db";


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

interface Password {
  password: string
}

interface Email {
  email: string
}

interface User extends Password, Email {

}

const db = new Depot<User>(path.join(path.resolve(), '/db/users'));

async function hashPassword(userPassword: string): Promise<string> {
  const salt:string = await bcrypt.genSalt(1);
  const hashedPassword = await bcrypt.hash(userPassword, salt);
  return hashedPassword;
}

function findUser(userEmail: string, password: string): Promise<User[]> {
  return db.find({ where: u => u.email == userEmail && bcrypt.compareSync(password,u.password) })
}

app.get('/', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/login.html'));
});

app.get('/findAll', async function(_:Request, res:Response){
  res.json(await db.find({}));
});

app.get('/registration', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/register.html'));
});

app.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body as User;
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/login.html'));
    user.password = await hashPassword(user.password);
    await db.put(user.email, user);
  } catch (err) {
    next(err)
  }
});

app.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body as User;
    const u = await findUser(user.email, user.password);
    if (u.length == 1) {
      //user found
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/game.html'));
    } else {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(constants.HTTP_STATUS_UNAUTHORIZED).sendFile(path.join(path.resolve() + '/static/login.html'));
    }
  } catch (error) { next(error) };
});

app.listen(3000);