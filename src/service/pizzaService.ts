/**
 * @fileoverview The shapes of the data the frontend and backend exchange, plus the PizzaService interface:
 * the full list of operations the frontend can ask for.
 *
 * NOTE: these types are hand-written and looser than what the backend actually sends. For example, ids
 * are declared `string` but arrive as JSON numbers.
 */

/** User roles, matching the strings the backend stores in userRole.role. */
enum Role {
  Diner = 'diner',
  Franchisee = 'franchisee',
  Admin = 'admin',
}

namespace Role {
  /**
   * Does this user have the given role? Safe to call with `null` (not logged in), which returns false.
   * Pages use it to decide what to show; the backend makes its own check.
   */
  export function isRole(user: User | null, role: Role): boolean {
    return user != null && Array.isArray(user.roles) && !!user.roles.find((r) => r.role === role);
  }
}

/** The whole menu, from GET /api/order/menu. */
type Menu = Pizza[];

/** One menu item. `price` is in tiny bitcoin-like units, e.g. 0.0038. */
type Pizza = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
};

/** One pizza inside an order. The description and price are copied from the menu when the pizza is picked. */
type OrderItem = {
  menuId: string;
  description: string;
  price: number;
};

/** An order. The menu page fills in items, storeId, and franchiseId; the backend adds id and date. */
type Order = {
  id: string;
  franchiseId: string;
  storeId: string;
  date: string;
  items: OrderItem[];
};

/** Response from POST /api/order. `jwt` is the signed pizza from the Factory, which the delivery page verifies. */
type OrderResponse = {
  order: Order;
  jwt: string;
};

/** Response from GET /api/order. (The backend actually sends `{ dinerId, orders, page }`, with no `id`.) */
type OrderHistory = {
  id: string;
  dinerId: string;
  orders: Order[];
};

/** One role a user has. `objectId` is the franchise id when the role is franchisee, and absent otherwise. */
type UserRole = {
  role: Role;
  objectId?: string;
};

/** A user. Every field is optional because different calls send different parts (login sends a password, /me doesn't). */
type User = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  roles?: UserRole[];
};

/** A store. `totalRevenue` (the sum of its order item prices) is only included when a franchisee or admin fetches it. */
type Store = {
  id: string;
  name: string;
  totalRevenue?: number;
};

/** A franchise. When creating one, `admins` holds just emails; the backend fills in each admin's id and name. */
type Franchise = {
  id: string;
  admins?: { email: string; id?: string; name?: string }[];
  name: string;
  stores: Store[];
};

/** One page of franchises from GET /api/franchise. `more` is true when there is another page. */
type FranchiseList = {
  franchises: Franchise[];
  more: boolean;
};

/** One endpoint's documentation, as listed by GET /api/docs. */
type Endpoint = {
  requiresAuth: boolean;
  method: string;
  path: string;
  description: string;
  example: string;
  response: any;
};

/** The response from GET /api/docs. */
type Endpoints = {
  endpoints: Endpoint[];
};

/** The Factory's answer when it verifies a pizza JWT: a message and the decoded contents. */
type JWTPayload = {
  message: string;
  payload: string;
};

/**
 * Everything the frontend can ask the backend (or the Factory) to do. Pages only know this interface;
 * HttpPizzaService is the implementation that makes real HTTP calls.
 */
interface PizzaService {
  /** Log in and remember the token. [PUT] /api/auth */
  login(email: string, password: string): Promise<User>;
  /**
   * Create a diner account and log in. [POST] /api/auth
   * NOTE: the real implementation and every caller use (name, email, password); these parameter names are wrong.
   */
  register(email: string, password: string, role: string): Promise<User>;
  /** Log out and forget the token. [DELETE] /api/auth */
  logout(): void;
  /** The user for the saved token, or null. [GET] /api/user/me */
  getUser(): Promise<User | null>;
  /** All pizzas. [GET] /api/order/menu */
  getMenu(): Promise<Menu>;
  /** The logged-in diner's orders. [GET] /api/order */
  getOrders(user: User): Promise<OrderHistory>;
  /** Place an order and get back the pizza JWT. [POST] /api/order */
  order(order: Order): Promise<OrderResponse>;
  /** Ask the Factory whether a pizza JWT is genuine. [POST] {factory}/api/order/verify */
  verifyOrder(jwt: string): Promise<JWTPayload>;
  /** The franchises this user runs. [GET] /api/franchise/:userId */
  getFranchise(user: User): Promise<Franchise[]>;
  /** Create a franchise (admin). [POST] /api/franchise */
  createFranchise(franchise: Franchise): Promise<Franchise>;
  /** One page of franchises; `*` in nameFilter is a wildcard. [GET] /api/franchise?page&limit&name */
  getFranchises(page: number, limit: number, nameFilter: string): Promise<FranchiseList>;
  /** Delete a franchise. [DELETE] /api/franchise/:franchiseId */
  closeFranchise(franchise: Franchise): Promise<void>;
  /** Add a store to a franchise. [POST] /api/franchise/:franchiseId/store */
  createStore(franchise: Franchise, store: Store): Promise<Store>;
  /** Close a store. [DELETE] /api/franchise/:franchiseId/store/:storeId */
  closeStore(franchise: Franchise, store: Store): Promise<null>;
  /** API documentation for 'service' or 'factory'. [GET] /api/docs */
  docs(docType: string): Promise<Endpoints>;
}

export { Role, PizzaService, User, Menu, Pizza, OrderHistory, Order, Franchise, FranchiseList, Store, OrderItem, Endpoint, Endpoints, OrderResponse, JWTPayload };
