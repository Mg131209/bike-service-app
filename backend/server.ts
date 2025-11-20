import express, { json, Request, request, response } from "express";
import cors from "cors";
import { insertOne, runQuery, selectMany, selectOne } from "./database";

const port = 80;

const bcrypt = require("bcrypt");
type Bike = {
  id: string;
  name: string;
  user_id: User["id"];
};

const bikes_schema = `
CREATE TABLE IF NOT EXISTS bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) references users(id) ON DELETE CASCADE)`;

type Maintenance = {
  id: string;
  name: string;
  date: Date;
  bikeId: string;
};
async function hash(input: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(input, salt);
  return hashedPassword;
}
function randomHex(): string {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
}
const calculateKeyExpiryDate = (): Date => {
  const currentDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(currentDate.getDate() + 1);
  console.log(expiryDate);
  return expiryDate;
};
const maintenances_schema = `
CREATE TABLE IF NOT EXISTS maintenances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATETIME NOT NULL,
  bike_id TEXT NOT NULL,
  FOREIGN KEY (bike_id) references bikes(id) ON DELETE CASCADE
)`;
const user_schema = `
CREATE TABLE IF NOT EXISTS users(
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
password TEXT NOT NULL,
key TEXT NOT NULL,
keyExpiryDate DATETIME NOT NULL)`;
type User = {
  id: string;
  name: string;
  password: string;
  key: string;
  keyExpiryDate: Date;
};
type MaintenanceType = {
  id: string;
  name: string;
  userId: User["id"];
};

const maintenance_types_schema = `
CREATE TABLE IF NOT EXISTS maintenance_types (
id TEXT primary KEY,
name TEXT NOT NULL,
user_id TEXT NOT NULL,
FOREIGN KEY (user_id) references users(id) ON DELETE CASCADE)`;

runQuery(bikes_schema);
runQuery(maintenances_schema);
runQuery(maintenance_types_schema);
runQuery(user_schema);
runQuery("PRAGMA foreign_keys = on");

const app = express();
app.use(express.json());
app.use(cors());

const bikeExisting = (id: Bike["id"]): Bike | null => {
  const sql = "SELECT * FROM bikes WHERE id = ?";
  return selectOne<Bike>(sql, [id]);
};
const userExisting = (id: User["id"]): User | null => {
  const sql = "SELECT * FROM users WHERE id = ?";
  return selectOne<User>(sql, [id]);
};
const authorizeUser = (request: Request): User | null => {
  const key = request.headers.authorization;
  const userId = request.params.userId;

  const sql = "SELECT * FROM users WHERE id = ? AND key = ?";
  const data = selectOne<User>(sql, [userId, key]);
  if (!data) {
    console.warn("no user");
    return null;
  }

  if (new Date(data.keyExpiryDate).getTime() < new Date().getTime()) {
    console.warn("your token has expired");
    return null;
  }
  return data;
};
const maintenanceExisting = (id: Maintenance["id"]): Maintenance | null => {
  const sql = "SELECT * FROM maintenances WHERE id = ?";
  return selectOne<Maintenance>(sql, [id]);
};
const typeExisting = (id: MaintenanceType["id"]): MaintenanceType | null => {
  const sql = "SELECT * FROM maintenances WHERE id = ?";
  return selectOne<MaintenanceType>(sql, [id]);
};
app.get("/bikes/:userId", (request, response) => {
  if (!authorizeUser(request)) {
    return response.status(401).send();
  }
  const sql = "SELECT * FROM bikes WHERE user_id = ?";
  const data = selectMany<Bike>(sql, [request.params.userId]);
  4;

  console.log(`found ${data.length} bikes`);

  return response.json(data);
});

app.post("/bikes/:userId", (request, response) => {
  if (userExisting(request.params.userId)) {
    const sql =
      "INSERT INTO bikes (id, name, user_id) VALUES (HEX(randomblob(4)), ?,?) returning id, name";
    const data = insertOne<Bike>(sql, [
      request.body.name,
      request.params.userId,
    ]);
    console.log(`created bike ${data.id.substring(0, 4)}`);

    return response.json(data);
  } else {
    return response.status(404).send("NO such user found");
  }
});

app.patch("/bikes/:id", (request, response) => {
  if (bikeExisting(request.params.id) === null) {
    console.warn(`bike ${request.params.id} not found`);
    return response.status(404).send();
  }

  const sql = "UPDATE bikes SET name = ? WHERE id = ?";
  runQuery(sql, [request.body.name, request.params.id]);
  console.log(`updated bike ${request.params.id.substring(0, 4)}`);

  return response.status(200).send();
});

