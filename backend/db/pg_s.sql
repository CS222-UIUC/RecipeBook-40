create table "recipe" (
  "id" serial primary key,
  "name" varchar(255) not null,
  "description" TEXT null,
  "recipe" TEXT null
)

create table "fridge" (
  "id" serial primary key,
  "user" INT null,
  "name" varchar(255) not null,
  "description" TEXT null,
  "amount" DOUBLE null
)

create table "users" (
  "id" serial primary key,
  "user" VARCHAR(255) not null,
  "name" varchar(255) not null,
  "password" varchar(255) not null,
  "salt" varchar(255) not null
)