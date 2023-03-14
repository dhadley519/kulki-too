import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'express'
import path from 'node:path';
import { constants } from "http2";
import bcrypt from 'bcrypt';
import { Depot } from "depot-db";
import { JwtPayload, Secret, sign, SignOptions, verify } from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { AddBall, MovePath, RemoveBall, Statistics } from './client-board';
import {ServerBoard, ServerBoardCreator} from './server-board'
const private_key = `-----BEGIN RSA PRIVATE KEY-----\nMIIJKAIBAAKCAgEAmaVXal9/dUkmnLf430AAIgHj90r5sBsGuEZ47Fx9Oth7fvqU\nHUyWN6kxArRCQdbQs55v4W8t13zowNY9eLrR+a647cSYna/3ptJgkSYsAeDAcStp\nmWukIvgFnLetpSuKoWUTA9h0jz9GDqKAnLHAqIIXD3gNXJCCtPhXa/d8P1VNJFdj\ni5/tdQMQ5cEuqxG6JeYSFFkGxSUEGMgm9zBIBMVGH4+Oe4f4o7Le8UFYaMACREHd\nhYFuvZ4nzWI/NFSEjdqDRZiab7Wixp63dWuz/Bb5LgVCF7RcgMJfBHamzmHR1UPK\nOVofjME15n29xTNJn13laMeWNhy2llWTXt6iA+HaJ3oWNR/uKNbjBFiiZKgk8f32\n0CF5aK8TnmuErvlosWx0kKBfpkBQ4d5ysSOwZyYrE/PuOsaMQATiYS2mL0DcveMR\nSerJG7UNBPV1jXax3pkCi6zIQtPdS2s+uHD37HLt+dR5dE3R/WG7XK9KRUmOWmt5\nlV+c66zubzhb6Jzo4T87j8d0jyDtKYhxi0xdl00fO4CKJ5IaLQamgjvk2KCGdq6A\n81uLnFQ3tEu7KmrBS/npKsPvelUTcQx5TOrrNWdMH8y42VrR5K8ZlxgfBUNJvqep\nONUDJqBmeySNjlC8iklpqhtij23IO2ssEYbTpSboqBfKVFcaiJ5DVWJn4WUCAwEA\nAQKCAgAViSlhjZUt+VziJp9Jm4zpN16esPGij4c3mRkl+CjNcL6Oo8zS9oMvthVa\nja2j0Npb8t83t/+y7p0pOl5PZ9A6sRTWrvG9WIbb6S0D61fLw5b1xeH9USsmg6E1\nwEEkn5/E04gAx/w+f93v+zMPw5J/jAxzbJ5i1RadCxol1gCiV/CCIYWgcoA0IIPj\n0FocPFXdLgxmsbvTMkcKujNL/oZ5tLUJg3OzOPHO8Clzo3ci55bpvlmwdt3w0hQ+\nI4E8coRJ5dD0llk/QzRXprOMT9ZghU/T9YS4Ed3NZnEvDPqAfxGMVP4pX8qATiyh\n7AoHdBLjtaOMNj2FxCyLkd8gMxB+RzROpYMoGfivMLr094Di8XNh/T/hSXWu7P9o\nHZo3AI14FQRQYVOL+LGEZsSHpg6MbUdq/HWTm7ZiUmViJd5SYemjMJRa7+GSrm0Y\nXZqT1j5VudCKDrPPJbXg+dEJhYe2Vx9/5uZbyi8pf+waUHOvn/TfLfKeDxGtw6q8\nwYKRlchMTk3//+xR9I+G5hoBT096SgBPL88toh6WFvzq84wwJM4qWuf7LpM0c829\nCzfT8tastfl0RH3alq08labzxNYsu9aUYJF1s5mRr1uI/K8/q+QIs8k1nuxJJmy4\nwC1uYPi2t1gvFrPQyvZa0cCjf5gMW982p9+nfm0nilgxvQyNWQKCAQEAyiloEBGL\naZ2eipO1ScFDZcm+Ed0j7BaFU0LJ+PRj737JcgNu8xLnUnxtT3Lic9O4eph7t3d6\nG+L1OzJL7jGPr+imZuS4v1itkHJnHc22kzHKKd7DH7q2SNqQHNGnyDWfkQAIsuRL\nYJB2pPBdPalKpgvKtgSL3/VJ16ZJheR3uJqQbBJp2HL3/lDVBPxpfG0ckuLGGPyq\no0F8xjzHaen/nAKDUuUyieQ/tEZr3m50G1Dm8SDMv3/4mzjFVlTFYAEx1IfbOloC\niXvd7yK3hbmvCJxlYJtBZnG49ojRpzSVqfi0obSBM6g5zVqD5hiHIUjzCP+d1SA5\nnLN0Xp/QWyj4FwKCAQEAwpBQHMWw3uzLXAYF6xmwxcZmkc9cPo5L5vtTf+5qgjya\nJ+mKTiil1zcGBjHY+2FSpzq+68v4+xcJjcddq8uQ5p7lF7+ro174CUyQDk6tAd9H\ninGKQhcj05t81Wuwqg/yEE6d9eCqDeQs+H+UPwUGWnsPmjUbSZjk9W2XOftlServ\nKCav8Mfn7eXcvryMLXGwXGoEs3TP46MekSXYA3FMJH/2ANv1sqc4wf4ULLtfkKJK\ntVb90RkyHmiZA8wXS1HdK4+XJFml6CcdocbRhR+2Hu2nF2biMUKO+XY8uMITZNp4\n9n6jDlQSOA6UdVFfshTQN4+t0XQ5b90+ELcxRtVj4wKCAQEAtexNGSiwrHqLEWma\n2qRwYkkKIkk+6lXZ5PNVjhNfW0ZdQZyVW2jHghM2yyg3YMRGXwyZSKDb4fx7cqnw\naolvJH3YQP/SwV6r0jEhWlCk3BESPFuafBMptqX4yfZhZmnbDkFZkqKesmdOXV9w\niOyvoH08DlBJD2FM8iNSRosysY1mKdroJUBQqytShwoeYzpNXGF2o0W8yO1Fu582\nVLmerGYWh6J5uF0OdsxoheIf2fUT3ioGFs6yifysmOPwOlTY4sjfH8OgRNiS/3/e\nZxiRys3y7NzKHcZ5DGJTSISpqiuFYX9uRW49le6+g3HPKMTc8FwXTJOTRNC5B+4J\nMf/MQQKCAQBBCWJuK7sS2Y6kxTKnQuAvTEGvDeSk2IYQwQRJaFXcEQvquYtM0xOU\nnET8Px9r8D1jvyRgx78Dl9DOvszWB2b5YDXuOVjTdIRu/1PMJIp6bLuKUKfJrdiA\n/KG+6Y+VWV0uDEmLDj1qBVLvAh547mIQTsCJaKUldeFbFPYPILTb/5dQEZaQYxJp\nGIQwkfA9pJoyWhIWNr7jNfyawk6x3+Z28Ps3kE9SF8nGNvthdITeYRGeCmUvxz9U\noNw9Q7SprcTDsezw7rKhpqmmEUKqQE5tij1nejG0C66lPtvPWriG5uy2YOB6gqnQ\naTdA/CGD8qcjW3jb4gDtHsSHa+Uh62THAoIBACsbkVg2cV0/dmu/luyXgFa808Ny\nxC7fuF/U2y69nigOCwgbp/QyJqUofd9VeoqGaSdq0cwxmr5NOgV9+HzDXY6gTQcy\nCLuQaKIsXLp3MdIy6FYh03qzArZBZEDlf5i2Z9U2Gq61jFVFQRWs13EtbMyfdJ3R\nWugDv5fkX1misbKi4xoCCRfqftaWhSQ4DX5FUf78LK66S4wHlJZy0V8RF1QM9nCu\nyosdpirC/Uc+Qk3VnsfMUk5UjJ9c+eO2IkRNP5NzsDttMksXLktKgFhjuEFRHNel\nOhpQ8kuZs38Vs2CdG84hiEjbjVvAMWlcdO9+bu3Qb8k5XK4j4gQiWosBOqU=\n-----END RSA PRIVATE KEY-----\n%`

