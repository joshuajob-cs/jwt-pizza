/**
 * @fileoverview The real PizzaService: turns each method into an HTTP request to the JWT Pizza Service
 * (or, for verify and factory docs, to the JWT Pizza Factory).
 *
 * Where requests go is set by environment files that Vite reads at build time:
 *   VITE_PIZZA_SERVICE_URL   .env.development -> http://localhost:3000
 *   VITE_PIZZA_FACTORY_URL   -> https://pizza-factory.cs329.click
 */
import { PizzaService, Franchise, FranchiseList, Store, OrderHistory, User, Menu, Order, Endpoints, OrderResponse, JWTPayload } from './pizzaService';

const pizzaServiceUrl = import.meta.env.VITE_PIZZA_SERVICE_URL;
const pizzaFactoryUrl = import.meta.env.VITE_PIZZA_FACTORY_URL;

class HttpPizzaService implements PizzaService {
  /**
   * Sends one request and returns the parsed JSON response. Every other method goes through here.
   *
   * - Adds `Authorization: Bearer <token>` when a token is saved in localStorage. This is how the backend
   *   knows who you are.
   * - A path starting with `/` is prefixed with the service URL; a full `http...` URL is used as-is.
   * - On a non-2xx response it rejects with `{ code, message }`, which pages catch and display.
   *
   * @param path - e.g. `/api/order`, or a full URL
   * @param method - HTTP method, default GET
   * @param body - object to send as JSON
   */
  async callEndpoint(path: string, method: string = 'GET', body?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const options: any = {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        };

        const authToken = localStorage.getItem('token');
        if (authToken) {
          options.headers['Authorization'] = `Bearer ${authToken}`;
        }

        if (body) {
          options.body = JSON.stringify(body);
        }

        if (!path.startsWith('http')) {
          path = pizzaServiceUrl + path;
        }

        const r = await fetch(path, options);
        const j = await r.json();
        if (r.ok) {
          resolve(j);
        } else {
          reject({ code: r.status, message: j.message });
        }
      } catch (e: any) {
        reject({ code: 500, message: e.message });
      }
    });
  }

  /** [PUT] /api/auth. Saves the returned token in localStorage so later requests are authenticated. */
  async login(email: string, password: string): Promise<User> {
    const { user, token } = await this.callEndpoint('/api/auth', 'PUT', { email, password });
    localStorage.setItem('token', token);
    return Promise.resolve(user);
  }

  /** [POST] /api/auth. Creates a diner, then saves the token exactly like login. */
  async register(name: string, email: string, password: string): Promise<User> {
    const { user, token } = await this.callEndpoint('/api/auth', 'POST', { name, email, password });
    localStorage.setItem('token', token);
    return Promise.resolve(user);
  }

  /**
   * [DELETE] /api/auth, then forget the token.
   * The request isn't awaited; it has already read the token before removeItem runs, so it still authenticates.
   */
  logout(): void {
    this.callEndpoint('/api/auth', 'DELETE');
    localStorage.removeItem('token');
  }

  /**
   * [GET] /api/user/me, but only if a token is saved. If the backend rejects the token (e.g. logged out
   * elsewhere), the stale token is removed and null is returned.
   */
  async getUser(): Promise<User | null> {
    let result: User | null = null;
    if (localStorage.getItem('token')) {
      try {
        result = await this.callEndpoint('/api/user/me');
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
    return Promise.resolve(result);
  }

  /** [GET] /api/order/menu */
  async getMenu(): Promise<Menu> {
    return this.callEndpoint('/api/order/menu');
  }

  /** [GET] /api/order. `user` is unused; the backend identifies the diner from the token. */
  async getOrders(user: User): Promise<OrderHistory> {
    return this.callEndpoint('/api/order');
  }

  /** [POST] /api/order. Resolves with the saved order and the Factory's pizza JWT. */
  async order(order: Order): Promise<OrderResponse> {
    return this.callEndpoint('/api/order', 'POST', order);
  }

  /** [POST] {factory}/api/order/verify. Goes straight to the Factory; our backend isn't involved. */
  async verifyOrder(jwt: string): Promise<JWTPayload> {
    return this.callEndpoint(pizzaFactoryUrl + '/api/order/verify', 'POST', { jwt });
  }

  /** [GET] /api/franchise/:userId, the franchises this user runs. */
  async getFranchise(user: User): Promise<Franchise[]> {
    return this.callEndpoint(`/api/franchise/${user.id}`);
  }

  /** [POST] /api/franchise (admin only on the backend). */
  async createFranchise(franchise: Franchise): Promise<Franchise> {
    return this.callEndpoint('/api/franchise', 'POST', franchise);
  }

  /** [GET] /api/franchise?page&limit&name. The numbers become text in the URL, so the backend receives strings. */
  async getFranchises(page: number = 0, limit: number = 10, nameFilter: string = '*'): Promise<FranchiseList> {
    return this.callEndpoint(`/api/franchise?page=${page}&limit=${limit}&name=${nameFilter}`);
  }

  /** [DELETE] /api/franchise/:franchiseId */
  async closeFranchise(franchise: Franchise): Promise<void> {
    return this.callEndpoint(`/api/franchise/${franchise.id}`, 'DELETE');
  }

  /** [POST] /api/franchise/:franchiseId/store with body `{ id, name }`. */
  async createStore(franchise: Franchise, store: Store): Promise<Store> {
    return this.callEndpoint(`/api/franchise/${franchise.id}/store`, 'POST', store);
  }

  /** [DELETE] /api/franchise/:franchiseId/store/:storeId */
  async closeStore(franchise: Franchise, store: Store): Promise<null> {
    return this.callEndpoint(`/api/franchise/${franchise.id}/store/${store.id}`, 'DELETE');
  }

  /** [GET] /api/docs on the Factory when docType is 'factory', otherwise on our service. */
  async docs(docType: string): Promise<Endpoints> {
    if (docType === 'factory') {
      return this.callEndpoint(pizzaFactoryUrl + `/api/docs`);
    }
    return this.callEndpoint(`/api/docs`);
  }
}

/** The single shared instance; service.ts hands it to the pages. */
const httpPizzaService = new HttpPizzaService();
export default httpPizzaService;
