# User activity flows

The deliverable 1 table in [notes.md](../notes.md), drawn out. Each section covers a group of rows and shows the
order things happen in.

- [How to read these diagrams](#how-to-read-these-diagrams)
- [Pages that never call the backend](#pages-that-never-call-the-backend): home, about, history
- [Logging in, registering, and logging out](#logging-in-registering-and-logging-out): the token's life
- [Close-up: every request after login](#close-up-every-request-after-login)
- [Ordering and verifying a pizza](#ordering-and-verifying-a-pizza)
- [Diner pages](#diner-pages): profile, franchise as a diner
- [Franchisee pages](#franchisee-pages): view franchise, create and close stores
- [Admin pages](#admin-pages): view all, create and close franchises
- [Who is allowed to do what](#who-is-allowed-to-do-what)

## How to read these diagrams

Every request that reaches the backend passes through the same five layers, and every diagram draws all five:

```mermaid
flowchart LR
  page["page<br/>views/*.tsx"]:::fe --> svc["httpPizzaService.ts"]:::fe --> router["router<br/>routes/*Router.js"]:::be --> db["database.js"]:::be --> mysql[("MySQL")]:::db
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef be fill:#ccfbf1,stroke:#0f766e,color:#134e4a
  classDef db fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
```

- **Routers never write SQL.** Every query lives in `database.js`, so an arrow into MySQL always comes from
  `database.js`.
- **Requests are drawn hop by hop** (solid arrows). None are skipped.
- **Responses are drawn once** (dashed arrows): from the layer that produced the answer to the next layer that
  does something with it. A layer that only passes the response along isn't drawn. For example, in Login the
  response stops at `httpPizzaService` because it saves the token there, but in most other flows it goes straight
  back to the page.

## Pages that never call the backend

**Rows: View home page, View About page, View History page.**

```mermaid
flowchart LR
  click["click a link"] --> route["Routes in app.tsx<br/>matches the URL"]:::fe --> page["home.tsx / about.tsx / history.tsx<br/>renders static content"]:::fe
  page -. "no fetch" .-> none["backend not involved"]
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
```

Clicking a link in a React app doesn't reload the page. React Router swaps which component is shown. Open the
browser's **Network** tab while you click these pages: no requests to `localhost:3000` appear.

## Logging in, registering, and logging out

### Login

**Rows: Login new user, Login as franchisee, Login as admin.** The flow is the same for all three; only the roles
that come back differ.

```mermaid
sequenceDiagram
  actor You
  participant V as login.tsx
  participant S as httpPizzaService
  participant R as authRouter.js
  participant D as database.js
  participant M as MySQL
  You->>V: submit email + password
  V->>S: pizzaService.login(email, password)
  S->>R: PUT /api/auth  body: email, password
  Note over R: setAuthUser runs first, but there is no token yet
  R->>D: DB.getUser(email, password)
  D->>M: SELECT * FROM user WHERE email=?
  Note over D: bcrypt.compare(password, stored hash)<br/>wrong password = 404 unknown user
  D->>M: SELECT * FROM userRole WHERE userId=?
  D-->>R: id, name, email, roles
  R->>R: setAuth: jwt.sign(user, jwtSecret)
  R->>D: DB.loginUser(user.id, token)
  D->>M: INSERT INTO auth (token, userId) ... stores only the signature
  R-->>S: user + token
  S->>S: localStorage.setItem('token', token)
  S-->>V: user
  V->>V: setUser(user), then go up one path level
```

### Register

**Row: Register new user.** Identical to login except for the first half: it creates the user instead of looking
one up.

```mermaid
sequenceDiagram
  participant V as register.tsx
  participant S as httpPizzaService
  participant R as authRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.register(name, email, password)
  S->>R: POST /api/auth  body: name, email, password
  Note over R: 400 if any field is missing
  R->>D: DB.addUser(name, email, password, roles: diner)
  Note over D: bcrypt.hash(password)
  D->>M: INSERT INTO user (name, email, password)
  D->>M: INSERT INTO userRole (userId, 'diner', 0)
  D-->>R: user with its new id
  R->>R: setAuth: jwt.sign(user, jwtSecret)
  R->>D: DB.loginUser(user.id, token)
  D->>M: INSERT INTO auth (token, userId)
  R-->>S: user + token
  S->>S: localStorage.setItem('token', token)
  S-->>V: user
```

Registering always creates a **diner**. Nothing in the request can make you a franchisee or admin.

### Logout

**Row: Logout.**

```mermaid
sequenceDiagram
  actor You
  participant V as logout.tsx
  participant S as httpPizzaService
  participant R as authRouter.js
  participant D as database.js
  participant M as MySQL
  You->>V: click Logout. The page acts as soon as it opens.
  V->>S: pizzaService.logout()
  S->>R: DELETE /api/auth  + Bearer token (not awaited)
  S->>S: localStorage.removeItem('token')
  V->>V: setUser(null), navigate to /
  R->>D: setAuthUser: DB.isLoggedIn(token)
  D->>M: SELECT userId FROM auth WHERE token=?
  R->>D: DB.logoutUser(token)
  D->>M: DELETE FROM auth WHERE token=?
```

**Why keep tokens in a table at all?** A JWT is valid as long as its signature checks out, so on its own it can't
be cancelled. Deleting the row from `auth` is what makes logout real: the token still has a valid signature, but
`setAuthUser` no longer finds it and treats the request as anonymous.

## Close-up: every request after login

This diagram zooms in on the space between `httpPizzaService` and the router. The other diagrams draw that
space as a single arrow. Every request that carries a token passes through these steps before the route handler
runs, which is why most rows in notes.md begin with `SELECT userId FROM auth WHERE token=?`.

```mermaid
sequenceDiagram
  participant S as httpPizzaService
  participant A as setAuthUser
  participant G as authenticateToken
  participant H as route handler
  participant D as database.js
  participant M as MySQL
  S->>A: any request + Authorization: Bearer token
  A->>D: DB.isLoggedIn(token)
  D->>M: SELECT userId FROM auth WHERE token=?
  alt row found
    A->>A: jwt.verify(token, jwtSecret) sets req.user
  else no row, or bad signature
    A->>A: req.user stays empty
  end
  A->>G: next()
  alt route needs a user and req.user is empty
    G-->>S: 401 unauthorized
  else
    G->>H: next(). The handler may still say 403 for the wrong role.
  end
```

`setAuthUser` is defined in `authRouter.js`, but `service.js` registers it for every request, not just
`/api/auth` ones. `authenticateToken` only runs on routes that list it.

## Ordering and verifying a pizza

**Rows: Order pizza, Verify pizza.**

### What the order object picks up along the way

```mermaid
flowchart LR
  A["menu.tsx: selectPizza<br/>items: menuId, description, price"]:::fe
  B["menu.tsx: checkout<br/>+ storeId<br/>+ franchiseId"]:::fe
  C["payment.tsx<br/>login gate, then POST"]:::fe
  D["orderRouter + DB.addDinerOrder<br/>+ id (from MySQL)<br/>diner and date saved in the row"]:::be
  E["Factory<br/>+ jwt: the signed pizza"]:::fx
  G["payment.tsx<br/>gets order + jwt back from orderRouter"]:::fe
  F["delivery.tsx<br/>state: order + jwt"]:::fe
  A --> B --> C --> D --> E --> G --> F
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef be fill:#ccfbf1,stroke:#0f766e,color:#134e4a
  classDef fx fill:#fef3c7,stroke:#b45309,color:#78350f
```

### 1. The menu page loads

```mermaid
sequenceDiagram
  actor You
  participant Menu as menu.tsx
  participant S as httpPizzaService
  participant OR as orderRouter.js
  participant FR as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  Menu->>S: pizzaService.getMenu()
  S->>OR: GET /api/order/menu
  OR->>D: DB.getMenu()
  D->>M: SELECT * FROM menu
  D-->>Menu: menu items
  Menu->>S: pizzaService.getFranchises(0, 20, '*')
  S->>FR: GET /api/franchise?page=0&limit=20&name=*
  FR->>D: DB.getFranchises(req.user, page, limit, name)
  D->>M: SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ... OFFSET ...
  loop each franchise (caller is not an admin)
    D->>M: SELECT id, name FROM store WHERE franchiseId=?
  end
  D-->>Menu: franchises with stores, for the store picker
  You->>Menu: pick pizzas and a store, click Checkout
  Menu->>Menu: navigate /payment, state: order
```

If an admin opens the menu, `getFranchises` loads each franchise's admins and revenue instead (see
[the admin page](#view-the-admin-page)). The picker only uses the store ids and names.

### 2. Paying

```mermaid
sequenceDiagram
  actor You
  participant Pay as payment.tsx
  participant S as httpPizzaService
  participant UR as userRouter.js
  participant OR as orderRouter.js
  participant D as database.js
  participant M as MySQL
  participant F as Factory
  Pay->>S: pizzaService.getUser()
  S->>UR: GET /api/user/me
  Note over UR: returns req.user from the token.<br/>No query of its own beyond setAuthUser's.
  UR-->>S: user, or 401
  S->>S: on 401, localStorage.removeItem('token') and return null
  S-->>Pay: user or null. If null, go to /payment/login.
  You->>Pay: click Pay now
  Pay->>S: pizzaService.order(order)
  S->>OR: POST /api/order  body: franchiseId, storeId, items
  OR->>D: DB.addDinerOrder(req.user, order)
  D->>M: INSERT INTO dinerOrder (dinerId, franchiseId, storeId, now())
  loop each item
    D->>M: SELECT id FROM menu WHERE id=?
    D->>M: INSERT INTO orderItem (orderId, menuId, description, price)
  end
  D-->>OR: order with its new id
  OR->>F: POST /api/order  diner + order, with the factory API key
  F-->>OR: jwt + reportUrl
  OR-->>Pay: order, jwt, followLinkToEndChaos
  Pay->>Pay: navigate /delivery, state: order + jwt
```

### 3. Verifying

```mermaid
sequenceDiagram
  actor You
  participant Del as delivery.tsx
  participant S as httpPizzaService
  participant F as Factory
  You->>Del: click Verify
  Del->>S: pizzaService.verifyOrder(jwt)
  S->>F: POST {factory}/api/order/verify  body: jwt
  Note over S,F: straight to the Factory. Our backend is not involved.
  F-->>Del: message + decoded payload, shown in a pop-up
```

**Things to notice while stepping through:**

- The order is saved in MySQL **before** the Factory is called. If the Factory fails, the order row stays and the
  user gets a 500.
- The prices saved in `orderItem` are the ones the browser sent. The server doesn't look them up from the menu.
- `limit` arrives from the URL as the string `"20"`, so `limit + 1` in `getFranchises` is `"201"`. Put a breakpoint
  there and look at it.

## Diner pages

### View profile page

**Row: View profile page.** Click your initials in the header to open `/diner-dashboard`.

```mermaid
sequenceDiagram
  participant V as dinerDashboard.tsx
  participant S as httpPizzaService
  participant R as orderRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.getOrders(user)
  S->>R: GET /api/order  + token
  Note over R: diner = req.user from the token, never from the URL
  R->>D: DB.getOrders(req.user, page)
  D->>M: SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT offset, 10
  D->>M: SELECT id, menuId, description, price FROM orderItem WHERE orderId=?  (per order)
  D-->>V: dinerId, orders with items, page
```

### View franchise as a diner

**Row: View franchise (as diner).**

```mermaid
sequenceDiagram
  participant V as franchiseDashboard.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.getFranchise(user)
  S->>R: GET /api/franchise/:userId  (your own id)
  Note over R: allowed: it's you
  R->>D: DB.getUserFranchises(userId)
  D->>M: SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?
  Note over D: no rows, so return [] right away
  D-->>V: []
  V->>V: no franchise, so show the "why franchise" pitch
```

## Franchisee pages

### View franchise as a franchisee

**Row: View franchise (as franchisee).** It starts the same as the diner version, but the first query finds rows,
so the database keeps going.

```mermaid
sequenceDiagram
  participant V as franchiseDashboard.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.getFranchise(user)
  S->>R: GET /api/franchise/:userId
  R->>D: DB.getUserFranchises(userId)
  D->>M: SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?
  D->>M: SELECT id, name FROM franchise WHERE id in (...)
  loop each franchise: DB.getFranchise
    D->>M: admins: userRole JOIN user WHERE objectId=? AND role='franchisee'
    D->>M: stores: dinerOrder JOIN orderItem RIGHT JOIN store, SUM(price) per store
  end
  D-->>V: franchises with admins and stores (totalRevenue)
  V->>V: show the first franchise's stores
```

### Create or close a store

**Rows: Create a store, Close a store.** Create store is only reached from the franchise dashboard. Close store is
reached from the franchise dashboard or, for an admin, from the admin dashboard. The permission check needs the
franchise's admin list, so both routes run `DB.getFranchise` first.

```mermaid
sequenceDiagram
  participant P as franchiseDashboard.tsx or adminDashboard.tsx
  participant V as createStore.tsx / closeStore.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  P->>V: navigate, state: franchise (+ store to close)
  V->>S: pizzaService.createStore(franchise, store)  or  closeStore(franchise, store)
  S->>R: POST /api/franchise/:franchiseId/store  (or DELETE .../store/:storeId)
  R->>D: DB.getFranchise(id)
  D->>M: SELECT admins (userRole JOIN user)
  D->>M: SELECT stores with totalRevenue
  D-->>R: franchise with admins
  alt you are an admin, or in franchise.admins
    R->>D: DB.createStore / DB.deleteStore
    D->>M: INSERT INTO store (franchiseId, name)  or  DELETE FROM store WHERE franchiseId=? AND id=?
    D-->>V: new store  or  message: store deleted
    V->>P: go up one level, and that dashboard reloads
  else anyone else
    R-->>V: 403 unable to create a store
  end
```

## Admin pages

### View the admin page

**Row: View Admin page.** The request goes out as soon as the page opens, for anyone. The admin check on the page
only decides what to show afterwards.

```mermaid
sequenceDiagram
  participant V as adminDashboard.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.getFranchises(page, 3, '*')
  S->>R: GET /api/franchise?page=0&limit=3&name=*  + token
  R->>D: DB.getFranchises(req.user, page, limit, name)
  D->>M: SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ... OFFSET ...
  alt caller is admin
    loop each franchise: DB.getFranchise
      D->>M: admins: userRole JOIN user
      D->>M: stores with totalRevenue
    end
  else anyone else
    loop each franchise
      D->>M: SELECT id, name FROM store WHERE franchiseId=?
    end
  end
  D-->>V: franchises, more (is there a next page?)
  V->>V: Role.isRole(user, admin)? Show the table. If not, render NotFound.
```

The same endpoint returns less for non-admins: store ids and names, with no admins and no revenue. Hiding the
page with `NotFound` protects nothing. The backend's reply is what keeps the admin data private.

### Create a franchise

**Row: Create a franchise for t@jwt.com.**

```mermaid
sequenceDiagram
  participant V as createFranchise.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.createFranchise(franchise)
  S->>R: POST /api/franchise  body: name, admins: email t@jwt.com
  Note over R: 403 unless req.user is an admin
  R->>D: DB.createFranchise(franchise)
  D->>M: SELECT id, name FROM user WHERE email=?  (404 if unknown)
  D->>M: INSERT INTO franchise (name)
  D->>M: INSERT INTO userRole (userId, 'franchisee', franchiseId)
  D-->>V: franchise with id and filled-in admins
```

t@jwt.com's token still says "diner" until they log in again, because tokens are snapshots. The franchise dashboard
still works for them right away: `getUserFranchises` reads `userRole` from the database, not from the token.

### Close a franchise

**Row: Close the franchise for t@jwt.com.**

```mermaid
sequenceDiagram
  participant V as closeFranchise.tsx
  participant S as httpPizzaService
  participant R as franchiseRouter.js
  participant D as database.js
  participant M as MySQL
  V->>S: pizzaService.closeFranchise(franchise)
  S->>R: DELETE /api/franchise/:franchiseId  + token
  Note over R: NO authenticateToken and NO admin check on this route
  R->>D: DB.deleteFranchise(id)
  D->>M: BEGIN TRANSACTION
  D->>M: DELETE FROM store WHERE franchiseId=?
  D->>M: DELETE FROM userRole WHERE objectId=?
  D->>M: DELETE FROM franchise WHERE id=?
  D->>M: COMMIT (or ROLLBACK if any step fails)
  R-->>V: message: franchise deleted
```

## Who is allowed to do what

Permission is checked in two places, and only one of them actually protects anything:

```mermaid
flowchart LR
  user["a request"] --> fe{"Frontend<br/>navItems constraints<br/>+ page role checks"}:::fe
  fe -- "hides links and pages<br/>(anyone can bypass with curl)" --> be{"Backend<br/>authenticateToken = 401<br/>role / owner check = 403"}:::be
  be -- "allowed" --> db[("database.js")]:::db
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef be fill:#ccfbf1,stroke:#0f766e,color:#134e4a
  classDef db fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
```

What the **backend** enforces:

| Action | Not logged in | Diner | Franchisee | Admin |
| --- | --- | --- | --- | --- |
| See menu, list franchises | ✅ | ✅ | ✅ | ✅ (also sees admins and revenue) |
| Order, see own orders | 401 | ✅ | ✅ | ✅ |
| See a user's franchises | 401 | own only (else `[]`) | own only | anyone's |
| Create or close a store | 401 | 403 | ✅ only in their own franchise | ✅ |
| Create a franchise, add menu item | 401 | 403 | 403 | ✅ |
| **Close a franchise** | ⚠️ allowed | ⚠️ allowed | ⚠️ allowed | ✅ |

The ⚠️ row is a deliberate hole in the course code: `DELETE /api/franchise/:franchiseId` never checks who is
calling. Later deliverables have you find and fix holes like this one.