const public_key = `-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAmaVXal9/dUkmnLf430AA\nIgHj90r5sBsGuEZ47Fx9Oth7fvqUHUyWN6kxArRCQdbQs55v4W8t13zowNY9eLrR\n+a647cSYna/3ptJgkSYsAeDAcStpmWukIvgFnLetpSuKoWUTA9h0jz9GDqKAnLHA\nqIIXD3gNXJCCtPhXa/d8P1VNJFdji5/tdQMQ5cEuqxG6JeYSFFkGxSUEGMgm9zBI\nBMVGH4+Oe4f4o7Le8UFYaMACREHdhYFuvZ4nzWI/NFSEjdqDRZiab7Wixp63dWuz\n/Bb5LgVCF7RcgMJfBHamzmHR1UPKOVofjME15n29xTNJn13laMeWNhy2llWTXt6i\nA+HaJ3oWNR/uKNbjBFiiZKgk8f320CF5aK8TnmuErvlosWx0kKBfpkBQ4d5ysSOw\nZyYrE/PuOsaMQATiYS2mL0DcveMRSerJG7UNBPV1jXax3pkCi6zIQtPdS2s+uHD3\n7HLt+dR5dE3R/WG7XK9KRUmOWmt5lV+c66zubzhb6Jzo4T87j8d0jyDtKYhxi0xd\nl00fO4CKJ5IaLQamgjvk2KCGdq6A81uLnFQ3tEu7KmrBS/npKsPvelUTcQx5TOrr\nNWdMH8y42VrR5K8ZlxgfBUNJvqepONUDJqBmeySNjlC8iklpqhtij23IO2ssEYbT\npSboqBfKVFcaiJ5DVWJn4WUCAwEAAQ==\n-----END PUBLIC KEY-----\n%`;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

