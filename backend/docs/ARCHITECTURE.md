The backend architecture is fairly simple.
It consits of few components namely
- index 
- server
- app

### Index file
`index.js` handles 
- connecting with database
- server starting from `server.js` with a default port of 4000
- importing assembled app from `app.js`

### Server file
`server.js` contains the function to start the nodejs server. It also contains the code to handle the shut down condition.

### App file
`app.js` assembles the different apps that may be needed in the application and returns it.
This can be considered as the heart of the backend as most of the processes will be channeled through this file only.
It handles
- express app creation 
- CORS
- Middleware loading
- Plugin loading
- Error handling


A very important file is registry.js

### Registry File
`registry.js` is a file where the module registry class is defined. It allows the registry of modules, services, authenticators and resolvers.
This is used to reduce import statements by registering modules, services authenticators and resolvers beforehand and storing them in a map data structure which later can be used via app locals.