app.delete("/bikes/:id", (request, response) => {
  if (bikeExisting(request.params.id) === null) {
    console.warn(`bike ${request.params.id} not found`);
    return response.status(404).send();
  }

  const sql = "DELETE FROM bikes WHERE id = ?";
  runQuery(sql, [request.params.id]);
  console.log(`deleted bike ${request.params.id.substring(0, 4)}`);

  return response.status(200).send();
});

app.get("/bikes/:userId/:id/maintenances", (request, response) => {
  if (!authorizeUser(request)) {
    return response.status(401).send();
  }
  if (bikeExisting(request.params.id) === null) {
    console.warn(`bike ${request.params.id} not found`);
    return response.status(404).send();
  }

  const sql = "SELECT * FROM maintenances WHERE bike_id = ?";
  const data = selectMany<Maintenance>(sql, [request.params.id]);
  return response.json(data);
});

app.post("/bikes/:userid/:id/maintenances", (request, response) => {
  if (bikeExisting(request.params.id) === null) {
    console.warn(`bike ${request.params.id} not found`);
    return response.status(404).send();
  }
  if (!authorizeUser(request)) {
    return response.status(401).send();
  }
  console.log(request.body);
  const sql =
    "INSERT INTO maintenances (id, name, date, bike_id) VALUES (HEX(randomblob(4)), ?, ?, ?) returning id, name, date, bike_id";
  const data = insertOne<Maintenance>(sql, [
    request.body.name,
    request.body.date,
    request.params.id,
  ]);
  return response.json(data);
});
app.delete("/maintenances/:id", (request, response) => {
  if (maintenanceExisting(request.params.id) === null) {
    console.warn(`maintenance ${request.params.id} not found`);
  }
  console.log(request.params.id);
  const sql = "DELETE FROM  maintenances WHERE id = ?";
  runQuery(sql, [request.params.id]);
  return response.status(200).send();
});

app.get("/maintenance_types/:userId", (request, response) => {
  authorizeUser(request);
  const sql = "SELECT * FROM maintenance_types WHERE user_Id = ?";
  const data = selectMany<MaintenanceType>(sql, [request.params.userId]);
  return response.json(data);
});
app.post("/maintenance_types", (request, response) => {
  const sql =
    "INSERT INTO maintenance_types (id, name) VALUES (HEX(randomblob(4)), ? ) returning id, name";
  const data = insertOne<MaintenanceType>(sql, [request.body.name]);
  return response.json(data);
});
app.delete("/maintenance_types/:id", (request, response) => {
  if (typeExisting(request.params.id) === null) {
    console.warn("maintenance type not found");
  }
  const sql = " DELETE FROM maintenance_types WHERE id = ?";
  runQuery(sql, [request.params.id]);
  return response.status(200).send();
});
//login
app.post("/users/login", async (request, response) => {
  const user: User = request.body;

  const sql = "SELECT * FROM users WHERE   name = ?";
  const data = selectOne<User>(sql, [user.name]);
  if (!data) {
    return response.status(404).send("no such user");
  }
  try {
    console.log("try fired");
    if (data !== null && (await bcrypt.compare(user.password, data.password))) {
      console.log("if fired");
      const key = randomHex();
      const userId = data.id;
      const updateSql =
        "UPDATE users SET key = ?, keyExpiryDate = ? WHERE id = ?";
      runQuery(updateSql, [
        key,
        calculateKeyExpiryDate().toISOString(),
        userId,
      ]);
      console.log("new key:" + key);

      return response.json({ key, userId });
    } else {
      return response.status(401).send();
    }
  } catch (error) {
    console.error(error);
    return response.status(500).send();
  }
});
//create user
app.post("/users", async (request, response) => {
  try {
    randomHex();
    const hashedPassword = await hash(request.body.password);
    const sql =
      "INSERT INTO users(id, name, password, key, keyExpiryDate) VALUES(HEX(randomblob(4)),?,?,?,?) returning id, name";
    const data = insertOne<User>(sql, [
      request.body.name,
      hashedPassword,
      randomHex(),
      calculateKeyExpiryDate().toISOString(),
    ]);
    calculateKeyExpiryDate();
    response.status(201).send();
  } catch (error) {
    console.log("something went wrong", error);
    response.status(500).send();
  }
});
app.get("/", async (request, response) => {
  console.log("request incoming");
  return response.send("get Works!");
});
app.listen(port, () => console.log(`listening on 0.0.0.0:${port}`));