interface Password {
  password: string
}

interface Email {
  email: string
}

interface User extends Password, Email {
}

const db = new Depot<User>(path.join(path.resolve(), '/db/users'));

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

async function hashPassword(userPassword: string): Promise<string> {
  const salt: string = await bcrypt.genSalt(getRandomInt(10));
  const hashedPassword = await bcrypt.hash(userPassword, salt);
  return hashedPassword;
}

function findUser(userEmail: string, password: string): Promise<User[]> {
  return db.find({ where: u => u.email == userEmail && bcrypt.compareSync(password, u.password) })
}

function findUserByEmail(userEmail: string): Promise<User[]> {
  return db.find({ where: u => u.email == userEmail });
}

/** eveny legal call push the jwt forward */
async function refreshJwtCookie(res: Response, email: string): Promise<express.Response<any, Record<string, any>>> {
  const findResult: User[] = await findUserByEmail(email);
  if (findResult.length == 1) {
    //user found
    const user = findResult[0];
    user.password = '';
    const secret: Secret = Buffer.from(private_key, 'utf-8');
    const token: string = sign({ user: user }, secret, getSignOptions());
    res.clearCookie('kulki');
    res.cookie('kulki', token, { httpOnly: true });
  }
  return res;
}

/** refresh jwt and then call the wrapped function */
async function jwtWrap(req: Request, res: Response, wrapped: (req: Request, res: Response) => any): Promise<any> {
  try {
    const token = req?.cookies?.kulki;
    if (token) {
      const decoded_token: JwtPayload = verify(token, public_key) as JwtPayload;
      if (decoded_token && decoded_token.exp) {
        const now: number = Date.now();
        const tokenExpiresAt = decoded_token.exp * 1000;
        if (tokenExpiresAt > now) {
          res = await refreshJwtCookie(res, decoded_token.user.email);
          return wrapped(req, res);
        } else {
          res.clearCookie('kulki');
        }
      }
    }
  } catch (error) {
    console.error(JSON.stringify(error));
  }
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/login.html'));
  return;
}

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

/** return the login unless there is a valid token, then go straight in to the game */
app.get('/', function (req: Request, res: Response): void {
  jwtWrap(req, res, (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/game.html'));
  });
});

/** delete this call it's just to look at the user database during development */
app.get('/findAll', async function (req: Request, res: Response) {
  jwtWrap(req, res, async (_req: Request, res: Response) => {
    res.json(await db.find({}));
  });
});

/** return page with form to register new user */
app.get('/registration', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/register.html'));
});

/** add a new user to the database */
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

function getSignOptions(): SignOptions {
  const signOptions: SignOptions = {}
  signOptions.algorithm = 'RS256';
  signOptions.expiresIn = '1h'; //expires in a hour
  return signOptions;
}

/** login and go the the game page */
app.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body as User;
    const u = await findUser(user.email, user.password);
    if (u.length == 1) {
      await refreshJwtCookie(res, u[0].email);
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(constants.HTTP_STATUS_OK).sendFile(path.join(path.resolve() + '/static/game.html'));
    } else {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(constants.HTTP_STATUS_UNAUTHORIZED).sendFile(path.join(path.resolve() + '/static/login.html'));
      return;
    }
  } catch (error) { next(error) };
});

app.get('/favicon.ico', function (_: Request, res: Response): void {
  res.setHeader("Content-Type", "image/x-icon");
  res.status(200).sendFile(path.join(path.resolve() + '/static/favicon.ico'));
});

app.get('/start', function (req: Request, res: Response): void {
  req.cookies
  checkBoard(true);
  res.status(200).json(board.onStartMessageReceipt());
});
app.get('/statistics', function (req: Request, res: Response): void {
  req.cookies
  checkBoard();
  const stats: Statistics = { emptyTileCount: board.emptyTileCount, score: board.score };
  res.status(200).json(stats);
});
app.post('/hover', function (req: Request, res: Response): void {
  checkBoard();
  const pathApproval = board.onPathFindReceipt(req.body as MovePath);
  res.status(200).json(pathApproval);
});
app.post('/move', function (req: Request, res: Response): void {
  checkBoard()
  const moves: (AddBall | RemoveBall)[] = board.onMoveMessageReceipt(req.body as MovePath);
  res.status(200).json(moves);
});

let board: ServerBoard;

function checkBoard(restart = false) {
  if (!board || restart) {
    board = ServerBoardCreator.create({ width: 9, depth: 9 });
  }
}


app.listen(3000);
