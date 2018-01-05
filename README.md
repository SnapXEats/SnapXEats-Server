# SnapX-eats

### Requirements

You will need these tools to set up a local development environment:

* [NPM](https://www.npmjs.com/)
* [NodeJS](https://nodejs.org/)
* [Mysql Server](https://www.mysql.com/)

### Setup & init

In order to change Node's server environment (which by default is `local`) run this :
``` 
export NODE_ENV="dev"
```

*NOTE* : check `config/` **YML** environment files

#### Create a user database on your local machine :

```
username : "test"
password : "4f1070d6e58"
database : "test"
hostname : "localhost"
```

**Live auto reload on files changes , enabled by default on `local` environment !!!**

#### Running the server :

```sh
$ npm install
$ npm start
```

**API url** [http://localhost:3000/](http://localhost:3000/)

**API Docs url** [http://localhost:3000/docs](http://localhost:3000/docs)

**Tests**

```sh
$ npm test
```

**Eslint**

```
$ npm run eslint
```

**JS inspect ( duplicated code check )**

```
$ npm run jsinspect
```
