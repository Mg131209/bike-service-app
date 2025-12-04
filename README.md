# Bike Service App
A app vore loging the services you do on your bike

 ## Frontend
 The frontend is Build with **Angular**.
 To run the frontend you can go to * * /dist/bike-service-app/browser * * ther is Html css and Javascript you can deploy on a webserver or run localy.

 To make a new build or run it for dev You have to install Angular
 # Install Angular
 **With Bun**
 ```
bun install -g @angular/cli
```
**Or Npm**
```
npm install -g @angular/cli
```
**To Make a new build**
 Run:
 ```
 ng build
```
 an open the file  */dist/bike-service-app/browser* again you will see 
 Vor testing Run:
 ```
ng serve
```
This will open a port on your device you can visit it on Localhosht (Standart is 4200)

## Backend
Adjust the port at the top of **server.ts** to your liking (standard is 80).
``` typescript
const port = 80;
```   
To run the backend install bun
# Mac/Linux
```
curl -fsSL https://bun.com/install | bash
```
# Windows
```
powershell -c "irm bun.sh/install.ps1|iex"
```

Run the script like this:
```
bun run server.ts
```
Or for developement with hot reload:
```
bun --watch  server.ts
```
This will open the port you specified and serve the Api over it.
You can deploy this on your server and run it like this.

To acses the api run
```
Curl localhost:<the port you specified>
```
you can replace localhost with your public ip to acess it from outside if you have the port vorwarded.
